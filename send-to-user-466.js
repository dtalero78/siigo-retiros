require('dotenv').config();
const { Pool } = require('pg');
const { sendSurveyInvitationWithButton } = require('./services/whatsapp-button-sender');

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function sendMessageToUser466() {
  console.log('\n📱 ENVIANDO MENSAJE CON BOTÓN AL USUARIO ID 466\n');
  
  try {
    // Obtener datos del usuario con ID 466
    console.log('🔍 Buscando usuario con ID 466 en PostgreSQL...');
    
    const query = `
      SELECT id, first_name, last_name, phone, identification, area, country
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [466]);
    
    if (result.rows.length === 0) {
      console.error('❌ No se encontró usuario con ID 466');
      process.exit(1);
    }
    
    const user = result.rows[0];
    
    console.log('\n✅ Usuario encontrado:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🆔 ID: ${user.id}`);
    console.log(`👤 Nombre: ${user.first_name} ${user.last_name}`);
    console.log(`📱 Teléfono: ${user.phone}`);
    console.log(`🆔 Identificación: ${user.identification}`);
    console.log(`🏢 Área: ${user.area || 'N/A'}`);
    console.log(`🌍 País: ${user.country || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!user.phone) {
      console.error('❌ El usuario no tiene número de teléfono registrado');
      process.exit(1);
    }
    
    // Preparar URL del formulario
    const formUrl = `https://www.siigo.digital/?user=${user.id}`;
    console.log(`🔗 URL del botón: ${formUrl}\n`);
    
    // Enviar mensaje con botón
    console.log('📤 Enviando mensaje con botón...\n');
    
    const sendResult = await sendSurveyInvitationWithButton({
      id: user.id,
      phone: user.phone,
      first_name: user.first_name
    });
    
    if (sendResult.success) {
      console.log('\n✅ ¡MENSAJE ENVIADO EXITOSAMENTE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 ID del mensaje: ${sendResult.messageId}`);
      console.log(`📊 Estado: ${sendResult.status}`);
      console.log(`📱 Enviado a: ${sendResult.to}`);
      console.log(`🔗 URL del formulario: ${formUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 El usuario verá:');
      console.log('   1. Un mensaje personalizado con su nombre');
      console.log('   2. Un botón azul clickeable "Iniciar Encuesta"');
      console.log('   3. Al presionar el botón se abrirá el formulario');
      console.log(`   4. El formulario tendrá precargado el user ID: ${user.id}\n`);
      
      // Registrar el envío en la base de datos (opcional)
      const updateQuery = `
        UPDATE users 
        SET survey_sent_date = NOW(),
            survey_sent_method = 'whatsapp_button',
            survey_message_id = $1
        WHERE id = $2
      `;
      
      try {
        await pool.query(updateQuery, [sendResult.messageId, user.id]);
        console.log('✅ Envío registrado en la base de datos\n');
      } catch (updateError) {
        console.log('⚠️ No se pudo actualizar el registro en BD:', updateError.message);
      }
      
    } else {
      console.error('\n❌ ERROR AL ENVIAR EL MENSAJE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`Error: ${sendResult.error}`);
      if (sendResult.code) {
        console.error(`Código: ${sendResult.code}`);
      }
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Diagnóstico
      console.log('🔍 POSIBLES CAUSAS:');
      if (sendResult.code === 63016) {
        console.log('   - La plantilla no está aprobada');
        console.log('   - Verifica el Content SID en Twilio Console');
      } else if (sendResult.code === 21608) {
        console.log('   - El número no tiene WhatsApp activo');
        console.log('   - Verifica que el número sea válido');
      } else {
        console.log('   - Verifica las credenciales de Twilio');
        console.log('   - Revisa que el número tenga formato correcto');
        console.log('   - El usuario debe tener WhatsApp activo');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:', error.message);
    console.error(error.stack);
  } finally {
    // Cerrar conexión
    await pool.end();
    console.log('\n🔚 Conexión a PostgreSQL cerrada');
  }
}

// Ejecutar
console.log('🚀 Iniciando envío a usuario ID 466...');
sendMessageToUser466();