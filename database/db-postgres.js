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
          would_recommend BOOLEAN,
          would_return BOOLEAN,
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
      
      // Parsear los campos JSON
      return result.rows.map(row => ({
        ...row,
        satisfaction_ratings: typeof row.satisfaction_ratings === 'string' 
          ? JSON.parse(row.satisfaction_ratings) 
          : row.satisfaction_ratings,
        new_company_info: typeof row.new_company_info === 'string' 
          ? JSON.parse(row.new_company_info) 
          : row.new_company_info
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
        satisfaction_ratings: typeof row.satisfaction_ratings === 'string' 
          ? JSON.parse(row.satisfaction_ratings) 
          : row.satisfaction_ratings,
        new_company_info: typeof row.new_company_info === 'string' 
          ? JSON.parse(row.new_company_info) 
          : row.new_company_info
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