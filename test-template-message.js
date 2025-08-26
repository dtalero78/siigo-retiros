require('dotenv').config();
const { sendTemplateMessage } = require('./services/twilio-template');

// Obtener número y template del argumento
const phoneNumber = process.argv[2];
const templateSid = process.argv[3] || 'HX04650a61362e4a55568f19ae7b884308'; // message_opt_in por defecto

if (!phoneNumber) {
  console.log('❌ Uso: node test-template-message.js <número> [template-sid]');
  console.log('Ejemplo: node test-template-message.js 573008021701');
  console.log('\nPlantillas disponibles:');
  console.log('- HX04650a61362e4a55568f19ae7b884308 (message_opt_in)');
  console.log('- HXaf1d78baaa13e55d369f7180087ed7c2 (marketing_welcome)');
  process.exit(1);
}

async function testTemplate() {
  console.log('\n📱 ENVIANDO MENSAJE CON PLANTILLA APROBADA\n');
  console.log('=' .repeat(50));
  
  console.log('Número destino:', phoneNumber);
  console.log('Template SID:', templateSid);
  console.log('Tipo: Plantilla aprobada (no requiere opt-in previo)');
  
  // Variables para la plantilla (ajustar según la plantilla)
  const variables = {};
  
  // Si es la plantilla de welcome, agregar variables
  if (templateSid.includes('af1d78ba')) {
    variables.first_name = 'Usuario';
    variables.discount_code = 'SIIGO2024';
    variables.discount_percentage = '10';
  }
  
  console.log('\n📤 Enviando...\n');
  
  const result = await sendTemplateMessage(phoneNumber, templateSid, variables);
  
  console.log('=' .repeat(50));
  
  if (result.success) {
    console.log('\n✅ PLANTILLA ENVIADA EXITOSAMENTE');
    console.log('   ID del mensaje:', result.messageId);
    console.log('   Estado:', result.status);
    console.log('\n🎉 Este mensaje llegará aunque el usuario NO haya enviado "Hola" primero');
    console.log('   porque estás usando una plantilla aprobada con WhatsApp Business API.');
  } else {
    console.log('\n❌ ERROR AL ENVIAR');
    console.log('   Error:', result.error);
    console.log('   Código:', result.code);
    
    if (result.code === 63016) {
      console.log('\n💡 Esta plantilla no está disponible o no está aprobada.');
      console.log('   Verifica el SID o crea una nueva plantilla.');
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

testTemplate().catch(console.error);