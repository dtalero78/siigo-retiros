const twilio = require('twilio');

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Formatear número para WhatsApp
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    cleaned = '57' + cleaned;
  }
  
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return `whatsapp:${cleaned}`;
}

/**
 * Enviar plantilla aprobada con botón URL dinámico
 * 
 * IMPORTANTE: La plantilla debe estar aprobada por WhatsApp
 * y configurada con un botón de tipo "Visit Website"
 * 
 * @param {string} to - Número de destino
 * @param {string} templateSid - Content SID de la plantilla (ej: "HXb1234567890")
 * @param {Object} templateVariables - Variables para el body de la plantilla
 * @param {string} buttonUrlVariable - Variable para agregar al final de la URL del botón
 * @returns {Promise<Object>}
 */
async function sendTemplateWithUrlButton(to, templateSid, templateVariables = {}, buttonUrlVariable = '') {
  if (!client) {
    return {
      success: false,
      error: 'Cliente de Twilio no configurado'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    console.log(`📱 Enviando plantilla con botón URL a: ${formattedTo}`);
    console.log(`📄 Template SID: ${templateSid}`);
    console.log(`🔗 URL variable: ${buttonUrlVariable}`);
    
    // Preparar todas las variables para la plantilla
    // IMPORTANTE: El orden y número de variables debe coincidir exactamente con la plantilla
    const allVariables = {
      ...templateVariables
    };
    
    // Si hay una variable para el botón URL, agregarla
    if (buttonUrlVariable) {
      // Determinar el siguiente número de variable
      const variableCount = Object.keys(templateVariables).length;
      const buttonVariableKey = (variableCount + 1).toString();
      allVariables[buttonVariableKey] = buttonUrlVariable;
    }
    
    // Configurar parámetros del mensaje
    const messageParams = {
      to: formattedTo,
      contentSid: templateSid,
      contentVariables: JSON.stringify(allVariables)
    };
    
    // Usar Messaging Service si está disponible, sino usar número directo
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = twilioWhatsAppNumber;
    }
    
    // Enviar mensaje con plantilla
    const message = await client.messages.create(messageParams);

    console.log(`✅ Plantilla con botón enviada. SID: ${message.sid}`);
    console.log(`📊 Estado: ${message.status}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      to: formattedTo
    };

  } catch (error) {
    console.error('❌ Error enviando plantilla con botón:', error.message);
    
    // Manejo de errores específicos
    if (error.code === 63016) {
      return {
        success: false,
        error: 'La plantilla no está aprobada o no existe. Verifica el Content SID.',
        code: error.code
      };
    }
    
    if (error.code === 63007) {
      return {
        success: false,
        error: 'Error con las variables de la plantilla. Verifica que coincidan con la configuración.',
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Enviar invitación de encuesta usando plantilla con botón
 * 
 * @param {Object} user - Datos del usuario (debe incluir id, phone, first_name)
 * @param {string} templateSid - Content SID de la plantilla aprobada
 * @returns {Promise<Object>}
 */
async function sendSurveyTemplateWithButton(user, templateSid) {
  if (!user.phone) {
    return {
      success: false,
      error: 'Usuario sin número de teléfono'
    };
  }

  if (!user.id) {
    return {
      success: false,
      error: 'Usuario sin ID en la base de datos'
    };
  }

  if (!templateSid) {
    return {
      success: false,
      error: 'Content SID de la plantilla no proporcionado'
    };
  }

  // Variables para el body de la plantilla
  const bodyVariables = {
    '1': user.first_name || 'Colaborador'
  };

  // ID del usuario para agregar a la URL del botón
  // Esto se agregará al final de la URL base configurada en la plantilla
  // Ejemplo: https://www.siigo.digital/?user= + {user.id}
  const buttonUrlVariable = user.id.toString();

  return await sendTemplateWithUrlButton(
    user.phone, 
    templateSid, 
    bodyVariables, 
    buttonUrlVariable
  );
}

/**
 * Enviar plantilla de disculpas con botón para reenvío
 * 
 * @param {Object} user - Datos del usuario
 * @param {string} templateSid - Content SID de la plantilla de disculpas
 * @returns {Promise<Object>}
 */
async function sendApologyTemplateWithButton(user, templateSid) {
  if (!user.phone || !user.id) {
    return {
      success: false,
      error: 'Usuario sin teléfono o ID'
    };
  }

  const bodyVariables = {
    '1': user.first_name || 'Colaborador'
  };

  const buttonUrlVariable = user.id.toString();

  return await sendTemplateWithUrlButton(
    user.phone,
    templateSid,
    bodyVariables,
    buttonUrlVariable
  );
}

/**
 * Listar plantillas disponibles con información de botones
 */
async function listTemplatesWithButtons() {
  if (!client) {
    return {
      success: false,
      error: 'Cliente no configurado'
    };
  }

  try {
    console.log('📋 Buscando plantillas con botones...\n');
    
    // Obtener lista de contenido/plantillas
    const contents = await client.content.v2.contents.list({ limit: 20 });
    
    const templatesWithButtons = [];
    
    for (const content of contents) {
      // Verificar si tiene botones
      const hasButton = content.types?.['twilio/quick-reply'] || 
                       content.types?.['twilio/call-to-action'];
      
      if (hasButton || content.friendlyName?.toLowerCase().includes('button')) {
        templatesWithButtons.push({
          sid: content.sid,
          name: content.friendlyName,
          status: content.status,
          language: content.language,
          variables: content.variables || {},
          hasButton: true,
          created: content.dateCreated
        });
      }
    }

    return {
      success: true,
      templates: templatesWithButtons,
      count: templatesWithButtons.length
    };

  } catch (error) {
    console.error('Error listando plantillas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Instrucciones para configurar la plantilla en Twilio
 */
function getTemplateSetupInstructions() {
  return `
📋 CONFIGURACIÓN DE PLANTILLA CON BOTÓN EN TWILIO:

1. Ve a Twilio Console > Messaging > Content Editor

2. Crea nueva plantilla WhatsApp con:
   - Tipo de acción del botón: "Visit Website"
   - Texto del botón: "Iniciar Encuesta" (máx 20 caracteres)
   - URL del sitio web: https://www.siigo.digital/?user=
   - Categoría: UTILITY

3. Variables de la plantilla:
   - {{1}} = Nombre del empleado (en el body)
   - Variable del botón = ID del usuario (se agrega automáticamente a la URL)

4. Una vez aprobada (24-48 horas), obtendrás un Content SID (HXxxxx)

5. Usa ese SID en tu código:
   await sendSurveyTemplateWithButton(user, 'HXxxxx')

IMPORTANTE: 
- La URL base debe terminar con = o /
- Twilio agregará automáticamente el ID al final
- Solo UNA variable puede agregarse a la URL del botón
`;
}

module.exports = {
  sendTemplateWithUrlButton,
  sendSurveyTemplateWithButton,
  sendApologyTemplateWithButton,
  listTemplatesWithButtons,
  getTemplateSetupInstructions,
  formatPhoneNumber
};