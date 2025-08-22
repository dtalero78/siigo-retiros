// Script de recuperación de usuarios desde respuestas
const Database = require('./database/db');
const UsersDatabase = require('./database/users-db');

async function recoverUsersFromResponses() {
  try {
    console.log('🚨 INICIANDO RECUPERACIÓN DE USUARIOS...');
    
    const db = new Database();
    const usersDb = new UsersDatabase();
    
    // Obtener todas las respuestas
    const responses = await db.getAllResponses();
    console.log(`📊 Respuestas encontradas: ${responses.length}`);
    
    if (responses.length === 0) {
      console.log('❌ No hay respuestas para recuperar usuarios');
      return;
    }
    
    const recoveredUsers = [];
    
    for (const response of responses) {
      // Extraer datos del usuario desde la respuesta
      if (!response.full_name) continue;
      
      const nameParts = response.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const userData = {
        first_name: firstName,
        last_name: lastName,
        identification: response.identification || `REC-${response.id}`,
        phone: null, // No tenemos teléfonos en las respuestas
        exit_date: response.exit_date || new Date().toISOString().split('T')[0],
        area: response.area || 'Sin área',
        country: response.country || 'Colombia',
        fechaInicio: null,
        cargo: null,
        subArea: null,
        lider: response.last_leader || null,
        liderEntrenamiento: null,
        paisContratacion: response.country || 'Colombia'
      };
      
      try {
        // Verificar si ya existe un usuario con esta identificación
        const existingUser = await usersDb.getUserByIdentification(userData.identification);
        
        if (!existingUser) {
          const newUserId = await usersDb.addUser(userData);
          
          // Actualizar la respuesta con el user_id correcto
          await db.updateResponseUserId(response.id, newUserId);
          
          recoveredUsers.push({
            id: newUserId,
            name: response.full_name,
            area: response.area,
            responseId: response.id
          });
          
          console.log(`✅ Usuario recuperado: ${response.full_name} (ID: ${newUserId})`);
        } else {
          console.log(`⚠️ Usuario ya existe: ${response.full_name}`);
        }
      } catch (error) {
        console.error(`❌ Error recuperando ${response.full_name}:`, error.message);
      }
    }
    
    console.log('\n🎉 RECUPERACIÓN COMPLETADA:');
    console.log(`📊 Total respuestas: ${responses.length}`);
    console.log(`👥 Usuarios recuperados: ${recoveredUsers.length}`);
    console.log(`🔗 Respuestas vinculadas: ${recoveredUsers.length}`);
    
    // Mostrar resumen
    console.log('\n📋 USUARIOS RECUPERADOS:');
    recoveredUsers.forEach(user => {
      console.log(`${user.id}: ${user.name} (${user.area})`);
    });
    
    db.close();
    usersDb.close();
    
  } catch (error) {
    console.error('💥 Error durante la recuperación:', error);
  }
}

// Función auxiliar para actualizar user_id en respuestas
Database.prototype.updateResponseUserId = function(responseId, userId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE responses SET user_id = ? WHERE id = ?`;
    this.db.run(sql, [userId, responseId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

recoverUsersFromResponses();