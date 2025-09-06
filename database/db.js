// database/db.js

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
    // Usamos serialize para ejecutar estas operaciones en orden
    this.db.serialize(() => {
      // 1) Crear tabla si no existe (sin user_id ni analysis, que añadiremos luego)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creando tabla responses:', err.message);
        else console.log('Tabla responses inicializada');
      });

      // 2) Verificar columnas existentes
      this.db.all(`PRAGMA table_info(responses)`, (err, cols) => {
        if (err) {
          console.error('Error leyendo estructura de responses:', err.message);
          return;
        }
        const existing = cols.map(c => c.name);
        // 3) Añadir user_id si falta
        if (!existing.includes('user_id')) {
          this.db.run(`ALTER TABLE responses ADD COLUMN user_id INTEGER`, (err) => {
            if (err) console.error('Error agregando columna user_id:', err.message);
            else console.log('Columna user_id añadida a responses');
          });
        }
        // 4) Añadir analysis si falta
        if (!existing.includes('analysis')) {
          this.db.run(`ALTER TABLE responses ADD COLUMN analysis TEXT`, (err) => {
            if (err) console.error('Error agregando columna analysis:', err.message);
            else console.log('Columna analysis añadida a responses');
          });
        }
        // 5) Añadir lider_entrenamiento si falta
        if (!existing.includes('lider_entrenamiento')) {
          this.db.run(`ALTER TABLE responses ADD COLUMN lider_entrenamiento TEXT`, (err) => {
            if (err) console.error('Error agregando columna lider_entrenamiento:', err.message);
            else console.log('Columna lider_entrenamiento añadida a responses');
          });
        }
      });
    });
  }

  async saveResponse(responses) {
    return new Promise((resolve, reject) => {
      const data = {
        user_id: responses.userId || null,
        full_name: responses['q3'] || responses.full_name || '',
        identification: responses['q4'] || responses.identification || '',
        exit_date: responses['q5'] || responses.exit_date || '',
        tenure: responses['q6'] || '',
        area: responses['q7'] || responses.area || '',
        country: responses['q8'] || responses.country || '',
        last_leader: responses['q9'] || '',
        lider_entrenamiento: responses['liderEntrenamiento'] || '',
        exit_reason_detail: responses['q10'] || '', // Campo q10 para detalles del motivo de retiro
        exit_reason_category: responses['q11'] || '',
        experience_rating: parseInt(responses['q12']) || null,
        would_recommend: responses['q13'] || '',
        what_enjoyed: responses['q14'] || '',
        what_to_improve: responses['q15'] || '',
        satisfaction_ratings: JSON.stringify(responses['q16'] || {}),
        new_company_info: responses['q17'] || '',
        would_return: responses['q18'] || '',
        analysis: null
      };

      const sql = `
        INSERT INTO responses (
          user_id, full_name, identification, exit_date, tenure, area, country,
          last_leader, lider_entrenamiento, exit_reason_detail, exit_reason_category,
          experience_rating, would_recommend, what_enjoyed, what_to_improve,
          satisfaction_ratings, new_company_info, would_return, analysis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        data.user_id, data.full_name, data.identification, data.exit_date, data.tenure,
        data.area, data.country, data.last_leader, data.lider_entrenamiento, data.exit_reason_detail,
        data.exit_reason_category, data.experience_rating, data.would_recommend,
        data.what_enjoyed, data.what_to_improve, data.satisfaction_ratings,
        data.new_company_info, data.would_return, data.analysis
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
          id, user_id, full_name, identification, exit_date, tenure,
          area, country, experience_rating, would_recommend,
          would_return, created_at, analysis
        FROM responses
        ORDER BY created_at DESC
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
            } catch {
              row.satisfaction_ratings = {};
            }
          }
          resolve(row);
        }
      });
    });
  }

  async updateAnalysis(id, analysisText) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE responses SET analysis = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      this.db.run(sql, [analysisText, id], function(err) {
        if (err) {
          console.error('Error guardando analysis:', err.message);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_responses,
          AVG(experience_rating) as avg_experience_rating
        FROM responses
      `;
      this.db.get(sql, [], (err, row) => {
        if (err) {
          console.error('Error obteniendo estadísticas:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateResponseAnalysis(id, analysis) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE responses
      SET analysis = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    this.db.run(sql, [analysis, id], function(err) {
      if (err) {
        console.error('Error guardando análisis:', err.message);
        return reject(err);
      }
      resolve();
    });
  });
}

  async hasUserResponse(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id FROM responses WHERE user_id = ? LIMIT 1`;
      this.db.get(sql, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }

  async deleteResponse(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM responses WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error eliminando respuesta:', err.message);
          reject(err);
        } else {
          console.log('Respuesta eliminada, filas afectadas:', this.changes);
          resolve(this.changes > 0);
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) console.error('Error cerrando base de datos:', err.message);
      else console.log('Conexión SQLite cerrada');
    });
  }
}



module.exports = Database;
