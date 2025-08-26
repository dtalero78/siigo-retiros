require('dotenv').config();
const { Pool } = require('pg');
const { sendSurveyInvitationWithButton } = require('./services/whatsapp-button-sender');

// Nuevo Content SID de la plantilla UTILITY aprobada
const UTILITY_TEMPLATE_SID = 'HXabd9517719a844afc93a367ef4e23927';

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function sendUtilityTemplateToUser466() {
  console.log('\n🚀 ENVIANDO MENSAJE CON PLANTILLA UTILITY AL USUARIO 466\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Nuevo Content SID (UTILITY):', UTILITY_TEMPLATE_SID);
  console.log('📋 Tipo de plantilla: UTILITY (transaccional)');
  console.log('🎯 Destinatario: Usuario ID 466');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Obtener datos del usuario 466
    console.log('🔍 Consultando datos del usuario...');
    
    const query = `
      SELECT id, first_name, last_name, phone, identification, area, country
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [466]);
    
    if (result.rows.length === 0) {
      console.error('❌ Usuario con ID 466 no encontrado');
      process.exit(1);
    }
    
    const user = result.rows[0];
    
    console.log('✅ Usuario encontrado:');
    console.log(`   👤 Nombre: ${user.first_name} ${user.last_name}`);
    console.log(`   📱 Teléfono: ${user.phone}`);
    console.log(`   🏢 Área: ${user.area || 'N/A'}`);
    console.log(`   🆔 ID: ${user.id}\n`);
    
    if (!user.phone) {
      console.error('❌ Usuario sin número de teléfono');
      process.exit(1);
    }
    
    // Preparar envío con la nueva plantilla UTILITY
    console.log('📤 Preparando envío con plantilla UTILITY...');
    console.log(`🔗 URL del botón: https://www.siigo.digital/?user=${user.id}\n`);
    
    // Usar la función actualizada que debe usar el nuevo template SID del .env
    const sendResult = await sendSurveyInvitationWithButton({
      id: user.id,
      phone: user.phone,
      first_name: user.first_name
    });
    
    if (sendResult.success) {
      console.log('🎉 ¡MENSAJE ENVIADO EXITOSAMENTE!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Message ID: ${sendResult.messageId}`);
      console.log(`📊 Estado inicial: ${sendResult.status}`);
      console.log(`📱 Enviado a: ${sendResult.to}`);
      console.log(`🔗 URL del formulario: https://www.siigo.digital/?user=${user.id}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('💡 Lo que verá el usuario:');
      console.log('   1. Mensaje personalizado: "Hola ENRIQUE!"');
      console.log('   2. Texto explicativo de la encuesta de salida');
      console.log('   3. Botón azul clickeable: "Iniciar Encuesta"');
      console.log('   4. Al presionar, abre: https://www.siigo.digital/?user=466\n');
      
      // Esperar y verificar estado
      console.log('⏳ Verificando entrega en 10 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Verificar estado actualizado
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        const message = await client.messages(sendResult.messageId).fetch();
        console.log('📊 ESTADO ACTUALIZADO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Estado: ${message.status}`);
        
        let statusEmoji = '';
        switch(message.status) {
          case 'delivered':
            statusEmoji = '✅ ENTREGADO - ¡El mensaje llegó!';
            break;
          case 'sent':
            statusEmoji = '📤 ENVIADO - En camino al dispositivo';
            break;
          case 'queued':
            statusEmoji = '📬 EN COLA - Esperando procesamiento';
            break;
          case 'accepted':
            statusEmoji = '⏳ ACEPTADO - Procesando envío';
            break;
          case 'read':
            statusEmoji = '👁️ LEÍDO - ¡El usuario lo vio!';
            break;
          case 'undelivered':
            statusEmoji = '❌ NO ENTREGADO - Revisar configuración';
            break;
          case 'failed':
            statusEmoji = '❌ FALLÓ - Error en el envío';
            break;
        }
        
        console.log(`Resultado: ${statusEmoji}`);
        
        if (message.errorCode) {
          console.log(`❌ Error: ${message.errorCode} - ${message.errorMessage}`);
        }
        
        if (message.status === 'delivered' || message.status === 'sent' || message.status === 'read') {
          console.log('\n🎉 ¡ÉXITO! La plantilla UTILITY funcionó correctamente.');
          console.log('Ya puedes usar esta configuración para envíos masivos.');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
      } catch (statusError) {
        console.log('⚠️ No se pudo verificar el estado actualizado');
      }
      
    } else {
      console.error('\n❌ ERROR AL ENVIAR EL MENSAJE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`Error: ${sendResult.error}`);
      if (sendResult.code) {
        console.error(`Código: ${sendResult.code}`);
      }
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    console.log('🔚 Conexión a PostgreSQL cerrada\n');
  }
}

// Mostrar información inicial
console.log('🔧 CONFIGURACIÓN:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🆔 Content SID: ${UTILITY_TEMPLATE_SID}`);
console.log(`📋 Tipo: UTILITY (recomendado para encuestas de empleados)`);
console.log(`🔗 URL base: https://www.siigo.digital/?user=`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Ejecutar
sendUtilityTemplateToUser466();