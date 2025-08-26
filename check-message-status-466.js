require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// ID del mensaje que enviamos
const messageSid = 'MM1f67dcefca17b892ee465eabb0217ff7';

async function checkMessageStatus() {
  console.log('\n🔍 VERIFICANDO ESTADO DEL MENSAJE EN TWILIO\n');
  console.log('Message SID:', messageSid);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Obtener información del mensaje
    const message = await client.messages(messageSid).fetch();
    
    console.log('📊 INFORMACIÓN DEL MENSAJE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Estado: ${message.status}`);
    console.log(`De: ${message.from}`);
    console.log(`Para: ${message.to}`);
    console.log(`Fecha de creación: ${message.dateCreated}`);
    console.log(`Fecha de envío: ${message.dateSent}`);
    console.log(`Fecha de actualización: ${message.dateUpdated}`);
    console.log(`Dirección: ${message.direction}`);
    console.log(`Código de error: ${message.errorCode || 'Ninguno'}`);
    console.log(`Mensaje de error: ${message.errorMessage || 'Ninguno'}`);
    console.log(`Precio: ${message.price || 'N/A'}`);
    console.log(`Unidades de precio: ${message.priceUnit || 'N/A'}`);
    
    // Si hay Content SID (plantilla)
    if (message.sid.startsWith('MM')) {
      console.log(`\n📄 DETALLES DE PLANTILLA:`);
      console.log(`Content SID usado: ${message.body || 'Plantilla con Content SID'}`);
    }
    
    console.log('\n🔍 DIAGNÓSTICO DEL ESTADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    switch(message.status) {
      case 'accepted':
        console.log('✅ El mensaje fue aceptado por Twilio');
        console.log('⏳ Está en cola para ser procesado');
        console.log('💡 Debería cambiar a "queued" pronto');
        break;
      case 'queued':
        console.log('📬 El mensaje está en cola de envío');
        console.log('⏳ Esperando ser enviado al operador');
        break;
      case 'sending':
        console.log('📤 El mensaje se está enviando');
        break;
      case 'sent':
        console.log('✅ El mensaje fue enviado exitosamente');
        console.log('📱 Ha sido entregado al operador de WhatsApp');
        break;
      case 'delivered':
        console.log('✅ ¡El mensaje fue entregado al destinatario!');
        break;
      case 'undelivered':
        console.log('❌ El mensaje NO pudo ser entregado');
        console.log(`Razón: ${message.errorMessage || 'Desconocida'}`);
        break;
      case 'failed':
        console.log('❌ El envío del mensaje FALLÓ');
        console.log(`Error: ${message.errorMessage || 'Desconocido'}`);
        console.log(`Código: ${message.errorCode || 'N/A'}`);
        break;
      case 'read':
        console.log('✅ El mensaje fue LEÍDO por el destinatario');
        break;
      default:
        console.log(`Estado desconocido: ${message.status}`);
    }
    
    // Verificar errores comunes
    if (message.errorCode) {
      console.log('\n⚠️ CÓDIGO DE ERROR DETECTADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      switch(message.errorCode) {
        case 63016:
          console.log('❌ La plantilla no está aprobada o no existe');
          console.log('Solución: Verifica en Twilio Console que la plantilla esté aprobada');
          break;
        case 63018:
          console.log('❌ Error con las variables de la plantilla');
          console.log('Solución: Las variables no coinciden con la plantilla');
          break;
        case 21608:
          console.log('❌ El número no está registrado en WhatsApp');
          console.log('Solución: El destinatario no tiene WhatsApp activo');
          break;
        case 63007:
          console.log('❌ El destinatario no ha iniciado conversación');
          console.log('Solución: Usa una plantilla aprobada para el primer contacto');
          break;
        case 63015:
          console.log('❌ Error con el contenido de la plantilla');
          console.log('Solución: Revisa que el Content SID sea correcto');
          break;
        default:
          console.log(`Código de error: ${message.errorCode}`);
          console.log(`Mensaje: ${message.errorMessage}`);
      }
    }
    
    // Obtener eventos del mensaje (historial)
    console.log('\n📜 HISTORIAL DE EVENTOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const events = await client.monitor.v1.events.list({
        resourceSid: messageSid,
        limit: 20
      });
      
      if (events.length > 0) {
        events.forEach((event, index) => {
          console.log(`\n${index + 1}. ${event.eventType || 'Evento'}`);
          console.log(`   Fecha: ${event.eventDate}`);
          if (event.description) {
            console.log(`   Descripción: ${event.description}`);
          }
        });
      } else {
        console.log('No hay eventos registrados para este mensaje');
      }
    } catch (eventError) {
      console.log('No se pudieron obtener los eventos del mensaje');
    }
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (message.status === 'accepted' || message.status === 'queued') {
      console.log('1. Espera unos minutos más, el mensaje está en proceso');
      console.log('2. Si no cambia de estado, revisa en Twilio Console');
    } else if (message.status === 'failed' || message.status === 'undelivered') {
      console.log('1. Verifica que el número tenga WhatsApp activo');
      console.log('2. Revisa que la plantilla esté aprobada');
      console.log('3. Comprueba las variables de la plantilla');
      console.log('4. Intenta con un mensaje de prueba simple primero');
    }
    
    console.log('\n🔗 Ver más detalles en Twilio Console:');
    console.log(`https://console.twilio.com/us1/monitor/logs/messages/${messageSid}`);
    
  } catch (error) {
    console.error('❌ Error al verificar el mensaje:', error.message);
    
    if (error.status === 404) {
      console.error('El mensaje no fue encontrado. Verifica el SID.');
    }
  }
}

// Ejecutar verificación
checkMessageStatus();