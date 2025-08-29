require('dotenv').config();
const { Pool } = require('pg');

async function addColumn() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_sent_count INTEGER DEFAULT 0');
    console.log('✅ Columna whatsapp_sent_count agregada a PostgreSQL');
    
    // Verificar que la columna existe
    const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='whatsapp_sent_count'");
    if (result.rows.length > 0) {
      console.log('✅ Columna verificada exitosamente');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();