require('dotenv').config();

const { 
  sendWhatsAppMessage, 
  formatPhoneNumber 
} = require('./services/twilio-whatsapp');

// Obtener el número del argumento de línea de comandos
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.log('❌ Por favor proporciona un número de teléfono');
  console.log('Uso: node send-test-whatsapp.js 3001234567');
  process.exit(1);
}

async function sendTestMessage() {
  console.log('\n📱 ENVIANDO MENSAJE DE PRUEBA VÍA TWILIO WHATSAPP\n');
  console.log('=' .repeat(50));
  
  console.log('Número original:', phoneNumber);
  console.log('Número formateado:', formatPhoneNumber(phoneNumber));
  console.log('Desde:', process.env.TWILIO_WHATSAPP_NUMBER);
  
  const testMessage = `🧪 *Mensaje de Prueba - Siigo*

Este es un mensaje de prueba del sistema de encuestas de salida.

Si recibes este mensaje, la integración con Twilio WhatsApp está funcionando correctamente.

_Enviado: ${new Date().toLocaleString('es-CO')}_`;
  
  console.log('\n📤 Enviando mensaje...\n');
  
  const result = await sendWhatsAppMessage(phoneNumber, testMessage);
  
  console.log('=' .repeat(50));
  
  if (result.success) {
    console.log('\n✅ MENSAJE ENVIADO EXITOSAMENTE');
    console.log('   ID del mensaje:', result.messageId);
    console.log('   Estado:', result.status);
    console.log('   Destinatario:', result.to);
    console.log('\n💡 El mensaje debería llegar en unos segundos.');
  } else {
    console.log('\n❌ ERROR AL ENVIAR');
    console.log('   Error:', result.error);
    
    if (result.error.includes('no ha aceptado') || result.error.includes('debe primero enviar')) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. El destinatario debe enviar PRIMERO un mensaje a: +15558192172');
      console.log('   2. Puede ser cualquier mensaje (ej: "Hola")');
      console.log('   3. Después de eso, ejecuta este script de nuevo');
      console.log('\n📱 Instrucciones para el destinatario:');
      console.log('   - Abre WhatsApp');
      console.log('   - Agrega el número +15558192172 a tus contactos');
      console.log('   - Envía cualquier mensaje a ese número');
      console.log('   - Espera la confirmación');
      console.log('   - Luego podrás recibir mensajes del sistema');
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Ejecutar
sendTestMessage().catch(error => {
  console.error('❌ Error crítico:', error);
  process.exit(1);
});