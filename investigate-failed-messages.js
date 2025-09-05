require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function investigateFailedMessages() {
  try {
    console.log('🔍 Investigando mensajes fallidos...\n');
    
    // Obtener mensajes de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const messages = await client.messages.list({
      dateSentAfter: today,
      limit: 100
    });
    
    console.log(`Total de mensajes hoy: ${messages.length}\n`);
    
    // Filtrar mensajes fallidos
    const failedMessages = messages.filter(msg => 
      msg.status === 'failed' || msg.errorCode !== null
    );
    
    console.log(`Mensajes fallidos: ${failedMessages.length}\n`);
    
    if (failedMessages.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ MENSAJES FALLIDOS:');
      console.log('='.repeat(80));
      
      for (const msg of failedMessages) {
        console.log(`\n📨 Message SID: ${msg.sid}`);
        console.log(`📱 De: ${msg.from}`);
        console.log(`📱 Para: ${msg.to}`);
        console.log(`📅 Fecha: ${msg.dateCreated}`);
        console.log(`⚠️ Error: ${msg.errorCode} - ${msg.errorMessage || 'Sin descripción'}`);
        console.log(`📊 Estado: ${msg.status}`);
        
        if (msg.to.includes('+096369910')) {
          console.log(`🚨 NÚMERO INVÁLIDO DETECTADO: ${msg.to}`);
        }
        
        console.log('-'.repeat(60));
      }
      
      // Analizar códigos de error
      const errorCodes = {};
      failedMessages.forEach(msg => {
        const code = msg.errorCode || 'unknown';
        errorCodes[code] = (errorCodes[code] || 0) + 1;
      });
      
      console.log('\n📊 RESUMEN DE ERRORES:');
      Object.entries(errorCodes).forEach(([code, count]) => {
        console.log(`${code}: ${count} mensaje(s)`);
        
        // Explicaciones de errores comunes
        if (code === '21211') {
          console.log('  └─ Invalid "To" Phone Number');
        } else if (code === '21655') {
          console.log('  └─ ContentSid is Invalid');
        }
      });
    }
    
    // Mensajes exitosos
    const successMessages = messages.filter(msg => 
      msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read'
    );
    
    console.log(`\n✅ Mensajes exitosos: ${successMessages.length}`);
    console.log(`⏳ Mensajes pendientes: ${messages.length - failedMessages.length - successMessages.length}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

investigateFailedMessages();