#!/usr/bin/env node

/**
 * Script simplificado para actualizar el contador whatsapp_sent_count
 * en registros existentes basándose en el campo whatsapp_sent
 */

require('dotenv').config();

// Importar la base de datos correcta según la configuración
const UsersDb = process.env.DATABASE_TYPE === 'postgres' 
  ? require('./database/users-db-postgres')
  : require('./database/users-db');

const usersDb = new UsersDb();

async function updateMessageCounts() {
  console.log('🔄 Iniciando actualización de contadores de mensajes WhatsApp...\n');
  
  try {
    let updateQuery;
    
    if (process.env.DATABASE_TYPE === 'postgres') {
      // Para PostgreSQL
      updateQuery = `
        UPDATE users 
        SET whatsapp_sent_count = CASE 
          WHEN whatsapp_sent = true THEN 1 
          ELSE 0 
        END
        WHERE whatsapp_sent_count IS NULL OR whatsapp_sent_count = 0
      `;
      
      const result = await usersDb.pool.query(updateQuery);
      console.log(`✅ PostgreSQL: ${result.rowCount} registros actualizados`);
      
    } else {
      // Para SQLite
      updateQuery = `
        UPDATE users 
        SET whatsapp_sent_count = CASE 
          WHEN whatsapp_sent = 1 THEN 1 
          ELSE 0 
        END
        WHERE whatsapp_sent_count IS NULL OR whatsapp_sent_count = 0
      `;
      
      await new Promise((resolve, reject) => {
        usersDb.db.run(updateQuery, function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ SQLite: ${this.changes} registros actualizados`);
            resolve();
          }
        });
      });
    }
    
    // Mostrar estadísticas actualizadas
    const users = await usersDb.getUsersWithWhatsAppStatus();
    const withMessages = users.filter(u => u.whatsapp_sent_count > 0);
    const withoutMessages = users.filter(u => u.whatsapp_sent_count === 0 || !u.whatsapp_sent_count);
    
    console.log('\n📊 Estadísticas actualizadas:');
    console.log(`   - Usuarios con al menos 1 mensaje: ${withMessages.length}`);
    console.log(`   - Usuarios sin mensajes: ${withoutMessages.length}`);
    console.log(`   - Total de usuarios: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar el script
updateMessageCounts();