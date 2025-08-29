#!/usr/bin/env node

/**
 * Script para actualizar el contador whatsapp_sent_count en registros existentes
 * basándose en el historial de conversaciones de WhatsApp
 */

require('dotenv').config();
const usersDb = require('./database/config').usersDb;
const whatsappService = require('./services/whatsapp-conversation');

async function updateMessageCounts() {
  console.log('🔄 Iniciando actualización de contadores de mensajes WhatsApp...\n');
  
  try {
    // Obtener todos los usuarios
    const users = await usersDb.getUsersWithWhatsAppStatus();
    console.log(`📊 Total de usuarios a procesar: ${users.length}\n`);
    
    let updated = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Solo procesar usuarios que tienen un teléfono
        if (!user.phone) {
          continue;
        }
        
        // Obtener el historial de conversaciones del usuario
        const conversations = await whatsappService.getUserConversations(user.id);
        
        // Contar solo los mensajes enviados por el sistema (outbound)
        const sentMessages = conversations.filter(msg => 
          msg.direction === 'outbound' && 
          msg.status !== 'failed'
        );
        
        const messageCount = sentMessages.length;
        
        // Solo actualizar si el contador actual es diferente
        if (messageCount > 0 && messageCount !== user.whatsapp_sent_count) {
          // Actualizar directamente el contador sin incrementar
          const updateQuery = process.env.DATABASE_TYPE === 'postgres' 
            ? `UPDATE users SET whatsapp_sent_count = $1 WHERE id = $2`
            : `UPDATE users SET whatsapp_sent_count = ? WHERE id = ?`;
          
          if (process.env.DATABASE_TYPE === 'postgres') {
            await usersDb.pool.query(updateQuery, [messageCount, user.id]);
          } else {
            await new Promise((resolve, reject) => {
              usersDb.db.run(updateQuery, [messageCount, user.id], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
          
          console.log(`✅ ${user.first_name} ${user.last_name} (ID: ${user.id}): actualizado a ${messageCount} mensajes`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${user.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📈 Resumen de actualización:');
    console.log(`   - Usuarios actualizados: ${updated}`);
    console.log(`   - Errores: ${errors}`);
    console.log(`   - Total procesado: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar el script
updateMessageCounts();