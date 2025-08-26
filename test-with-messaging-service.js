require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Messaging Service SID encontrado
const messagingServiceSid = 'MGe71ba54bad2c3fda0df986e916d8ef0c';

const phoneNumber = process.argv[2] || '573014400818';

async function testWithMessagingService() {
  console.log('\n🔬 PRUEBA CON MESSAGING SERVICE\n');
  console.log('=' .repeat(50));
  
  console.log('Configuración:');
  console.log('  Messaging Service SID:', messagingServiceSid);
  console.log('  Template SID:', 'HX328f1e3d4eb8664aa2674b3edec72729');
  console.log('  Destinatario:', phoneNumber);
  
  try {
    console.log('\n📤 Enviando con Messaging Service...\n');
    
    const message = await client.messages.create({
      messagingServiceSid: messagingServiceSid,
      to: `whatsapp:+${phoneNumber.replace(/\D/g, '')}`,
      contentSid: 'HX328f1e3d4eb8664aa2674b3edec72729',
      contentVariables: JSON.stringify({
        "1": "Usuario Prueba",
        "2": "https://www.siigo.digital/?id=TEST123"
      })
    });
    
    console.log('✅ Mensaje enviado:', message.sid);
    console.log('   Estado inicial:', message.status);
    console.log('   De:', message.from);
    console.log('   Para:', message.to);
    
    // Esperar 3 segundos y verificar estado
    console.log('\n⏳ Esperando 3 segundos para verificar estado...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await client.messages(message.sid).fetch();
    console.log('\n📊 Estado actualizado:');
    console.log('   Status:', status.status);
    console.log('   De:', status.from);
    console.log('   Para:', status.to);
    
    if (status.errorCode) {
      console.log('   ❌ Error Code:', status.errorCode);
      console.log('   Error Message:', status.errorMessage);
      
      if (status.errorCode === 63049) {
        console.log('\n💡 PROBLEMA CONFIRMADO:');
        console.log('   El número de WhatsApp no está correctamente configurado para plantillas.');
        console.log('   Esto indica que el número está en modo SANDBOX.');
        console.log('\n   SOLUCIÓN:');
        console.log('   1. El destinatario debe enviar cualquier mensaje a +15558192172');
        console.log('   2. O necesitas completar la configuración de producción en Meta');
      }
    } else {
      console.log('   ✅ Mensaje entregado exitosamente!');
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('   Código:', error.code);
    console.log('   Más info:', error.moreInfo);
  }
  
  console.log('\n' + '=' .repeat(50));
}

testWithMessagingService().catch(console.error);