require('dotenv').config();
const { sendSurveyInvitationWithButton } = require('./services/whatsapp-button-sender');

async function testCorrectedTemplate() {
  // Usar usuario 466 para pruebas
  const testUser = {
    id: 466,
    phone: '3008021701',
    first_name: 'Usuario'
  };

  console.log('🧪 PRUEBA CON CONTENTID CORREGIDO');
  console.log('='.repeat(50));
  console.log('📋 ContentSid actualizado: HX4c5c8ed40f20fa12d9b2c04df318ac70 (siigo_twilio_primer)');
  console.log('👤 Usuario de prueba:', testUser);
  console.log('📱 Número destino:', `+57${testUser.phone}`);
  console.log('');

  try {
    console.log('📤 Enviando mensaje de prueba...');
    
    const result = await sendSurveyInvitationWithButton(testUser);
    
    if (result.success) {
      console.log('✅ ÉXITO: Mensaje enviado correctamente');
      console.log('📨 Message SID:', result.message_sid);
      console.log('📋 Template usado:', result.template_sid);
    } else {
      console.log('❌ ERROR:', result.error);
      
      // Si es error 21655, mostrar ayuda específica
      if (result.error && result.error.includes('21655')) {
        console.log('\n💡 ERROR 21655 - ContentSid inválido:');
        console.log('   - El ContentSid no existe en tu cuenta Twilio');
        console.log('   - Verifica que el template esté aprobado para WhatsApp');
        console.log('   - Usa el script check-content-templates.js para ver templates válidos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Verificar argumentos
if (process.argv.length > 2) {
  const phone = process.argv[2];
  if (phone) {
    console.log('📞 Usando teléfono personalizado:', phone);
    testUser.phone = phone;
  }
}

testCorrectedTemplate();