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
 * Enviar mensaje usando plantilla aprobada
 * IMPORTANTE: Esto permite enviar a usuarios que NO han iniciado conversación
 * 
 * @param {string} to - Número de destino
 * @param {string} templateSid - SID de la plantilla aprobada (ej: "HXxxxx")
 * @param {Object} variables - Variables para la plantilla
 * @returns {Promise<Object>}
 */
async function sendTemplateMessage(to, templateSid, variables = {}) {
  if (!client) {
    return {
      success: false,
      error: 'Cliente de Twilio no configurado'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    console.log(`📱 Enviando plantilla a: ${formattedTo}`);
    
    // Configurar parámetros del mensaje
    const messageParams = {
      to: formattedTo,
      contentSid: templateSid,
      contentVariables: JSON.stringify(variables)
    };
    
    // Usar Messaging Service si está disponible, sino usar número directo
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = twilioWhatsAppNumber;
    }
    
    // Enviar mensaje con plantilla
    const message = await client.messages.create(messageParams);

    console.log(`✅ Plantilla enviada. SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };

  } catch (error) {
    console.error('❌ Error enviando plantilla:', error.message);
    
    // Si la plantilla no existe o no está aprobada
    if (error.code === 63016) {
      return {
        success: false,
        error: 'La plantilla no está aprobada o no existe. Verifica en Twilio Console.'
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
 * Enviar invitación de encuesta usando plantilla
 * @param {Object} user - Datos del usuario
 * @param {string} templateSid - SID de la plantilla en Twilio
 */
async function sendSurveyInvitationTemplate(user, templateSid) {
  if (!user.phone) {
    return {
      success: false,
      error: 'Usuario sin número de teléfono'
    };
  }

  const formUrl = process.env.FORM_URL || 'https://www.siigo.digital';
  const surveyUrl = `${formUrl}/?id=${user.identification}`;
  
  // Variables para la plantilla
  // Ajusta según las variables definidas en tu plantilla
  const variables = {
    "1": user.first_name || "Colaborador",
    "2": surveyUrl,
    "3": user.area || "tu área",
    "4": "5-10 minutos"
  };

  return await sendTemplateMessage(user.phone, templateSid, variables);
}

/**
 * Crear una plantilla de mensaje programáticamente
 * NOTA: Las plantillas deben ser aprobadas por WhatsApp antes de usarse
 */
async function createMessageTemplate() {
  console.log('\n📋 INSTRUCCIONES PARA CREAR PLANTILLA:\n');
  console.log('1. Ve a Twilio Console: https://console.twilio.com');
  console.log('2. Navega a: Messaging > Content Editor');
  console.log('3. Click en "Create new template"');
  console.log('4. Selecciona "WhatsApp" como canal');
  console.log('5. Configura:');
  console.log('   - Nombre: exit_survey_invitation');
  console.log('   - Categoría: UTILITY o MARKETING');
  console.log('   - Idioma: Spanish (es)');
  console.log('\n6. Ejemplo de contenido de plantilla:\n');
  
  const templateExample = `Hola {{1}},

Como parte de nuestro compromiso con la mejora continua en Siigo, valoramos mucho tu opinión sobre tu experiencia trabajando con nosotros.

Te invitamos a completar nuestra encuesta de salida:
{{2}}

La encuesta toma aproximadamente {{3}} y tus respuestas serán confidenciales.

Tu retroalimentación nos ayudará a mejorar como empresa.

Gracias por tu tiempo y por haber sido parte del equipo Siigo.

Atentamente,
Equipo de Recursos Humanos`;

  console.log(templateExample);
  console.log('\n7. Envía la plantilla para aprobación');
  console.log('8. Espera 24-48 horas para la aprobación');
  console.log('9. Una vez aprobada, obtendrás un Content SID (HXxxxx)');
  console.log('10. Usa ese SID en tu código para enviar mensajes\n');
  
  return {
    instructions: 'Sigue las instrucciones arriba para crear tu plantilla',
    templateExample
  };
}

/**
 * Verificar plantillas disponibles
 */
async function listAvailableTemplates() {
  if (!client) {
    return {
      success: false,
      error: 'Cliente no configurado'
    };
  }

  try {
    // Listar contenido/plantillas disponibles
    const contents = await client.content.v2.contents.list({ limit: 20 });
    
    const templates = contents.map(content => ({
      sid: content.sid,
      friendlyName: content.friendlyName,
      status: content.status,
      language: content.language,
      variables: content.variables
    }));

    return {
      success: true,
      templates,
      count: templates.length
    };

  } catch (error) {
    console.error('Error listando plantillas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendTemplateMessage,
  sendSurveyInvitationTemplate,
  createMessageTemplate,
  listAvailableTemplates,
  formatPhoneNumber
};