require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const messageSid = process.argv[2];

if (!messageSid) {
  console.log('Uso: node check-message-status.js <message-sid>');
  console.log('Ejemplo: node check-message-status.js MM28c127c90e492e452fa4ff59e41fd9bb');
  process.exit(1);
}

async function checkMessageStatus() {
  console.log('\n🔍 VERIFICANDO ESTADO DEL MENSAJE\n');
  console.log('=' .repeat(50));
  
  try {
    const message = await client.messages(messageSid).fetch();
    
    console.log('📱 DETALLES DEL MENSAJE:');
    console.log('   SID:', message.sid);
    console.log('   Estado:', message.status);
    console.log('   De:', message.from);
    console.log('   Para:', message.to);
    console.log('   Fecha envío:', message.dateSent);
    console.log('   Fecha actualización:', message.dateUpdated);
    console.log('   Dirección:', message.direction);
    console.log('   Código error:', message.errorCode || 'Ninguno');
    console.log('   Mensaje error:', message.errorMessage || 'Ninguno');
    console.log('   Precio:', message.price, message.priceUnit);
    
    console.log('\n📊 INTERPRETACIÓN DEL ESTADO:');
    
    switch(message.status) {
      case 'queued':
        console.log('   ⏳ El mensaje está en cola para ser enviado');
        break;
      case 'sending':
        console.log('   📤 El mensaje se está enviando');
        break;
      case 'sent':
        console.log('   ✅ El mensaje fue enviado exitosamente');
        break;
      case 'delivered':
        console.log('   ✅ El mensaje fue entregado al destinatario');
        break;
      case 'undelivered':
        console.log('   ❌ El mensaje no pudo ser entregado');
        if (message.errorCode) {
          console.log('\n🔴 RAZÓN DEL ERROR:');
          console.log('   Código:', message.errorCode);
          console.log('   Mensaje:', message.errorMessage);
        }
        break;
      case 'failed':
        console.log('   ❌ El mensaje falló completamente');
        if (message.errorCode) {
          console.log('\n🔴 RAZÓN DEL FALLO:');
          console.log('   Código:', message.errorCode);
          console.log('   Mensaje:', message.errorMessage);
        }
        break;
      case 'read':
        console.log('   ✅ El mensaje fue leído por el destinatario');
        break;
    }
    
    if (message.errorCode) {
      console.log('\n💡 POSIBLES SOLUCIONES:');
      
      if (message.errorCode === 63016) {
        console.log('   - La plantilla no está aprobada o no existe');
        console.log('   - Verifica en Facebook Business Manager');
      } else if (message.errorCode === 63007) {
        console.log('   - El usuario debe primero enviar un mensaje a tu número');
      } else if (message.errorCode === 63003) {
        console.log('   - El número de destino no tiene WhatsApp');
      } else if (message.errorCode === 63024) {
        console.log('   - El número de WhatsApp no está correctamente configurado');
        console.log('   - Verifica la configuración en Twilio Console');
      }
    }
    
  } catch (error) {
    console.log('❌ Error obteniendo el mensaje:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
}

checkMessageStatus().catch(console.error);