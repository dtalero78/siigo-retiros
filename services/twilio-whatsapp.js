const twilio = require('twilio');

// Configuración de Twilio desde variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Validar configuración
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  console.warn('⚠️ Configuración de Twilio incompleta. Verifica las variables de entorno.');
}

// Inicializar cliente
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Formatear número de teléfono para WhatsApp
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número formateado para WhatsApp
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Eliminar caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Si el número tiene 10 dígitos, asumir que es colombiano
  if (cleaned.length === 10) {
    cleaned = '57' + cleaned;
  }
  
  // Si no empieza con +, agregarlo
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Formato WhatsApp
  return `whatsapp:${cleaned}`;
}

/**
 * Enviar mensaje de WhatsApp usando Twilio
 * @param {string} to - Número de destino
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<Object>} - Resultado del envío
 */
async function sendWhatsAppMessage(to, message) {
  if (!client) {
    console.error('❌ Cliente de Twilio no configurado');
    return {
      success: false,
      error: 'Twilio no está configurado correctamente'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    if (!formattedTo) {
      throw new Error('Número de teléfono inválido');
    }

    console.log(`📱 Enviando WhatsApp a: ${formattedTo}`);
    
    // Usar Messaging Service si está disponible, sino usar número directo
    const messageParams = {
      to: formattedTo,
      body: message
    };
    
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = twilioWhatsAppNumber;
    }
    
    const messageInstance = await client.messages.create(messageParams);

    console.log(`✅ Mensaje enviado exitosamente. SID: ${messageInstance.sid}`);
    
    return {
      success: true,
      messageId: messageInstance.sid,
      status: messageInstance.status,
      to: formattedTo
    };

  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error.message);
    
    // Manejo específico de errores comunes
    if (error.code === 21608) {
      return {
        success: false,
        error: 'El número no está registrado en WhatsApp o no ha aceptado recibir mensajes'
      };
    }
    
    if (error.code === 63007) {
      return {
        success: false,
        error: 'El usuario debe primero enviar un mensaje a tu número de WhatsApp'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar mensaje'
    };
  }
}

/**
 * Enviar invitación para encuesta de salida
 * @param {Object} user - Datos del usuario
 * @returns {Promise<Object>} - Resultado del envío
 */
async function sendExitSurveyInvitation(user) {
  if (!user.phone) {
    return {
      success: false,
      error: 'Usuario sin número de teléfono'
    };
  }

  const formUrl = process.env.FORM_URL || 'https://www.siigo.digital';
  const surveyUrl = `${formUrl}/?id=${user.identification}`;
  
  const message = `Hola ${user.first_name} 👋

Esperamos que te encuentres bien. Como parte de nuestro proceso de mejora continua en Siigo, nos gustaría conocer tu experiencia trabajando con nosotros.

Tu opinión es muy valiosa para nosotros. Te invitamos a completar una breve encuesta de salida:

📝 ${surveyUrl}

La encuesta toma aproximadamente 5-10 minutos y tus respuestas serán tratadas de forma confidencial.

¡Gracias por tu tiempo y por haber sido parte del equipo Siigo!

Atentamente,
Equipo de Recursos Humanos
Siigo`;

  return await sendWhatsAppMessage(user.phone, message);
}

/**
 * Verificar estado del servicio de Twilio
 * @returns {Promise<Object>} - Estado del servicio
 */
async function checkServiceStatus() {
  if (!client) {
    return {
      configured: false,
      error: 'Cliente no configurado'
    };
  }

  try {
    // Intentar obtener información de la cuenta
    const account = await client.api.accounts(accountSid).fetch();
    
    return {
      configured: true,
      accountName: account.friendlyName,
      status: account.status,
      whatsappNumber: twilioWhatsAppNumber
    };
  } catch (error) {
    return {
      configured: false,
      error: error.message
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendExitSurveyInvitation,
  checkServiceStatus,
  formatPhoneNumber
};