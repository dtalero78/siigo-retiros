require('dotenv').config();
const { 
  sendSurveyInvitationWithButton, 
  sendApologyWithButton,
  sendInteractiveButtonMessage 
} = require('./services/twilio-interactive');

// Usuario de prueba
const testUser = {
  id: 123, // ID en la base de datos
  phone: process.argv[2] || '3001234567', // Número de teléfono desde línea de comandos
  first_name: 'Test',
  last_name: 'Usuario',
  identification: '12345678'
};

async function testInteractiveMessages() {
  console.log('\n🧪 Probando mensajes interactivos con botones de WhatsApp\n');
  console.log('Usuario de prueba:', testUser);
  
  // Validar configuración
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Error: Configura las variables de entorno de Twilio primero');
    process.exit(1);
  }

  const testType = process.argv[3] || 'survey'; // survey, apology, o custom

  try {
    let result;
    
    switch(testType) {
      case 'survey':
        console.log('\n📨 Enviando invitación a encuesta con botón...');
        result = await sendSurveyInvitationWithButton(testUser);
        break;
        
      case 'apology':
        console.log('\n📨 Enviando mensaje de disculpas con botón...');
        result = await sendApologyWithButton(testUser);
        break;
        
      case 'custom':
        console.log('\n📨 Enviando mensaje personalizado con botón...');
        const surveyUrl = `https://www.siigo.digital/?user=${testUser.id}`;
        result = await sendInteractiveButtonMessage(
          testUser.phone,
          'Este es un mensaje de prueba con un botón interactivo. Presiona el botón para ir a la encuesta.',
          'Ir a Encuesta 🔗',
          surveyUrl
        );
        break;
        
      default:
        console.error('❌ Tipo de prueba no válido. Usa: survey, apology, o custom');
        process.exit(1);
    }
    
    if (result.success) {
      console.log('\n✅ Mensaje enviado exitosamente!');
      console.log('📱 ID del mensaje:', result.messageId);
      console.log('📊 Estado:', result.status);
      console.log('\n🔗 URL del formulario:', `https://www.siigo.digital/?user=${testUser.id}`);
      console.log('\n💡 El usuario debería ver un botón en WhatsApp que abre directamente el formulario');
    } else {
      console.error('\n❌ Error al enviar mensaje:', result.error);
      if (result.code) {
        console.error('Código de error:', result.code);
      }
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que el número tenga WhatsApp activo');
      console.log('2. Para números nuevos, el usuario debe iniciar conversación primero');
      console.log('3. Considera usar plantillas aprobadas para contacto inicial');
    }
    
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    console.error(error.stack);
  }
}

// Instrucciones de uso
if (process.argv.length < 3) {
  console.log('\n📖 Uso: node test-interactive-button.js <telefono> [tipo]');
  console.log('\nEjemplos:');
  console.log('  node test-interactive-button.js 3001234567 survey');
  console.log('  node test-interactive-button.js 3001234567 apology');
  console.log('  node test-interactive-button.js 3001234567 custom');
  console.log('\nTipos disponibles:');
  console.log('  survey  - Invitación a encuesta con botón');
  console.log('  apology - Mensaje de disculpas con botón');
  console.log('  custom  - Mensaje personalizado de prueba\n');
  process.exit(0);
}

// Ejecutar prueba
testInteractiveMessages();