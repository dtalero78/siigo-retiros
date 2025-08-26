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
 * Enviar mensaje interactivo con botón CTA (Call To Action)
 * Los botones CTA permiten abrir URLs directamente desde WhatsApp
 * 
 * @param {string} to - Número de destino
 * @param {string} bodyText - Texto principal del mensaje
 * @param {string} buttonText - Texto del botón (máx 20 caracteres)
 * @param {string} buttonUrl - URL a abrir cuando se presiona el botón
 * @returns {Promise<Object>}
 */
async function sendInteractiveButtonMessage(to, bodyText, buttonText, buttonUrl) {
  if (!client) {
    return {
      success: false,
      error: 'Cliente de Twilio no configurado'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    console.log(`📱 Enviando mensaje interactivo con botón a: ${formattedTo}`);
    
    // Estructura del mensaje interactivo con botón CTA
    const persistentAction = {
      "type": "interactive",
      "interactive": {
        "type": "button",
        "body": {
          "text": bodyText
        },
        "action": {
          "buttons": [
            {
              "type": "url",
              "text": buttonText,
              "url": buttonUrl
            }
          ]
        }
      }
    };
    
    // Parámetros del mensaje
    const messageParams = {
      to: formattedTo,
      persistentAction: JSON.stringify(persistentAction)
    };
    
    // Usar Messaging Service o número directo
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = twilioWhatsAppNumber;
    }
    
    const message = await client.messages.create(messageParams);

    console.log(`✅ Mensaje interactivo enviado. SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };

  } catch (error) {
    console.error('❌ Error enviando mensaje interactivo:', error.message);
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Enviar invitación de encuesta con botón interactivo
 * @param {Object} user - Datos del usuario (debe incluir id, phone, first_name)
 * @returns {Promise<Object>}
 */
async function sendSurveyInvitationWithButton(user) {
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

  // URL del formulario con el ID del usuario
  const surveyUrl = `https://www.siigo.digital/?user=${user.id}`;
  
  // Mensaje principal (sin el link ya que estará en el botón)
  const bodyText = `Hola ${user.first_name || 'Colaborador'} 👋

Esperamos que te encuentres bien. Como parte de nuestro proceso de mejora continua en Siigo, nos gustaría conocer tu experiencia trabajando con nosotros.

Tu opinión es muy valiosa para nosotros. La encuesta toma aproximadamente 5-10 minutos y tus respuestas serán tratadas de forma confidencial.

¡Gracias por tu tiempo y por haber sido parte del equipo Siigo!

Atentamente,
Equipo de Recursos Humanos
Siigo`;

  // Texto del botón (máximo 20 caracteres)
  const buttonText = "Iniciar Encuesta 📝";

  return await sendInteractiveButtonMessage(user.phone, bodyText, buttonText, surveyUrl);
}

/**
 * Enviar mensaje de disculpas con botón para reintentar la encuesta
 * @param {Object} user - Datos del usuario
 * @returns {Promise<Object>}
 */
async function sendApologyWithButton(user) {
  if (!user.phone || !user.id) {
    return {
      success: false,
      error: 'Usuario sin teléfono o ID'
    };
  }

  const surveyUrl = `https://www.siigo.digital/?user=${user.id}`;
  
  const bodyText = `Hola ${user.first_name || 'Colaborador'}, disculpas por contactarte nuevamente 🙏

Lamentamos informarte que por un error técnico se perdió tu respuesta anterior de la entrevista de retiro.

Sabemos que ya dedicaste tu tiempo a completarla y entendemos si esto es incómodo.

¿Nos ayudarías completando nuevamente la encuesta? No toma más de 5 minutos.

Realmente valoramos tu feedback para seguir mejorando como organización.

Mil disculpas por las molestias 🙏
Equipo de Cultura – Siigo`;

  const buttonText = "Retomar Encuesta 🔄";

  return await sendInteractiveButtonMessage(user.phone, bodyText, buttonText, surveyUrl);
}

/**
 * Enviar plantilla con botón interactivo
 * NOTA: Para usar con plantillas aprobadas que incluyan botones
 * 
 * @param {string} to - Número de destino
 * @param {string} templateSid - SID de la plantilla aprobada
 * @param {Object} variables - Variables para la plantilla
 * @param {string} buttonUrl - URL para el botón CTA
 * @returns {Promise<Object>}
 */
async function sendTemplateWithButton(to, templateSid, variables = {}, buttonUrl) {
  if (!client) {
    return {
      success: false,
      error: 'Cliente de Twilio no configurado'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    console.log(`📱 Enviando plantilla con botón a: ${formattedTo}`);
    
    // Configurar parámetros del mensaje con plantilla y botón
    const messageParams = {
      to: formattedTo,
      contentSid: templateSid,
      contentVariables: JSON.stringify(variables)
    };
    
    // Si la plantilla tiene un botón dinámico, incluir la URL
    if (buttonUrl) {
      messageParams.persistentAction = JSON.stringify({
        "type": "interactive",
        "interactive": {
          "type": "cta_url",
          "parameters": {
            "display_text": "Iniciar Encuesta",
            "url": buttonUrl
          }
        }
      });
    }
    
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = twilioWhatsAppNumber;
    }
    
    const message = await client.messages.create(messageParams);

    console.log(`✅ Plantilla con botón enviada. SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };

  } catch (error) {
    console.error('❌ Error enviando plantilla con botón:', error.message);
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

module.exports = {
  sendInteractiveButtonMessage,
  sendSurveyInvitationWithButton,
  sendApologyWithButton,
  sendTemplateWithButton,
  formatPhoneNumber
};