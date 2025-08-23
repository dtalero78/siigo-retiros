#!/usr/bin/env node

/**
 * Script para migrar datos de SQLite a PostgreSQL
 * Uso: node scripts/migrate-to-postgres.js
 */

require('dotenv').config();
const Database = require('../database/db'); // SQLite
const UsersDatabase = require('../database/users-db'); // SQLite
const DatabasePostgres = require('../database/db-postgres');
const UsersDbPostgres = require('../database/users-db-postgres');

async function migrate() {
  console.log('🚀 Iniciando migración de SQLite a PostgreSQL...\n');

  try {
    // 1. Conectar a ambas bases de datos
    console.log('📁 Conectando a SQLite...');
    const sqliteDb = new Database();
    const sqliteUsersDb = new UsersDatabase();

    console.log('🐘 Conectando a PostgreSQL...');
    const pgDb = new DatabasePostgres();
    const pgUsersDb = new UsersDbPostgres();

    // Dar tiempo para que se inicialicen las tablas
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Migrar respuestas
    console.log('\n📋 Migrando respuestas...');
    const responses = await sqliteDb.getAllResponses();
    console.log(`  Encontradas ${responses.length} respuestas`);

    let responsesSuccess = 0;
    let responsesErrors = 0;

    for (const response of responses) {
      try {
        // Preparar datos para PostgreSQL
        const responseData = {
          full_name: response.full_name,
          identification: response.identification,
          exit_date: response.exit_date,
          tenure: response.tenure,
          area: response.area,
          country: response.country,
          last_leader: response.last_leader,
          exit_reason_category: response.exit_reason_category,
          exit_reason_detail: response.exit_reason_detail,
          experience_rating: response.experience_rating,
          would_recommend: response.would_recommend === 1 || response.would_recommend === true,
          would_return: response.would_return === 1 || response.would_return === true,
          what_enjoyed: response.what_enjoyed,
          what_to_improve: response.what_to_improve,
          satisfaction_ratings: response.satisfaction_ratings,
          new_company_info: response.new_company_info,
          fechaInicio: response.fechaInicio,
          cargo: response.cargo,
          subArea: response.subArea,
          lider: response.lider,
          liderEntrenamiento: response.liderEntrenamiento,
          paisContratacion: response.paisContratacion
        };

        const newId = await pgDb.addResponse(responseData);
        
        // Si hay análisis, actualizarlo
        if (response.analysis) {
          await pgDb.updateAnalysis(newId, response.analysis);
        }

        responsesSuccess++;
        process.stdout.write(`\r  ✅ Migradas: ${responsesSuccess}/${responses.length}`);
      } catch (error) {
        responsesErrors++;
        console.error(`\n  ❌ Error migrando respuesta ${response.identification}:`, error.message);
      }
    }

    console.log(`\n  ✅ Respuestas migradas: ${responsesSuccess}`);
    if (responsesErrors > 0) {
      console.log(`  ⚠️  Errores: ${responsesErrors}`);
    }

    // 3. Migrar usuarios
    console.log('\n👥 Migrando usuarios...');
    const users = await sqliteUsersDb.getAllUsers();
    console.log(`  Encontrados ${users.length} usuarios`);

    let usersSuccess = 0;
    let usersErrors = 0;

    for (const user of users) {
      try {
        // Preparar datos para PostgreSQL
        const userData = {
          first_name: user.first_name,
          last_name: user.last_name,
          identification: user.identification,
          phone: user.phone,
          exit_date: user.exit_date,
          area: user.area,
          country: user.country,
          fechaInicio: user.fechaInicio,
          cargo: user.cargo,
          subArea: user.subArea,
          lider: user.lider,
          liderEntrenamiento: user.liderEntrenamiento,
          paisContratacion: user.paisContratacion
        };

        const newUserId = await pgUsersDb.addUser(userData);

        // Actualizar estados si existen
        if (user.whatsapp_sent) {
          await pgUsersDb.updateWhatsAppStatus(newUserId, user.whatsapp_message_id);
        }
        if (user.response_submitted) {
          await pgUsersDb.updateResponseStatus(user.identification);
        }

        usersSuccess++;
        process.stdout.write(`\r  ✅ Migrados: ${usersSuccess}/${users.length}`);
      } catch (error) {
        usersErrors++;
        console.error(`\n  ❌ Error migrando usuario ${user.identification}:`, error.message);
      }
    }

    console.log(`\n  ✅ Usuarios migrados: ${usersSuccess}`);
    if (usersErrors > 0) {
      console.log(`  ⚠️  Errores: ${usersErrors}`);
    }

    // 4. Verificar migración
    console.log('\n🔍 Verificando migración...');
    const pgResponsesCount = await pgDb.getAllResponses();
    const pgUsersCount = await pgUsersDb.getAllUsers();

    console.log(`  PostgreSQL - Respuestas: ${pgResponsesCount.length}`);
    console.log(`  PostgreSQL - Usuarios: ${pgUsersCount.length}`);

    // 5. Cerrar conexiones
    await pgDb.close();
    await pgUsersDb.close();

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('  1. Actualiza DATABASE_TYPE=postgres en tu archivo .env');
    console.log('  2. Reinicia el servidor');
    console.log('  3. Verifica que todo funcione correctamente');
    console.log('  4. Opcional: Haz backup de los archivos SQLite antes de eliminarlos');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrate();