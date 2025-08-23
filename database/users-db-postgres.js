const { Pool } = require('pg');
require('dotenv').config();

class UsersDbPostgres {
  constructor() {
    // Configuración para PostgreSQL
    const connectionConfig = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    } : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'siigo_retiros',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      }
    };

    this.pool = new Pool(connectionConfig);
    this.initDatabase();
  }

  async initDatabase() {
    try {
      // Crear tabla de usuarios si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          identification VARCHAR(50) UNIQUE,
          phone VARCHAR(20),
          exit_date DATE,
          area VARCHAR(100),
          country VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          whatsapp_sent_at TIMESTAMP,
          whatsapp_message_id VARCHAR(255),
          response_submitted BOOLEAN DEFAULT FALSE,
          response_submitted_at TIMESTAMP,
          fechaInicio DATE,
          cargo VARCHAR(255),
          subArea VARCHAR(255),
          lider VARCHAR(255),
          liderEntrenamiento VARCHAR(255),
          paisContratacion VARCHAR(50)
        )
      `);

      // Crear índices
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_identification 
        ON users(identification)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_whatsapp_sent 
        ON users(whatsapp_sent)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_response_submitted 
        ON users(response_submitted)
      `);

      console.log('Tabla de usuarios PostgreSQL inicializada');
    } catch (error) {
      console.error('Error inicializando tabla de usuarios:', error);
      throw error;
    }
  }

  // Agregar un usuario
  async addUser(userData) {
    const query = `
      INSERT INTO users (
        first_name, last_name, identification, phone, exit_date,
        area, country, fechaInicio, cargo, subArea, lider,
        liderEntrenamiento, paisContratacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (identification) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        exit_date = EXCLUDED.exit_date,
        area = EXCLUDED.area,
        country = EXCLUDED.country,
        fechaInicio = EXCLUDED.fechaInicio,
        cargo = EXCLUDED.cargo,
        subArea = EXCLUDED.subArea,
        lider = EXCLUDED.lider,
        liderEntrenamiento = EXCLUDED.liderEntrenamiento,
        paisContratacion = EXCLUDED.paisContratacion
      RETURNING id
    `;

    const values = [
      userData.first_name,
      userData.last_name,
      userData.identification,
      userData.phone,
      userData.exit_date,
      userData.area,
      userData.country,
      userData.fechaInicio || null,
      userData.cargo || null,
      userData.subArea || null,
      userData.lider || null,
      userData.liderEntrenamiento || null,
      userData.paisContratacion || null
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error agregando usuario:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  async getUser(id) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // Obtener usuario por identificación
  async getUserByIdentification(identification) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE identification = $1',
        [identification]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error obteniendo usuario por identificación:', error);
      throw error;
    }
  }

  // Actualizar usuario
  async updateUser(id, userData) {
    const fields = [];
    const values = [];
    let valueIndex = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${valueIndex}`);
        values.push(userData[key]);
        valueIndex++;
      }
    });

    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${valueIndex}
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(id) {
    try {
      const result = await this.pool.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // Actualizar estado de WhatsApp
  async updateWhatsAppStatus(userId, messageId, status = 'sent') {
    try {
      await this.pool.query(
        `UPDATE users 
         SET whatsapp_sent = true, 
             whatsapp_sent_at = CURRENT_TIMESTAMP, 
             whatsapp_message_id = $1
         WHERE id = $2`,
        [messageId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error actualizando estado de WhatsApp:', error);
      throw error;
    }
  }

  // Actualizar estado de respuesta
  async updateResponseStatus(identification) {
    try {
      await this.pool.query(
        `UPDATE users 
         SET response_submitted = true, 
             response_submitted_at = CURRENT_TIMESTAMP
         WHERE identification = $1`,
        [identification]
      );
      return true;
    } catch (error) {
      console.error('Error actualizando estado de respuesta:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN whatsapp_sent = true THEN 1 END) as whatsapp_sent,
          COUNT(CASE WHEN response_submitted = true THEN 1 END) as responses_received,
          COUNT(CASE WHEN whatsapp_sent = false OR whatsapp_sent IS NULL THEN 1 END) as pending
        FROM users
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Inserción masiva
  async bulkInsert(users) {
    let inserted = 0;
    let errors = [];

    for (const user of users) {
      try {
        await this.addUser(user);
        inserted++;
      } catch (error) {
        errors.push({
          user: user.identification,
          error: error.message
        });
      }
    }

    return {
      inserted,
      total: users.length,
      errors
    };
  }

  // Obtener usuarios sin respuesta
  async getUsersWithoutResponse() {
    try {
      const result = await this.pool.query(
        `SELECT * FROM users 
         WHERE response_submitted = false OR response_submitted IS NULL
         ORDER BY exit_date DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo usuarios sin respuesta:', error);
      throw error;
    }
  }

  // Cerrar conexión
  async close() {
    await this.pool.end();
  }
}

module.exports = UsersDbPostgres;