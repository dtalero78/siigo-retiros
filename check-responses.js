require('dotenv').config();
const { Pool } = require('pg');

async function checkResponses() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const poolResponses = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('📊 Verificando respuestas de usuarios...\n');
    
    // Obtener todos los usuarios
    const usersResult = await pool.query('SELECT id, identification, whatsapp_sent_count FROM users');
    const users = usersResult.rows;
    
    // Obtener todas las respuestas
    const responsesResult = await poolResponses.query('SELECT DISTINCT identification FROM responses WHERE identification IS NOT NULL');
    const responseIdentifications = new Set(responsesResult.rows.map(r => r.identification));
    
    // Contar usuarios con y sin respuesta
    let withResponse = 0;
    let withoutResponse = 0;
    let oneMessageNoResponse = 0;
    
    users.forEach(user => {
      if (responseIdentifications.has(user.identification)) {
        withResponse++;
      } else {
        withoutResponse++;
        if (user.whatsapp_sent_count === 1) {
          oneMessageNoResponse++;
        }
      }
    });
    
    console.log(`Total de usuarios: ${users.length}`);
    console.log(`Usuarios CON respuesta: ${withResponse}`);
    console.log(`Usuarios SIN respuesta: ${withoutResponse}`);
    console.log(`\nUsuarios con 1 mensaje enviado Y sin respuesta: ${oneMessageNoResponse}`);
    
    // Verificar por qué el filtro muestra 98
    console.log('\n🔍 Explicación del filtro "Un solo mensaje enviado":');
    console.log(`   - Total con whatsapp_sent_count = 1: ${users.filter(u => u.whatsapp_sent_count === 1).length}`);
    console.log(`   - De estos, sin respuesta: ${oneMessageNoResponse}`);
    console.log(`   - De estos, con respuesta: ${withResponse}`);
    
    // Mostrar algunos usuarios sin respuesta
    const usersSinRespuesta = await pool.query(`
      SELECT id, first_name, last_name, identification, whatsapp_sent_count 
      FROM users 
      WHERE identification NOT IN (
        SELECT DISTINCT identification 
        FROM responses 
        WHERE identification IS NOT NULL
      )
      LIMIT 5
    `);
    
    console.log('\n👥 Muestra de usuarios sin respuesta:');
    usersSinRespuesta.rows.forEach(user => {
      console.log(`   ID: ${user.id} - ${user.first_name} ${user.last_name} - Mensajes: ${user.whatsapp_sent_count}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    await poolResponses.end();
  }
}

checkResponses();