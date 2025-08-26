require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TEMPLATE_SID = 'HXd85118b65ad3e326a4b6a4531b578bf2';

async function sendWithSpaceFix() {
  const phone = process.argv[2] || '3103640268';
  const userId = process.argv[3] || '466';
  const firstName = process.argv[4] || 'ENRIQUE';
  
  console.log('\n🔧 INTENTANDO ENVÍO CON CORRECCIÓN DE ESPACIO\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 Teléfono: ${phone}`);
  console.log(`👤 Nombre: ${firstName}`);
  console.log(`🆔 User ID: ${userId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Formatear teléfono
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    const formattedPhone = `whatsapp:${cleaned}`;
    
    // Intento 1: Agregar espacio antes del nombre
    console.log('📝 Intento 1: Variable con espacio inicial');
    console.log('Variables: {1: " ENRIQUE"} (nota el espacio antes del nombre)\n');
    
    const message1 = await client.messages.create({
      to: formattedPhone,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        '1': ` ${firstName}` // Espacio antes del nombre
      })
    });
    
    console.log('✅ Mensaje enviado');
    console.log(`ID: ${message1.sid}`);
    console.log(`Estado: ${message1.status}\n`);
    
    // Esperar 5 segundos para verificar estado
    console.log('⏳ Esperando 5 segundos para verificar estado...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status1 = await client.messages(message1.sid).fetch();
    console.log(`Estado actualizado: ${status1.status}`);
    if (status1.errorCode) {
      console.log(`Error: ${status1.errorCode}`);
    }
    console.log(`Contenido: ${status1.body?.substring(0, 50)}...`);
    
    if (status1.status === 'delivered' || status1.status === 'sent') {
      console.log('\n✅ ¡ÉXITO! Esta configuración funciona.');
      console.log('La variable debe incluir el espacio: " ENRIQUE"');
      return;
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Intento 2: URL en variable 1 si el nombre no funciona
    console.log('📝 Intento 2: Solo ID para URL como variable 1');
    console.log('Variables: {1: "466"}\n');
    
    const message2 = await client.messages.create({
      to: formattedPhone,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        '1': userId
      })
    });
    
    console.log('✅ Mensaje enviado');
    console.log(`ID: ${message2.sid}`);
    console.log(`Estado: ${message2.status}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`Código: ${error.code}`);
    }
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. El problema principal parece ser el formato de la plantilla');
  console.log('2. En Twilio Console, verifica que haya espacios después de "Hola"');
  console.log('3. La plantilla debería decir: "Hola {{1}}!" no "Hola{{1}}!"');
  console.log('4. Considera crear una nueva plantilla con el formato correcto\n');
}

sendWithSpaceFix();