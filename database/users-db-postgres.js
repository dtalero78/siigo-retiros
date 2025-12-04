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
          paisContratacion VARCHAR(50),
          -- Nuevos campos
          codigoEmpleado VARCHAR(50),
          tipoIdentificacion VARCHAR(50),
          tipoEmpleado VARCHAR(100),
          estado VARCHAR(50),
          genero VARCHAR(20),
          motivoRetiro VARCHAR(255),
          division VARCHAR(100),
          codCeco VARCHAR(50),
          subCeco VARCHAR(100),
          codigoSubCeco VARCHAR(50),
          subcentroCosto VARCHAR(255),
          proyecto VARCHAR(255),
          celula VARCHAR(100),
          codPosicion VARCHAR(50),
          codigoJefe VARCHAR(50),
          emailCorporativo1 VARCHAR(255),
          emailCorporativo2 VARCHAR(255)
        )
      `);

      // Agregar columnas nuevas si no existen (para tablas existentes)
      const newColumns = [
        { name: 'codigoEmpleado', type: 'VARCHAR(50)' },
        { name: 'tipoIdentificacion', type: 'VARCHAR(50)' },
        { name: 'tipoEmpleado', type: 'VARCHAR(100)' },
        { name: 'estado', type: 'VARCHAR(50)' },
        { name: 'genero', type: 'VARCHAR(20)' },
        { name: 'motivoRetiro', type: 'VARCHAR(255)' },
        { name: 'division', type: 'VARCHAR(100)' },
        { name: 'codCeco', type: 'VARCHAR(50)' },
        { name: 'subCeco', type: 'VARCHAR(100)' },
        { name: 'codigoSubCeco', type: 'VARCHAR(50)' },
        { name: 'subcentroCosto', type: 'VARCHAR(255)' },
        { name: 'proyecto', type: 'VARCHAR(255)' },
        { name: 'celula', type: 'VARCHAR(100)' },
        { name: 'codPosicion', type: 'VARCHAR(50)' },
        { name: 'codigoJefe', type: 'VARCHAR(50)' },
        { name: 'emailCorporativo1', type: 'VARCHAR(255)' },
        { name: 'emailCorporativo2', type: 'VARCHAR(255)' }
      ];

      for (const col of newColumns) {
        try {
          await this.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        } catch (err) {
          // Ignorar errores si la columna ya existe
        }
      }

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
        liderEntrenamiento, paisContratacion,
        codigoEmpleado, tipoIdentificacion, tipoEmpleado, estado, genero,
        motivoRetiro, division, codCeco, subCeco, codigoSubCeco,
        subcentroCosto, proyecto, celula, codPosicion, codigoJefe,
        emailCorporativo1, emailCorporativo2
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
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
        paisContratacion = EXCLUDED.paisContratacion,
        codigoEmpleado = EXCLUDED.codigoEmpleado,
        tipoIdentificacion = EXCLUDED.tipoIdentificacion,
        tipoEmpleado = EXCLUDED.tipoEmpleado,
        estado = EXCLUDED.estado,
        genero = EXCLUDED.genero,
        motivoRetiro = EXCLUDED.motivoRetiro,
        division = EXCLUDED.division,
        codCeco = EXCLUDED.codCeco,
        subCeco = EXCLUDED.subCeco,
        codigoSubCeco = EXCLUDED.codigoSubCeco,
        subcentroCosto = EXCLUDED.subcentroCosto,
        proyecto = EXCLUDED.proyecto,
        celula = EXCLUDED.celula,
        codPosicion = EXCLUDED.codPosicion,
        codigoJefe = EXCLUDED.codigoJefe,
        emailCorporativo1 = EXCLUDED.emailCorporativo1,
        emailCorporativo2 = EXCLUDED.emailCorporativo2
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
      userData.paisContratacion || null,
      userData.codigoEmpleado || null,
      userData.tipoIdentificacion || null,
      userData.tipoEmpleado || null,
      userData.estado || null,
      userData.genero || null,
      userData.motivoRetiro || null,
      userData.division || null,
      userData.codCeco || null,
      userData.subCeco || null,
      userData.codigoSubCeco || null,
      userData.subcentroCosto || null,
      userData.proyecto || null,
      userData.celula || null,
      userData.codPosicion || null,
      userData.codigoJefe || null,
      userData.emailCorporativo1 || null,
      userData.emailCorporativo2 || null
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
             whatsapp_message_id = $1,
             whatsapp_sent_count = COALESCE(whatsapp_sent_count, 0) + 1
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

  // Obtener usuarios con estado de WhatsApp (para la página de usuarios)
  async getUsersWithWhatsAppStatus() {
    try {
      const result = await this.pool.query(
        `SELECT * FROM users 
         ORDER BY exit_date DESC, created_at DESC`
      );
      
      // Agregar el campo has_response (será completado por la lógica del servidor)
      const usersWithStatus = result.rows.map(user => ({
        ...user,
        has_response: 0 // Se actualizará con la lógica del servidor
      }));
      
      return usersWithStatus;
    } catch (error) {
      console.error('Error obteniendo usuarios con estado WhatsApp:', error);
      throw error;
    }
  }

  // Obtener usuarios filtrados por estado
  async getFilteredUsers(filter) {
    try {
      let query = `SELECT * FROM users`;
      const conditions = [];
      const params = [];
      
      if (filter === 'whatsapp_sent') {
        conditions.push('whatsapp_sent_at IS NOT NULL');
      } else if (filter === 'whatsapp_not_sent') {
        conditions.push('whatsapp_sent_at IS NULL');
      }
      // Note: 'no_response' and 'has_response' filters serán manejados por la lógica del servidor
      // ya que requieren consultas cruzadas entre bases de datos
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY exit_date DESC, created_at DESC';
      
      const result = await this.pool.query(query, params);
      
      // Agregar el campo has_response (será completado por la lógica del servidor)
      const usersWithStatus = result.rows.map(user => ({
        ...user,
        has_response: 0 // Se actualizará con la lógica del servidor
      }));
      
      return usersWithStatus;
    } catch (error) {
      console.error('Error obteniendo usuarios filtrados:', error);
      throw error;
    }
  }

  // Cerrar conexión
  async close() {
    await this.pool.end();
  }
}

module.exports = UsersDbPostgres;