require('dotenv').config();
const { sendTemplateMessage } = require('./services/twilio-template');
const Database = require('./database/db');
const UsersDatabase = require('./database/users-db');
const PostgreSQLDatabase = require('./database/db-postgres');
const PostgreSQLUsersDatabase = require('./database/users-db-postgres');

// SID de la nueva plantilla aprobada  
const SURVEY_TEMPLATE_SID = 'HXf052bc7cb7a44ab25e4df78eba76de9f';

// Obtener ID del usuario del argumento
const userId = process.argv[2];

if (!userId) {
  console.log('❌ Uso: node send-survey-to-user.js <user-id>');
  console.log('Ejemplo: node send-survey-to-user.js 466');
  process.exit(1);
}

async function sendSurveyToUser() {
  console.log('\n📱 ENVIANDO ENCUESTA A USUARIO DE LA BASE DE DATOS\n');
  console.log('=' .repeat(50));
  
  // Detectar tipo de base de datos
  const dbType = process.env.DATABASE_TYPE || 'sqlite';
  console.log('Base de datos:', dbType);
  
  let usersDb;
  
  try {
    // Conectar a la base de datos correcta
    if (dbType === 'postgres') {
      usersDb = new PostgreSQLUsersDatabase();
      // No llamar connect() porque el constructor ya lo hace
    } else {
      usersDb = new UsersDatabase();
    }
    
    // Buscar el usuario
    console.log(`\n🔍 Buscando usuario con ID: ${userId}\n`);
    const user = await usersDb.getUser(userId);
    
    if (!user) {
      console.log(`❌ No se encontró el usuario con ID ${userId}`);
      return;
    }
    
    // Mostrar información del usuario
    console.log('👤 USUARIO ENCONTRADO:');
    console.log('   ID:', user.id);
    console.log('   Nombre:', user.first_name, user.last_name);
    console.log('   Identificación:', user.identification);
    console.log('   Teléfono:', user.phone || 'No registrado');
    console.log('   Área:', user.area);
    console.log('   País:', user.country);
    console.log('   Fecha salida:', user.exit_date);
    console.log('   Encuesta enviada:', user.survey_sent ? 'Sí' : 'No');
    
    // Verificar que tenga teléfono
    if (!user.phone) {
      console.log('\n❌ Este usuario no tiene número de teléfono registrado');
      console.log('   Por favor, actualiza el número de teléfono en la base de datos');
      return;
    }
    
    // Si ya se envió la encuesta, preguntar si re-enviar
    if (user.survey_sent) {
      console.log('\n⚠️  La encuesta ya fue enviada a este usuario anteriormente');
    }
    
    // Generar URL de la encuesta
    const formUrl = process.env.FORM_URL || 'https://www.siigo.digital';
    const surveyUrl = `${formUrl}/?id=${user.identification}`;
    
    console.log('\n📋 PREPARANDO ENVÍO:');
    console.log('   Plantilla: siigo (HX328f1e3d4eb8664aa2674b3edec72729)');
    console.log('   Destinatario:', user.phone);
    console.log('   URL Encuesta:', surveyUrl);
    
    // Variables para la plantilla
    const variables = {
      "1": user.first_name || 'Colaborador',  // Nombre del empleado
      "2": surveyUrl                           // Link de la encuesta
    };
    
    console.log('\n📤 Enviando invitación por WhatsApp...\n');
    
    const result = await sendTemplateMessage(user.phone, SURVEY_TEMPLATE_SID, variables);
    
    console.log('=' .repeat(50));
    
    if (result.success) {
      console.log('\n✅ INVITACIÓN ENVIADA EXITOSAMENTE');
      console.log('   ID del mensaje:', result.messageId);
      console.log('   Estado:', result.status);
      
      // Actualizar el estado en la base de datos
      try {
        await usersDb.updateUserSurveySent(userId, true);
        console.log('\n📊 Base de datos actualizada:');
        console.log('   survey_sent = true');
        console.log('   survey_sent_date = ' + new Date().toISOString());
      } catch (updateError) {
        console.log('\n⚠️  No se pudo actualizar el estado en la BD:', updateError.message);
      }
      
      console.log('\n🎉 El empleado recibirá la invitación en WhatsApp');
      console.log('   Aparecerá como: Siigo ✓');
      console.log('   Link personalizado con ID:', user.identification);
      
    } else {
      console.log('\n❌ ERROR AL ENVIAR');
      console.log('   Error:', result.error);
      console.log('   Código:', result.code);
      
      if (result.error.includes('no tiene WhatsApp')) {
        console.log('\n💡 El número podría no tener WhatsApp activo');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cerrar conexión
    if (usersDb && dbType === 'postgres') {
      await usersDb.close();
    } else if (usersDb) {
      usersDb.close();
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

sendSurveyToUser().catch(console.error);