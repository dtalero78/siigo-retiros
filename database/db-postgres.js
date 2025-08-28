const { Pool } = require('pg');
require('dotenv').config();

class DatabasePostgres {
  constructor() {
    // Configuración para PostgreSQL - puede venir de DATABASE_URL o variables individuales
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

  // Método auxiliar para parsear JSON de forma segura
  safeJsonParse(value) {
    if (typeof value !== 'string' || !value) {
      return value;
    }
    
    try {
      // Si empieza con { o [ probablemente es JSON
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        return JSON.parse(value);
      }
      // Si no, devolver como string
      return value;
    } catch (error) {
      // Si falla el parsing, devolver el valor original
      console.warn('Error parseando JSON:', value, error.message);
      return value;
    }
  }

  async initDatabase() {
    try {
      // Crear tabla de respuestas si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS responses (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255),
          identification VARCHAR(50),
          exit_date DATE,
          tenure VARCHAR(100),
          area VARCHAR(100),
          country VARCHAR(50),
          last_leader VARCHAR(255),
          exit_reason_category VARCHAR(100),
          exit_reason_detail TEXT,
          experience_rating INTEGER,
          would_recommend TEXT,
          would_return TEXT,
          what_enjoyed TEXT,
          what_to_improve TEXT,
          satisfaction_ratings JSONB,
          new_company_info JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          analysis TEXT,
          fechaInicio DATE,
          cargo VARCHAR(255),
          subArea VARCHAR(255),
          lider VARCHAR(255),
          liderEntrenamiento VARCHAR(255),
          paisContratacion VARCHAR(50)
        )
      `);

      // Crear índices para búsquedas eficientes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_responses_identification 
        ON responses(identification)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_responses_created_at 
        ON responses(created_at)
      `);

      console.log('Base de datos PostgreSQL inicializada correctamente');
    } catch (error) {
      console.error('Error inicializando base de datos PostgreSQL:', error);
      throw error;
    }
  }

  // Guardar respuesta del formulario (compatibilidad con el frontend)
  async saveResponse(responses) {
    try {
      // Procesar datos del formulario para convertirlos al formato esperado
      const data = {
        user_id: responses.userId || null,
        full_name: responses['q3'] || responses.full_name || '',
        identification: responses['q4'] || responses.identification || '',
        exit_date: responses['q5'] || responses.exit_date || '',
        tenure: responses['q6'] || '',
        area: responses['q7'] || responses.area || '',
        country: responses['q8'] || responses.country || '',
        last_leader: responses['q9'] || '',
        exit_reason_detail: '', // Campo q10 eliminado
        exit_reason_category: responses['q11'] || '',
        experience_rating: parseInt(responses['q12']) || null,
        would_recommend: responses['q13'] || '',
        what_enjoyed: responses['q14'] || '',
        what_to_improve: responses['q15'] || '',
        satisfaction_ratings: responses['q16'] || {},
        new_company_info: responses['q17'] || '',
        would_return: responses['q18'] || '',
        fechaInicio: responses.fechaInicio || null,
        cargo: responses.cargo || null,
        subArea: responses.subArea || null,
        lider: responses.lider || null,
        liderEntrenamiento: responses['liderEntrenamiento'] || responses.lider_entrenamiento || null,
        paisContratacion: responses.paisContratacion || null
      };

      // Usar el método addResponse existente
      const responseId = await this.addResponse(data);

      // Si hay un userId, actualizar el estado de respuesta del usuario
      if (responses.userId) {
        try {
          const user = await this.pool.query('SELECT identification FROM users WHERE id = $1', [responses.userId]);
          if (user.rows.length > 0) {
            await this.pool.query(
              'UPDATE users SET response_submitted = true, response_submitted_at = CURRENT_TIMESTAMP WHERE id = $1',
              [responses.userId]
            );
          }
        } catch (userUpdateError) {
          console.warn('No se pudo actualizar estado del usuario:', userUpdateError);
        }
      }

      console.log('Respuesta guardada con ID:', responseId);
      return responseId;

    } catch (error) {
      console.error('Error guardando respuesta:', error);
      throw error;
    }
  }

  // Agregar una respuesta
  async addResponse(data) {
    const query = `
      INSERT INTO responses (
        full_name, identification, exit_date, tenure, area, country,
        last_leader, exit_reason_category, exit_reason_detail,
        experience_rating, would_recommend, would_return,
        what_enjoyed, what_to_improve, satisfaction_ratings,
        new_company_info, fechaInicio, cargo, subArea, lider,
        liderEntrenamiento, paisContratacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id
    `;

    const values = [
      data.full_name,
      data.identification,
      data.exit_date,
      data.tenure,
      data.area,
      data.country,
      data.last_leader,
      data.exit_reason_category,
      data.exit_reason_detail,
      data.experience_rating,
      data.would_recommend,
      data.would_return,
      data.what_enjoyed,
      data.what_to_improve,
      JSON.stringify(data.satisfaction_ratings),
      JSON.stringify(data.new_company_info),
      data.fechaInicio || null,
      data.cargo || null,
      data.subArea || null,
      data.lider || null,
      data.liderEntrenamiento || null,
      data.paisContratacion || null
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      throw error;
    }
  }

  // Obtener todas las respuestas
  async getAllResponses() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM responses ORDER BY created_at DESC'
      );
      
      // Parsear los campos JSON de forma segura
      return result.rows.map(row => ({
        ...row,
        satisfaction_ratings: this.safeJsonParse(row.satisfaction_ratings),
        new_company_info: this.safeJsonParse(row.new_company_info)
      }));
    } catch (error) {
      console.error('Error obteniendo respuestas:', error);
      throw error;
    }
  }

  // Obtener una respuesta por ID
  async getResponse(id) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM responses WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        satisfaction_ratings: this.safeJsonParse(row.satisfaction_ratings),
        new_company_info: this.safeJsonParse(row.new_company_info)
      };
    } catch (error) {
      console.error('Error obteniendo respuesta:', error);
      throw error;
    }
  }

  // Actualizar análisis de una respuesta
  async updateAnalysis(id, analysis) {
    try {
      await this.pool.query(
        'UPDATE responses SET analysis = $1 WHERE id = $2',
        [analysis, id]
      );
      return true;
    } catch (error) {
      console.error('Error actualizando análisis:', error);
      throw error;
    }
  }

  // Eliminar una respuesta
  async deleteResponse(id) {
    try {
      const result = await this.pool.query(
        'DELETE FROM responses WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error eliminando respuesta:', error);
      throw error;
    }
  }

  // Verificar si existe una respuesta por identificación
  async checkDuplicate(identification) {
    try {
      const result = await this.pool.query(
        'SELECT id FROM responses WHERE identification = $1',
        [identification]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error verificando duplicado:', error);
      throw error;
    }
  }

  // Cerrar conexión
  async close() {
    await this.pool.end();
  }
}

module.exports = DatabasePostgres;