require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// IDs de los mensajes de prueba
const messageIds = [
  'MM3dcb8ae0fe914f2dde2a764451c8ec24', // Prueba 1: Solo nombre
  'MM155745bf44acf461e8a453bf465fb743', // Prueba 2: Nombre + URL variable
  'MM1448b5915c453529825defebaa7d3724', // Prueba 3: Variables manuales
  'MM99c2e1af43dafce8878e59eba9c6f3f6'  // Prueba 4: Solo URL
];

async function checkAllMessages() {
  console.log('\n🔍 VERIFICANDO ESTADO DE TODOS LOS MENSAJES DE PRUEBA\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (let i = 0; i < messageIds.length; i++) {
    const messageSid = messageIds[i];
    console.log(`📝 PRUEBA ${i + 1}: ${messageSid}`);
    
    try {
      const message = await client.messages(messageSid).fetch();
      
      console.log(`Estado: ${message.status}`);
      console.log(`Para: ${message.to}`);
      
      // Mostrar emoji según estado
      let statusEmoji = '';
      switch(message.status) {
        case 'delivered':
          statusEmoji = '✅ ENTREGADO';
          break;
        case 'sent':
          statusEmoji = '📤 ENVIADO';
          break;
        case 'queued':
          statusEmoji = '📬 EN COLA';
          break;
        case 'accepted':
          statusEmoji = '⏳ ACEPTADO';
          break;
        case 'undelivered':
          statusEmoji = '❌ NO ENTREGADO';
          break;
        case 'failed':
          statusEmoji = '❌ FALLÓ';
          break;
        case 'read':
          statusEmoji = '👁️ LEÍDO';
          break;
        default:
          statusEmoji = message.status;
      }
      
      console.log(`Resultado: ${statusEmoji}`);
      
      if (message.errorCode) {
        console.log(`Error: ${message.errorCode} - ${message.errorMessage}`);
      }
      
      // Mostrar el contenido si está disponible
      if (message.body) {
        console.log(`Contenido (primeros 100 caracteres):`)
        console.log(`"${message.body.substring(0, 100)}..."`);
      }
      
      console.log('---');
      
      // Descripción de qué variables usó cada prueba
      switch(i) {
        case 0:
          console.log('Variables usadas: {1: "ENRIQUE"} - Solo nombre, sin URL');
          break;
        case 1:
          console.log('Variables usadas: {1: "ENRIQUE", 2: "466"} - Nombre + ID para URL');
          break;
        case 2:
          console.log('Variables usadas: {1: "ENRIQUE", 2: "https://www.siigo.digital/?user=466"} - URL completa');
          break;
        case 3:
          console.log('Variables usadas: {1: "466"} - Solo ID');
          break;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
    } catch (error) {
      console.log(`❌ Error al verificar: ${error.message}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }
  
  console.log('💡 CONCLUSIÓN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Revisa cuál mensaje llegó correctamente para determinar');
  console.log('la configuración correcta de variables para tu plantilla.');
  console.log('\nSi alguno muestra "ENTREGADO" o "LEÍDO", esa es la');
  console.log('configuración correcta que debes usar.\n');
}

// Ejecutar verificación
checkAllMessages();