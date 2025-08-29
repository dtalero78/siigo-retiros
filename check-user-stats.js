require('dotenv').config();
const { Pool } = require('pg');

async function checkStats() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('📊 Verificando estadísticas de usuarios...\n');
    
    // Total de usuarios
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`Total de usuarios: ${totalResult.rows[0].total}`);
    
    // Usuarios con whatsapp_sent = true
    const sentResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE whatsapp_sent = true');
    console.log(`Usuarios con whatsapp_sent = true: ${sentResult.rows[0].total}`);
    
    // Usuarios con whatsapp_sent_count > 0
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE whatsapp_sent_count > 0');
    console.log(`Usuarios con whatsapp_sent_count > 0: ${countResult.rows[0].total}`);
    
    // Usuarios con whatsapp_sent_count = 0 o NULL
    const noCountResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE whatsapp_sent_count = 0 OR whatsapp_sent_count IS NULL');
    console.log(`Usuarios con whatsapp_sent_count = 0 o NULL: ${noCountResult.rows[0].total}`);
    
    // Distribución de contadores
    console.log('\n📈 Distribución de mensajes enviados:');
    const distribution = await pool.query(`
      SELECT 
        whatsapp_sent_count,
        COUNT(*) as cantidad
      FROM users
      GROUP BY whatsapp_sent_count
      ORDER BY whatsapp_sent_count
    `);
    
    distribution.rows.forEach(row => {
      console.log(`   ${row.whatsapp_sent_count || 'NULL'} mensajes: ${row.cantidad} usuarios`);
    });
    
    // Verificar usuarios que NO tienen whatsapp_sent pero sí tienen contador
    const inconsistent = await pool.query(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE whatsapp_sent = false AND whatsapp_sent_count > 0
    `);
    console.log(`\n⚠️  Usuarios inconsistentes (sin whatsapp_sent pero con contador > 0): ${inconsistent.rows[0].total}`);
    
    // Usuarios que nunca han recibido mensaje
    const neverSent = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at
      FROM users 
      WHERE (whatsapp_sent = false OR whatsapp_sent IS NULL) 
        AND (whatsapp_sent_count = 0 OR whatsapp_sent_count IS NULL)
      LIMIT 10
    `);
    
    if (neverSent.rows.length > 0) {
      console.log('\n👥 Primeros 10 usuarios sin mensajes enviados:');
      neverSent.rows.forEach(user => {
        console.log(`   ID: ${user.id} - ${user.first_name} ${user.last_name} - Tel: ${user.phone || 'Sin teléfono'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStats();