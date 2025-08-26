require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixBooleanValues() {
  try {
    console.log('🔧 Corrigiendo valores booleanos en PostgreSQL...\n');
    
    // Primero, cambiar el tipo de columna a TEXT usando columnas temporales
    console.log('📝 Cambiando tipos de columna de BOOLEAN a TEXT...');
    
    // Crear columnas temporales
    await pool.query('ALTER TABLE responses ADD COLUMN would_recommend_temp TEXT');
    await pool.query('ALTER TABLE responses ADD COLUMN would_return_temp TEXT');
    console.log('✅ Columnas temporales creadas');
    
    // Copiar datos convirtiendo boolean a texto
    await pool.query(`
      UPDATE responses 
      SET would_recommend_temp = CASE 
        WHEN would_recommend = true THEN 'SÍ'
        WHEN would_recommend = false THEN 'NO'
        ELSE NULL
      END
    `);
    
    await pool.query(`
      UPDATE responses 
      SET would_return_temp = CASE 
        WHEN would_return = true THEN 'SÍ'
        WHEN would_return = false THEN 'NO'
        ELSE NULL
      END
    `);
    console.log('✅ Datos copiados a columnas temporales');
    
    // Eliminar columnas originales
    await pool.query('ALTER TABLE responses DROP COLUMN would_recommend');
    await pool.query('ALTER TABLE responses DROP COLUMN would_return');
    console.log('✅ Columnas originales eliminadas');
    
    // Renombrar columnas temporales
    await pool.query('ALTER TABLE responses RENAME COLUMN would_recommend_temp TO would_recommend');
    await pool.query('ALTER TABLE responses RENAME COLUMN would_return_temp TO would_return');
    console.log('✅ Columnas renombradas');
    
    // Verificar los cambios
    const verifyResult = await pool.query(`
      SELECT 
        would_recommend, would_return, COUNT(*) as count 
      FROM responses 
      GROUP BY would_recommend, would_return
    `);
    
    console.log('\n📊 Valores actualizados:');
    console.table(verifyResult.rows);
    
    await pool.end();
    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixBooleanValues();