#!/usr/bin/env node

/**
 * Script para hacer backup de las bases de datos
 * Crea archivos JSON con todos los datos
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { getDatabase, getUsersDatabase, DATABASE_TYPE } = require('../database/config');

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupDir = path.join(__dirname, '..', 'backups', `backup_${timestamp}`);

  console.log('🔄 Iniciando backup de bases de datos...');
  console.log(`📁 Tipo de base de datos: ${DATABASE_TYPE}`);
  console.log(`📂 Directorio de backup: ${backupDir}\n`);

  try {
    // Crear directorio de backup
    await fs.mkdir(backupDir, { recursive: true });

    // Conectar a las bases de datos
    const db = getDatabase();
    const usersDb = getUsersDatabase();

    // Backup de respuestas
    console.log('📋 Haciendo backup de respuestas...');
    const responses = await db.getAllResponses();
    await fs.writeFile(
      path.join(backupDir, 'responses.json'),
      JSON.stringify(responses, null, 2),
      'utf8'
    );
    console.log(`  ✅ ${responses.length} respuestas guardadas`);

    // Backup de usuarios
    console.log('👥 Haciendo backup de usuarios...');
    const users = await usersDb.getAllUsers();
    await fs.writeFile(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2),
      'utf8'
    );
    console.log(`  ✅ ${users.length} usuarios guardados`);

    // Crear archivo de metadatos
    const metadata = {
      timestamp: new Date().toISOString(),
      database_type: DATABASE_TYPE,
      counts: {
        responses: responses.length,
        users: users.length
      },
      environment: {
        node_env: process.env.NODE_ENV,
        database_url: process.env.DATABASE_URL ? 'configured' : 'not configured'
      }
    };

    await fs.writeFile(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    // Crear script de restauración
    const restoreScript = `#!/usr/bin/env node
// Script de restauración para backup del ${timestamp}
// Uso: node restore.js

const fs = require('fs');
const path = require('path');

async function restore() {
  console.log('Restaurando backup del ${timestamp}...');
  
  try {
    const responses = JSON.parse(fs.readFileSync(path.join(__dirname, 'responses.json'), 'utf8'));
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    
    console.log('Datos cargados:');
    console.log('- Respuestas:', responses.length);
    console.log('- Usuarios:', users.length);
    
    // Aquí agregarías el código para insertar en la base de datos
    console.log('\\n⚠️  Para completar la restauración, ejecuta:');
    console.log('node scripts/restore-from-backup.js ' + path.basename(__dirname));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

restore();
`;

    await fs.writeFile(
      path.join(backupDir, 'restore.js'),
      restoreScript,
      'utf8'
    );

    // Cerrar conexiones si es PostgreSQL
    if (DATABASE_TYPE === 'postgres') {
      await db.close();
      await usersDb.close();
    }

    console.log('\n✅ Backup completado exitosamente!');
    console.log(`📁 Archivos guardados en: ${backupDir}`);
    console.log('\n📄 Archivos creados:');
    console.log('  - responses.json');
    console.log('  - users.json');
    console.log('  - metadata.json');
    console.log('  - restore.js');

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    process.exit(1);
  }
}

// Ejecutar backup
backup();