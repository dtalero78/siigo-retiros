require('dotenv').config();
const { sendTemplateWithUrlButton } = require('./services/twilio-template-button');

// Content SID de la plantilla aprobada
const APPROVED_TEMPLATE_SID = 'HXd85118b65ad3e326a4b6a4531b578bf2';

async function testApprovedTemplate() {
  // Obtener número de teléfono de los argumentos
  const phone = process.argv[2];
  const userId = process.argv[3] || '12345';
  const firstName = process.argv[4] || 'Daniel';
  
  if (!phone) {
    console.log('\n📖 USO:');
    console.log('  node test-approved-template.js <teléfono> [userId] [nombre]');
    console.log('\n📝 EJEMPLOS:');
    console.log('  node test-approved-template.js 3001234567');
    console.log('  node test-approved-template.js 3001234567 999 Daniel');
    console.log('\n💡 NOTAS:');
    console.log('  - El userId se usará en la URL del botón');
    console.log('  - El nombre aparecerá en el saludo del mensaje');
    console.log('  - Template SID: HXd85118b65ad3e326a4b6a4531b578bf2\n');
    process.exit(0);
  }

  console.log('\n🚀 PRUEBA DE PLANTILLA CON BOTÓN APROBADA\n');
  console.log('📄 Template SID:', APPROVED_TEMPLATE_SID);
  console.log('📱 Destinatario:', phone);
  console.log('🆔 User ID:', userId);
  console.log('👤 Nombre:', firstName);
  console.log('🔗 URL del botón:', `https://www.siigo.digital/?user=${userId}`);
  console.log('\n📤 Enviando mensaje...\n');

  try {
    // Variables para la plantilla
    // Ajusta estos números según cómo esté configurada tu plantilla en Twilio
    const templateVariables = {
      '1': firstName  // {{1}} en el body del mensaje para el nombre
    };

    // El ID del usuario se agregará al final de la URL del botón
    const buttonUrlVariable = userId;

    // Enviar la plantilla
    const result = await sendTemplateWithUrlButton(
      phone,
      APPROVED_TEMPLATE_SID,
      templateVariables,
      buttonUrlVariable
    );

    if (result.success) {
      console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 ID del mensaje:', result.messageId);
      console.log('📊 Estado:', result.status);
      console.log('📱 Enviado a:', result.to);
      console.log('\n🎯 RESULTADO ESPERADO:');
      console.log('1. El usuario recibirá un mensaje en WhatsApp');
      console.log('2. Verá un botón clickeable en el mensaje');
      console.log('3. Al presionar el botón se abrirá:');
      console.log(`   ${`https://www.siigo.digital/?user=${userId}`}`);
      console.log('\n💡 IMPORTANTE:');
      console.log('- El botón es mucho más visible que un link de texto');
      console.log('- Aumenta significativamente la tasa de respuesta');
      console.log('- La URL se construye dinámicamente con el ID del usuario\n');
    } else {
      console.error('❌ ERROR AL ENVIAR EL MENSAJE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', result.error);
      
      if (result.code) {
        console.error('Código:', result.code);
        
        // Diagnóstico según el error
        switch(result.code) {
          case 63016:
            console.log('\n🔍 DIAGNÓSTICO:');
            console.log('- La plantilla no existe o no está aprobada');
            console.log('- Verifica el Content SID en Twilio Console');
            break;
          case 63007:
            console.log('\n🔍 DIAGNÓSTICO:');
            console.log('- Error con las variables de la plantilla');
            console.log('- Verifica que {{1}} esté configurado en el body');
            console.log('- La URL del botón debe terminar en = o /');
            break;
          case 21608:
            console.log('\n🔍 DIAGNÓSTICO:');
            console.log('- El número no tiene WhatsApp');
            console.log('- Verifica que sea un número válido con WhatsApp activo');
            break;
          default:
            console.log('\n🔍 Revisa la configuración en Twilio Console');
        }
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar prueba
testApprovedTemplate();