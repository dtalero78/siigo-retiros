require('dotenv').config();
const { listAvailableTemplates } = require('./services/twilio-template');

async function checkTemplates() {
  console.log('\n🔍 VERIFICANDO PLANTILLAS DE WHATSAPP DISPONIBLES\n');
  console.log('=' .repeat(50));
  
  console.log('Cuenta:', process.env.TWILIO_ACCOUNT_SID);
  console.log('Número WhatsApp:', process.env.TWILIO_WHATSAPP_NUMBER);
  console.log('\nBuscando plantillas aprobadas...\n');
  
  const result = await listAvailableTemplates();
  
  if (result.success) {
    if (result.templates.length === 0) {
      console.log('⚠️  No se encontraron plantillas aprobadas.');
      console.log('\n📋 SIGUIENTE PASO:');
      console.log('1. Crea una plantilla en Twilio Console o Facebook Business Manager');
      console.log('2. Espera la aprobación (24-48 horas)');
      console.log('3. La plantilla aparecerá aquí cuando esté lista');
    } else {
      console.log(`✅ Se encontraron ${result.count} plantilla(s):\n`);
      
      result.templates.forEach((template, index) => {
        console.log(`📄 Plantilla ${index + 1}:`);
        console.log(`   SID: ${template.sid}`);
        console.log(`   Nombre: ${template.friendlyName || 'Sin nombre'}`);
        console.log(`   Estado: ${template.status}`);
        console.log(`   Idioma: ${template.language || 'No especificado'}`);
        if (template.variables) {
          console.log(`   Variables: ${JSON.stringify(template.variables)}`);
        }
        console.log('');
      });
      
      console.log('💡 Usa el SID de la plantilla en tu código para enviar mensajes.');
    }
  } else {
    console.log('❌ Error al obtener plantillas:', result.error);
  }
  
  console.log('=' .repeat(50));
  console.log('\n📚 INSTRUCCIONES PARA CREAR PLANTILLA:\n');
  console.log('1. Ve a: https://console.twilio.com/us1/develop/sms/content-editor');
  console.log('2. O usa Facebook Business Manager si prefieres');
  console.log('3. Crea una plantilla para "Encuesta de Salida"');
  console.log('4. Incluye variables para: nombre, link de encuesta');
  console.log('5. Espera aprobación (24-48 horas)');
  console.log('6. Ejecuta este script de nuevo para ver el SID\n');
}

checkTemplates().catch(console.error);