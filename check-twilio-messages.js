require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkMessages() {
  try {
    console.log('🔍 Verificando mensajes de WhatsApp en Twilio...\n');
    
    // Obtener mensajes de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`Buscando mensajes desde: ${today.toISOString()}\n`);
    
    const messages = await client.messages.list({
      dateSentAfter: today,
      limit: 100
    });
    
    // Filtrar solo mensajes de WhatsApp
    const whatsappMessages = messages.filter(msg => 
      msg.from.startsWith('whatsapp:') || msg.to.startsWith('whatsapp:')
    );
    
    console.log(`Total de mensajes WhatsApp hoy: ${whatsappMessages.length}\n`);
    
    // Agrupar por destinatario
    const messagesByRecipient = {};
    
    for (const msg of whatsappMessages) {
      const ourNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+15558192172';
      const isOutgoing = msg.from === ourNumber;
      
      if (isOutgoing) {
        const recipient = msg.to;
        if (!messagesByRecipient[recipient]) {
          messagesByRecipient[recipient] = [];
        }
        messagesByRecipient[recipient].push({
          sid: msg.sid,
          date: msg.dateCreated,
          status: msg.status,
          body: msg.body ? msg.body.substring(0, 50) + '...' : 'Sin contenido'
        });
      }
    }
    
    // Mostrar resumen
    console.log('Mensajes por destinatario:');
    console.log('=' .repeat(80));
    
    for (const [recipient, msgs] of Object.entries(messagesByRecipient)) {
      const cleanNumber = recipient.replace('whatsapp:', '');
      console.log(`\n📱 ${cleanNumber}: ${msgs.length} mensaje(s)`);
      
      if (msgs.length > 5) {
        console.log('  ⚠️ ALERTA: Este número recibió muchos mensajes');
      }
      
      // Mostrar primeros 3 mensajes
      msgs.slice(0, 3).forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.status}] ${new Date(msg.date).toLocaleTimeString('es-CO')}`);
        console.log(`     ${msg.body}`);
      });
      
      if (msgs.length > 3) {
        console.log(`  ... y ${msgs.length - 3} mensaje(s) más`);
      }
    }
    
    // Buscar números con múltiples mensajes
    const multipleMessages = Object.entries(messagesByRecipient)
      .filter(([_, msgs]) => msgs.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    if (multipleMessages.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('⚠️ NÚMEROS CON MÚLTIPLES MENSAJES:');
      console.log('=' .repeat(80));
      
      for (const [recipient, msgs] of multipleMessages) {
        const cleanNumber = recipient.replace('whatsapp:', '');
        console.log(`${cleanNumber}: ${msgs.length} mensajes`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMessages();