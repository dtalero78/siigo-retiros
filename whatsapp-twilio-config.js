// Configuración para WhatsApp con Twilio
// Este archivo muestra cómo implementar el envío de WhatsApp usando Twilio

const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Número del sandbox

// Inicializar cliente de Twilio
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Enviar mensaje de WhatsApp usando Twilio
 * @param {string} to - Número de destino (formato: +573001234567)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise} - Promesa con el resultado del envío
 */
async function sendWhatsAppMessage(to, message) {
  try {
    // Asegurar que el número tenga el formato correcto
    let formattedNumber = to.replace(/\D/g, '');
    
    // Agregar código de país si no lo tiene
    if (!formattedNumber.startsWith('57') && formattedNumber.length === 10) {
      formattedNumber = '57' + formattedNumber; // Colombia
    }
    
    // Agregar prefijo de WhatsApp
    const whatsappTo = `whatsapp:+${formattedNumber}`;
    
    // Enviar mensaje
    const message_instance = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: whatsappTo,
      body: message
    });
    
    console.log(`✅ Mensaje enviado exitosamente. SID: ${message_instance.sid}`);
    return {
      success: true,
      messageId: message_instance.sid,
      status: message_instance.status
    };
    
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enviar plantilla de WhatsApp (para mensajes iniciales en producción)
 * @param {string} to - Número de destino
 * @param {string} templateName - Nombre de la plantilla aprobada
 * @param {Array} parameters - Parámetros para la plantilla
 */
async function sendWhatsAppTemplate(to, templateName, parameters = []) {
  try {
    let formattedNumber = to.replace(/\D/g, '');
    
    if (!formattedNumber.startsWith('57') && formattedNumber.length === 10) {
      formattedNumber = '57' + formattedNumber;
    }
    
    const whatsappTo = `whatsapp:+${formattedNumber}`;
    
    // Construir el mensaje de la plantilla
    // En Twilio, las plantillas se manejan diferente que en Meta API
    // Para el sandbox, puedes usar mensajes normales
    // Para producción, necesitas plantillas aprobadas
    
    const message_instance = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: whatsappTo,
      // Para plantillas en producción:
      contentSid: templateName, // El SID de tu plantilla aprobada
      contentVariables: JSON.stringify(parameters)
    });
    
    return {
      success: true,
      messageId: message_instance.sid,
      status: message_instance.status
    };
    
  } catch (error) {
    console.error('❌ Error enviando plantilla:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejemplo de uso
async function testTwilioWhatsApp() {
  // Para sandbox - el usuario debe primero enviar el código de activación
  console.log('🔄 Para usar el sandbox de Twilio:');
  console.log('1. El usuario debe enviar "join <codigo-sandbox>" al +1 415 523 8886');
  console.log('2. Luego puedes enviarle mensajes por 24 horas');
  
  // Ejemplo de envío
  const result = await sendWhatsAppMessage(
    '+573001234567', // Número de destino
    'Hola! Este es un mensaje de prueba desde Twilio WhatsApp API'
  );
  
  console.log('Resultado:', result);
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate
};

// Variables de entorno necesarias en .env:
/*
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox o tu número aprobado

# Opcional - para elegir qué servicio usar
WHATSAPP_PROVIDER=twilio  # twilio, meta, o whapi
*/