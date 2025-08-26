require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkData() {
  try {
    console.log('🔍 Verificando datos en PostgreSQL...\n');
    
    // Verificar total de respuestas
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM responses');
    console.log(`Total de respuestas: ${totalResult.rows[0].total}`);
    
    // Verificar valores de would_recommend
    const recommendResult = await pool.query(`
      SELECT would_recommend, COUNT(*) as count 
      FROM responses 
      GROUP BY would_recommend
    `);
    console.log('\nValores de would_recommend:');
    recommendResult.rows.forEach(row => {
      console.log(`  ${row.would_recommend || 'NULL'}: ${row.count} respuestas`);
    });
    
    // Verificar valores de would_return
    const returnResult = await pool.query(`
      SELECT would_return, COUNT(*) as count 
      FROM responses 
      GROUP BY would_return
    `);
    console.log('\nValores de would_return:');
    returnResult.rows.forEach(row => {
      console.log(`  ${row.would_return || 'NULL'}: ${row.count} respuestas`);
    });
    
    // Ver algunas respuestas de ejemplo
    const sampleResult = await pool.query(`
      SELECT id, full_name, would_recommend, would_return 
      FROM responses 
      LIMIT 5
    `);
    console.log('\nPrimeras 5 respuestas:');
    console.table(sampleResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();