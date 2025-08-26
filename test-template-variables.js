require('dotenv').config();
const { sendTemplateWithUrlButton } = require('./services/twilio-template-button');

// Template SID aprobado
const TEMPLATE_SID = 'HXd85118b65ad3e326a4b6a4531b578bf2';

async function testDifferentVariableConfigurations() {
  const phone = process.argv[2] || '3103640268';
  
  if (!phone || phone === 'help') {
    console.log('\n📖 USO:');
    console.log('  node test-template-variables.js <teléfono>');
    console.log('\n📝 EJEMPLO:');
    console.log('  node test-template-variables.js 3103640268\n');
    console.log('Este script probará diferentes configuraciones de variables');
    console.log('para determinar cuál funciona con tu plantilla.\n');
    process.exit(0);
  }

  console.log('\n🧪 PROBANDO DIFERENTES CONFIGURACIONES DE VARIABLES\n');
  console.log('Template SID:', TEMPLATE_SID);
  console.log('Teléfono:', phone);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Configuración 1: Solo nombre, sin variable de URL
  console.log('📝 PRUEBA 1: Solo variable de nombre (sin URL en variable)');
  console.log('Variables: {1: "ENRIQUE"}');
  console.log('Enviando...\n');
  
  try {
    const result1 = await sendTemplateWithUrlButton(
      phone,
      TEMPLATE_SID,
      { '1': 'ENRIQUE' },
      null // Sin variable de URL
    );
    
    if (result1.success) {
      console.log('✅ Prueba 1 EXITOSA');
      console.log(`Message ID: ${result1.messageId}\n`);
    } else {
      console.log('❌ Prueba 1 FALLÓ');
      console.log(`Error: ${result1.error}`);
      console.log(`Código: ${result1.code}\n`);
    }
  } catch (error) {
    console.log('❌ Error en Prueba 1:', error.message, '\n');
  }

  // Esperar un poco entre pruebas
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Configuración 2: Nombre y URL como variable 2
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 PRUEBA 2: Nombre + URL como variable 2');
  console.log('Variables: {1: "ENRIQUE", 2: "466"}');
  console.log('Enviando...\n');
  
  try {
    const result2 = await sendTemplateWithUrlButton(
      phone,
      TEMPLATE_SID,
      { '1': 'ENRIQUE' },
      '466' // URL variable
    );
    
    if (result2.success) {
      console.log('✅ Prueba 2 EXITOSA');
      console.log(`Message ID: ${result2.messageId}\n`);
    } else {
      console.log('❌ Prueba 2 FALLÓ');
      console.log(`Error: ${result2.error}`);
      console.log(`Código: ${result2.code}\n`);
    }
  } catch (error) {
    console.log('❌ Error en Prueba 2:', error.message, '\n');
  }

  // Esperar un poco entre pruebas
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Configuración 3: Variables manuales directas
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 PRUEBA 3: Variables manuales directas');
  console.log('Variables: {1: "ENRIQUE", 2: "https://www.siigo.digital/?user=466"}');
  console.log('Enviando...\n');
  
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    // Formatear número
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    const formattedPhone = `whatsapp:${cleaned}`;
    
    const message = await client.messages.create({
      to: formattedPhone,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        '1': 'ENRIQUE',
        '2': 'https://www.siigo.digital/?user=466'
      })
    });
    
    console.log('✅ Prueba 3 EXITOSA');
    console.log(`Message ID: ${message.sid}`);
    console.log(`Estado: ${message.status}\n`);
  } catch (error) {
    console.log('❌ Prueba 3 FALLÓ');
    console.log(`Error: ${error.message}`);
    console.log(`Código: ${error.code}\n`);
  }

  // Esperar un poco entre pruebas
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Configuración 4: Solo URL como variable
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 PRUEBA 4: Solo URL como variable 1');
  console.log('Variables: {1: "466"}');
  console.log('Enviando...\n');
  
  try {
    const message = await client.messages.create({
      to: `whatsapp:+57${phone}`,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        '1': '466'
      })
    });
    
    console.log('✅ Prueba 4 EXITOSA');
    console.log(`Message ID: ${message.sid}`);
    console.log(`Estado: ${message.status}\n`);
  } catch (error) {
    console.log('❌ Prueba 4 FALLÓ');
    console.log(`Error: ${error.message}`);
    console.log(`Código: ${error.code}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 RESUMEN:');
  console.log('Revisa cuál configuración funcionó para determinar');
  console.log('cómo están configuradas las variables en tu plantilla.\n');
  console.log('💡 PRÓXIMOS PASOS:');
  console.log('1. Si ninguna funcionó, revisa la plantilla en Twilio Console');
  console.log('2. Verifica que el Content SID sea correcto');
  console.log('3. Asegúrate que la plantilla esté APROBADA');
  console.log('4. Comprueba las variables en la configuración de la plantilla\n');
}

// Ejecutar pruebas
testDifferentVariableConfigurations();