// Script para probar conexión a PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Probando conexión a PostgreSQL...\n');
  
  const connectionString = process.env.DATABASE_URL;
  console.log('URL de conexión:', connectionString.replace(/:[^:@]*@/, ':****@')); // Ocultar password
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      require: true
    },
    connectionTimeoutMillis: 15000 // 15 segundos timeout
  });

  try {
    console.log('Intentando conectar...');
    const client = await pool.connect();
    
    console.log('✅ Conexión exitosa!\n');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW()');
    console.log('Hora del servidor:', result.rows[0].now);
    
    // Verificar versión
    const versionResult = await client.query('SELECT version()');
    console.log('Versión de PostgreSQL:', versionResult.rows[0].version.split(',')[0]);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Todo funciona correctamente!');
    console.log('Puedes proceder con la migración.');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\nDetalles del error:', error);
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que la URL de conexión sea correcta');
    console.log('2. Asegúrate de que tu IP esté en la whitelist de DigitalOcean');
    console.log('3. Verifica las credenciales (usuario y contraseña)');
    console.log('4. Confirma que la base de datos existe');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();