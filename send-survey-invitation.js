require('dotenv').config();
const { sendTemplateMessage } = require('./services/twilio-template');

// SID de tu nueva plantilla aprobada
const SURVEY_TEMPLATE_SID = 'HXf052bc7cb7a44ab25e4df78eba76de9f';

// Obtener datos del argumento
const phoneNumber = process.argv[2];
const employeeName = process.argv[3] || 'Colaborador';
const employeeId = process.argv[4] || '12345';

if (!phoneNumber) {
  console.log('❌ Uso: node send-survey-invitation.js <número> [nombre] [id]');
  console.log('Ejemplo: node send-survey-invitation.js 573153369631 "Carlos" "123456"');
  process.exit(1);
}

async function sendSurveyInvitation() {
  console.log('\n📱 ENVIANDO INVITACIÓN DE ENCUESTA DE SALIDA\n');
  console.log('=' .repeat(50));
  
  // Generar URL de la encuesta
  const formUrl = process.env.FORM_URL || 'https://www.siigo.digital';
  const surveyUrl = `${formUrl}/?id=${employeeId}`;
  
  console.log('📋 DETALLES:');
  console.log('   Plantilla: siigo (aprobada)');
  console.log('   Template SID:', SURVEY_TEMPLATE_SID);
  console.log('   Destinatario:', phoneNumber);
  console.log('   Nombre:', employeeName);
  console.log('   URL Encuesta:', surveyUrl);
  
  // Variables para la plantilla
  // Ajustadas según tu plantilla aprobada
  const variables = {
    "1": employeeName,  // Nombre del empleado
    "2": surveyUrl      // Link de la encuesta
  };
  
  console.log('\n📤 Enviando invitación...\n');
  
  const result = await sendTemplateMessage(phoneNumber, SURVEY_TEMPLATE_SID, variables);
  
  console.log('=' .repeat(50));
  
  if (result.success) {
    console.log('\n✅ INVITACIÓN ENVIADA EXITOSAMENTE');
    console.log('   ID del mensaje:', result.messageId);
    console.log('   Estado:', result.status);
    console.log('\n🎉 El empleado recibirá la invitación en WhatsApp');
    console.log('   Aparecerá como: Siigo ✓');
    console.log('   No requiere opt-in previo');
  } else {
    console.log('\n❌ ERROR AL ENVIAR');
    console.log('   Error:', result.error);
    console.log('   Código:', result.code);
  }
  
  console.log('\n' + '=' .repeat(50));
}

sendSurveyInvitation().catch(console.error);