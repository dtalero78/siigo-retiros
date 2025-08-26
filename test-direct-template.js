require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const phoneNumber = process.argv[2] || '573014400818';

async function testDirectTemplate() {
  console.log('\n🔬 PRUEBA DIRECTA DE PLANTILLA CON TWILIO\n');
  console.log('=' .repeat(50));
  
  console.log('Configuración:');
  console.log('  Account SID:', accountSid);
  console.log('  Número WhatsApp:', process.env.TWILIO_WHATSAPP_NUMBER);
  console.log('  Destinatario:', phoneNumber);
  
  try {
    // Intentar con la plantilla aprobada
    console.log('\n📤 Intento 1: Con plantilla aprobada\n');
    
    const message1 = await client.messages.create({
      from: 'whatsapp:+15558192172',
      to: `whatsapp:+${phoneNumber.replace(/\D/g, '')}`,
      contentSid: 'HX328f1e3d4eb8664aa2674b3edec72729',
      contentVariables: JSON.stringify({
        "1": "Usuario Prueba",
        "2": "https://www.siigo.digital/?id=TEST"
      })
    });
    
    console.log('✅ Mensaje enviado:', message1.sid);
    console.log('   Estado:', message1.status);
    
    // Esperar 3 segundos y verificar estado
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await client.messages(message1.sid).fetch();
    console.log('\n📊 Estado actualizado:');
    console.log('   Status:', status.status);
    console.log('   Error Code:', status.errorCode);
    console.log('   Error Message:', status.errorMessage);
    
  } catch (error) {
    console.log('\n❌ Error con plantilla:', error.message);
    console.log('   Código:', error.code);
    console.log('   Más info:', error.moreInfo);
    
    // Si falla, intentar con mensaje directo
    console.log('\n📤 Intento 2: Mensaje directo (requiere opt-in)\n');
    
    try {
      const message2 = await client.messages.create({
        from: 'whatsapp:+15558192172',
        to: `whatsapp:+${phoneNumber.replace(/\D/g, '')}`,
        body: 'Hola! Este es un mensaje de prueba de Siigo. Si recibes este mensaje, por favor responde con cualquier texto para activar la comunicación bidireccional.'
      });
      
      console.log('✅ Mensaje directo enviado:', message2.sid);
      console.log('   Estado:', message2.status);
      
    } catch (error2) {
      console.log('❌ Error con mensaje directo:', error2.message);
      console.log('   Código:', error2.code);
      
      if (error2.code === 63007) {
        console.log('\n💡 SOLUCIÓN REQUERIDA:');
        console.log('   El usuario debe enviar un mensaje a +15558192172');
        console.log('   Puede ser cualquier texto como "Hola"');
      }
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

testDirectTemplate().catch(console.error);