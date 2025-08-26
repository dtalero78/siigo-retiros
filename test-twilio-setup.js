require('dotenv').config();

const readline = require('readline');
const { 
  sendWhatsAppMessage, 
  checkServiceStatus,
  formatPhoneNumber 
} = require('./services/twilio-whatsapp');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testTwilioSetup() {
  console.log('🔧 VERIFICACIÓN DE CONFIGURACIÓN DE TWILIO WHATSAPP\n');
  console.log('=' .repeat(50));
  
  // 1. Verificar variables de entorno
  console.log('\n📋 1. VARIABLES DE ENTORNO:');
  console.log('   Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Falta');
  console.log('   Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ Falta');
  console.log('   WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER || '❌ Falta');
  console.log('   Provider:', process.env.WHATSAPP_PROVIDER || 'No definido');
  
  // 2. Verificar estado del servicio
  console.log('\n📡 2. ESTADO DEL SERVICIO:');
  const status = await checkServiceStatus();
  
  if (status.configured) {
    console.log('   ✅ Servicio configurado correctamente');
    console.log('   Cuenta:', status.accountName);
    console.log('   Estado:', status.status);
    console.log('   Número WhatsApp:', status.whatsappNumber);
  } else {
    console.log('   ❌ Error:', status.error);
    console.log('\n⚠️  No se puede continuar sin configuración válida.');
    process.exit(1);
  }
  
  // 3. Información importante
  console.log('\n📌 3. INFORMACIÓN IMPORTANTE:');
  console.log('   Para usar el número de WhatsApp de Twilio:');
  console.log('   1. El destinatario debe primero enviar un mensaje a tu número');
  console.log(`   2. Número de Twilio: ${process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '')}`);
  console.log('   3. El destinatario debe enviar cualquier mensaje para activar la conversación');
  console.log('   4. Después de eso, puedes enviarle mensajes por 24 horas');
  
  // 4. Preguntar si quiere hacer una prueba
  console.log('\n' + '=' .repeat(50));
  
  rl.question('\n¿Deseas enviar un mensaje de prueba? (s/n): ', async (answer) => {
    if (answer.toLowerCase() === 's') {
      rl.question('Ingresa el número de WhatsApp (ej: 3001234567): ', async (phone) => {
        if (phone) {
          console.log('\n📤 Enviando mensaje de prueba...');
          console.log('   Número formateado:', formatPhoneNumber(phone));
          
          const testMessage = `🧪 *Mensaje de Prueba - Siigo*

Este es un mensaje de prueba del sistema de encuestas de salida.

Si recibes este mensaje, la integración con Twilio WhatsApp está funcionando correctamente.

_Enviado: ${new Date().toLocaleString('es-CO')}_`;
          
          const result = await sendWhatsAppMessage(phone, testMessage);
          
          if (result.success) {
            console.log('\n✅ MENSAJE ENVIADO EXITOSAMENTE');
            console.log('   ID del mensaje:', result.messageId);
            console.log('   Estado:', result.status);
            console.log('   Destinatario:', result.to);
          } else {
            console.log('\n❌ ERROR AL ENVIAR');
            console.log('   Error:', result.error);
            
            if (result.error.includes('no ha aceptado')) {
              console.log('\n💡 SOLUCIÓN:');
              console.log('   1. El destinatario debe enviar un mensaje a:', process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', ''));
              console.log('   2. Puede ser cualquier mensaje (ej: "Hola")');
              console.log('   3. Después de eso, intenta enviar de nuevo');
            }
          }
        }
        rl.close();
      });
    } else {
      console.log('\n✅ Configuración verificada. No se envió mensaje de prueba.');
      rl.close();
    }
  });
}

// Ejecutar prueba
testTwilioSetup().catch(error => {
  console.error('❌ Error en la prueba:', error);
  rl.close();
  process.exit(1);
});