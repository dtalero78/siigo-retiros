require('dotenv').config();
const {
  sendSurveyTemplateWithButton,
  sendApologyTemplateWithButton,
  listTemplatesWithButtons,
  getTemplateSetupInstructions
} = require('./services/twilio-template-button');

// Configuración de prueba
const TEST_TEMPLATE_SID = process.env.TWILIO_TEMPLATE_BUTTON_SID || 'HXxxxx'; // Reemplaza con tu Content SID
const TEST_APOLOGY_TEMPLATE_SID = process.env.TWILIO_APOLOGY_TEMPLATE_SID || 'HXxxxx';

async function testTemplateWithButton() {
  const action = process.argv[2];
  const phone = process.argv[3];
  
  // Mostrar instrucciones si no hay argumentos
  if (!action) {
    console.log('\n📖 USO:');
    console.log('  node test-template-button.js <acción> [teléfono]');
    console.log('\n🎯 ACCIONES DISPONIBLES:');
    console.log('  setup     - Ver instrucciones de configuración');
    console.log('  list      - Listar plantillas con botones disponibles');
    console.log('  send      - Enviar invitación con botón (requiere teléfono)');
    console.log('  apology   - Enviar disculpas con botón (requiere teléfono)');
    console.log('\n📝 EJEMPLOS:');
    console.log('  node test-template-button.js setup');
    console.log('  node test-template-button.js list');
    console.log('  node test-template-button.js send 3001234567');
    console.log('  node test-template-button.js apology 3001234567\n');
    process.exit(0);
  }

  // Validar configuración de Twilio
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Error: Configura las variables de entorno de Twilio primero');
    console.error('   TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN son requeridas\n');
    process.exit(1);
  }

  try {
    switch (action) {
      case 'setup':
        console.log(getTemplateSetupInstructions());
        console.log('\n💡 SIGUIENTE PASO:');
        console.log('1. Crea la plantilla en Twilio Console siguiendo estas instrucciones');
        console.log('2. Espera la aprobación de WhatsApp (24-48 horas)');
        console.log('3. Agrega el Content SID a tu archivo .env:');
        console.log('   TWILIO_TEMPLATE_BUTTON_SID=HXxxxx\n');
        break;

      case 'list':
        console.log('\n🔍 Buscando plantillas con botones...\n');
        const listResult = await listTemplatesWithButtons();
        
        if (listResult.success) {
          if (listResult.count === 0) {
            console.log('⚠️ No se encontraron plantillas con botones');
            console.log('\n💡 Crea una nueva plantilla con:');
            console.log('   node test-template-button.js setup\n');
          } else {
            console.log(`✅ Encontradas ${listResult.count} plantilla(s) con botones:\n`);
            listResult.templates.forEach((template, index) => {
              console.log(`${index + 1}. ${template.name}`);
              console.log(`   SID: ${template.sid}`);
              console.log(`   Estado: ${template.status}`);
              console.log(`   Idioma: ${template.language}`);
              console.log(`   Creada: ${template.created}\n`);
            });
            
            console.log('💡 Usa el SID en tu archivo .env:');
            console.log('   TWILIO_TEMPLATE_BUTTON_SID=<SID_de_tu_plantilla>\n');
          }
        } else {
          console.error('❌ Error listando plantillas:', listResult.error);
        }
        break;

      case 'send':
        if (!phone) {
          console.error('❌ Error: Debes proporcionar un número de teléfono');
          console.error('   Ejemplo: node test-template-button.js send 3001234567\n');
          process.exit(1);
        }

        if (TEST_TEMPLATE_SID === 'HXxxxx') {
          console.error('❌ Error: Configura TWILIO_TEMPLATE_BUTTON_SID en tu archivo .env');
          console.error('   Primero crea la plantilla con: node test-template-button.js setup');
          console.error('   Luego lista las plantillas con: node test-template-button.js list\n');
          process.exit(1);
        }

        console.log('\n📤 Enviando invitación con botón...');
        console.log(`📱 Destinatario: ${phone}`);
        console.log(`📄 Template SID: ${TEST_TEMPLATE_SID}\n`);

        // Usuario de prueba
        const testUser = {
          id: 12345, // Este ID se agregará a la URL del botón
          phone: phone,
          first_name: 'Test',
          identification: '1234567890'
        };

        const sendResult = await sendSurveyTemplateWithButton(testUser, TEST_TEMPLATE_SID);
        
        if (sendResult.success) {
          console.log('✅ ¡Mensaje enviado exitosamente!');
          console.log(`📧 ID del mensaje: ${sendResult.messageId}`);
          console.log(`📊 Estado: ${sendResult.status}`);
          console.log(`📱 Enviado a: ${sendResult.to}`);
          console.log('\n🔗 URL del botón generada:');
          console.log(`   https://www.siigo.digital/?user=${testUser.id}`);
          console.log('\n💡 El usuario verá un botón clickeable en WhatsApp');
          console.log('   que abrirá directamente el formulario de encuesta.\n');
        } else {
          console.error('❌ Error al enviar:', sendResult.error);
          if (sendResult.code) {
            console.error(`📌 Código de error: ${sendResult.code}`);
            
            // Sugerencias según el error
            if (sendResult.code === 63016) {
              console.log('\n💡 Solución:');
              console.log('1. Verifica que el Content SID sea correcto');
              console.log('2. Asegúrate que la plantilla esté APROBADA');
              console.log('3. Lista las plantillas disponibles con:');
              console.log('   node test-template-button.js list\n');
            } else if (sendResult.code === 63007) {
              console.log('\n💡 Solución:');
              console.log('1. Verifica que las variables coincidan con la plantilla');
              console.log('2. Revisa la configuración de variables en Twilio Console\n');
            }
          }
        }
        break;

      case 'apology':
        if (!phone) {
          console.error('❌ Error: Debes proporcionar un número de teléfono');
          console.error('   Ejemplo: node test-template-button.js apology 3001234567\n');
          process.exit(1);
        }

        if (TEST_APOLOGY_TEMPLATE_SID === 'HXxxxx') {
          console.error('❌ Error: Configura TWILIO_APOLOGY_TEMPLATE_SID en tu archivo .env');
          console.error('   Primero crea la plantilla de disculpas en Twilio Console\n');
          process.exit(1);
        }

        console.log('\n📤 Enviando mensaje de disculpas con botón...');
        console.log(`📱 Destinatario: ${phone}`);
        console.log(`📄 Template SID: ${TEST_APOLOGY_TEMPLATE_SID}\n`);

        const apologyUser = {
          id: 12345,
          phone: phone,
          first_name: 'Test'
        };

        const apologyResult = await sendApologyTemplateWithButton(apologyUser, TEST_APOLOGY_TEMPLATE_SID);
        
        if (apologyResult.success) {
          console.log('✅ ¡Mensaje de disculpas enviado!');
          console.log(`📧 ID: ${apologyResult.messageId}`);
          console.log(`🔗 URL del botón: https://www.siigo.digital/?user=${apologyUser.id}\n`);
        } else {
          console.error('❌ Error:', apologyResult.error);
        }
        break;

      default:
        console.error(`❌ Acción no válida: ${action}`);
        console.log('   Usa: setup, list, send, o apology\n');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testTemplateWithButton();