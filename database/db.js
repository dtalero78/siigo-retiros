const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'data', 'responses.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error abriendo base de datos:', err.message);
      } else {
        console.log('Conectado a la base de datos SQLite');
        this.init();
      }
    });
  }

  init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        full_name TEXT,
        identification TEXT,
        exit_date TEXT,
        tenure TEXT,
        area TEXT,
        country TEXT,
        last_leader TEXT,
        exit_reason_detail TEXT,
        exit_reason_category TEXT,
        experience_rating INTEGER,
        would_recommend TEXT,
        what_enjoyed TEXT,
        what_to_improve TEXT,
        satisfaction_ratings TEXT,
        new_company_info TEXT,
        would_return TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creando tabla:', err.message);
      } else {
        console.log('Tabla de respuestas inicializada');
        // Agregar columna user_id si no existe (para bases de datos existentes)
        this.db.run(`ALTER TABLE responses ADD COLUMN user_id INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error agregando columna user_id:', err.message);
          }
        });
      }
    });
  }

  async saveResponse(responses) {
    return new Promise((resolve, reject) => {
      // Mapear las respuestas a los campos de la base de datos
      const data = {
        user_id: responses.userId || null,
        full_name: responses['q3'] || responses.full_name || '',
        identification: responses['q4'] || responses.identification || '',
        exit_date: responses['q5'] || responses.exit_date || '',
        tenure: responses['q6'] || '',
        area: responses['q7'] || responses.area || '',
        country: responses['q8'] || responses.country || '',
        last_leader: responses['q9'] || '',
        exit_reason_detail: responses['q10'] || '',
        exit_reason_category: responses['q11'] || '',
        experience_rating: parseInt(responses['q12']) || null,
        would_recommend: responses['q13'] || '',
        what_enjoyed: responses['q14'] || '',
        what_to_improve: responses['q15'] || '',
        satisfaction_ratings: JSON.stringify(responses['q16'] || {}),
        new_company_info: responses['q17'] || '',
        would_return: responses['q18'] || ''
      };

      const sql = `
        INSERT INTO responses (
          user_id, full_name, identification, exit_date, tenure, area, country,
          last_leader, exit_reason_detail, exit_reason_category,
          experience_rating, would_recommend, what_enjoyed, what_to_improve,
          satisfaction_ratings, new_company_info, would_return
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.user_id, data.full_name, data.identification, data.exit_date, data.tenure,
        data.area, data.country, data.last_leader, data.exit_reason_detail,
        data.exit_reason_category, data.experience_rating, data.would_recommend,
        data.what_enjoyed, data.what_to_improve, data.satisfaction_ratings,
        data.new_company_info, data.would_return
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          console.error('Error guardando respuesta:', err.message);
          reject(err);
        } else {
          console.log('Respuesta guardada con ID:', this.lastID);
          resolve(this.lastID);
        }
      });
    });
  }

async getAllResponses() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          r.id,
          r.user_id,
          r.full_name,
          r.identification,
          r.exit_date,
          r.tenure,
          r.area,
          r.country,
          r.experience_rating,
          r.would_recommend,
          r.would_return,
          r.created_at
        FROM responses r
        ORDER BY r.created_at DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo respuestas:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getResponse(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM responses WHERE id = ?`;

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error obteniendo respuesta:', err.message);
          reject(err);
        } else {
          if (row && row.satisfaction_ratings) {
            try {
              row.satisfaction_ratings = JSON.parse(row.satisfaction_ratings);
            } catch (e) {
              console.error('Error parseando satisfaction_ratings:', e);
              row.satisfaction_ratings = {};
            }
          }
          resolve(row);
        }
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_responses,
          AVG(experience_rating) as avg_experience_rating,
          area,
          country,
          would_recommend,
          COUNT(*) as count
        FROM responses 
        GROUP BY area, country, would_recommend
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo estadísticas:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Nuevo método para verificar si un usuario ya tiene respuesta
  async hasUserResponse(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id FROM responses WHERE user_id = ? LIMIT 1`;
      
      this.db.get(sql, [userId], (err, row) => {
        if (err) {
          console.error('Error verificando respuesta de usuario:', err.message);
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error cerrando base de datos:', err.message);
      } else {
        console.log('Conexión a base de datos cerrada');
      }
    });
  }
}

module.exports = Database;