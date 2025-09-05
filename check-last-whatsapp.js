require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkLastWhatsAppMessages() {
  try {
    console.log('🔍 Verificando últimos envíos de WhatsApp...\n');
    
    // Ver últimos 10 usuarios con WhatsApp enviado
    const result = await pool.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        phone, 
        whatsapp_sent_at
      FROM users 
      WHERE whatsapp_sent_at IS NOT NULL 
      ORDER BY whatsapp_sent_at DESC 
      LIMIT 10
    `);
    
    console.log('Últimos envíos de WhatsApp:');
    console.table(result.rows);
    
    // Ver total de usuarios con WhatsApp enviado hoy
    const todayCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE DATE(whatsapp_sent_at) = CURRENT_DATE
    `);
    
    console.log(`\n📊 Usuarios con WhatsApp enviado hoy: ${todayCount.rows[0].count}`);
    
    // Ver usuarios únicos con WhatsApp enviado
    const uniquePhones = await pool.query(`
      SELECT 
        phone,
        COUNT(*) as count,
        STRING_AGG(CAST(id AS VARCHAR), ', ') as user_ids
      FROM users 
      WHERE whatsapp_sent_at IS NOT NULL
        AND phone IS NOT NULL
      GROUP BY phone
      HAVING COUNT(*) > 1
    `);
    
    if (uniquePhones.rows.length > 0) {
      console.log('\n⚠️ Números con múltiples usuarios (posibles duplicados):');
      console.table(uniquePhones.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLastWhatsAppMessages();