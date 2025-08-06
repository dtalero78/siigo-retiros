const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class UsersDatabase {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'data', 'users.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error abriendo base de datos de usuarios:', err.message);
      } else {
        console.log('Conectado a la base de datos de usuarios SQLite');
        this.init();
      }
    });
  }

  init() {
    this.db.serialize(() => {
      // 1) Crear tabla si no existe (sin fechaInicio ni cargo, que añadiremos luego)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          identification TEXT NOT NULL UNIQUE,
          phone TEXT,
          exit_date TEXT NOT NULL,
          area TEXT NOT NULL,
          country TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creando tabla users:', err.message);
        else console.log('Tabla users inicializada');
      });

      // 2) Verificar columnas existentes
      this.db.all(`PRAGMA table_info(users)`, (err, cols) => {
        if (err) {
          console.error('Error leyendo estructura de users:', err.message);
          return;
        }
        const existing = cols.map(c => c.name);
        // 3) Añadir fechaInicio si falta
        if (!existing.includes('fechaInicio')) {
          this.db.run(`ALTER TABLE users ADD COLUMN fechaInicio TEXT`, (err) => {
            if (err) console.error('Error agregando columna fechaInicio:', err.message);
            else console.log('Columna fechaInicio añadida a users');
          });
        }
        // 4) Añadir cargo si falta
        if (!existing.includes('cargo')) {
          this.db.run(`ALTER TABLE users ADD COLUMN cargo TEXT`, (err) => {
            if (err) console.error('Error agregando columna cargo:', err.message);
            else console.log('Columna cargo añadida a users');
          });
        }
        // 5) Añadir whatsapp_sent_at si falta
        if (!existing.includes('whatsapp_sent_at')) {
          this.db.run(`ALTER TABLE users ADD COLUMN whatsapp_sent_at DATETIME`, (err) => {
            if (err) console.error('Error agregando columna whatsapp_sent_at:', err.message);
            else console.log('Columna whatsapp_sent_at añadida a users');
          });
        }
        // 6) Añadir whatsapp_message_id si falta
        if (!existing.includes('whatsapp_message_id')) {
          this.db.run(`ALTER TABLE users ADD COLUMN whatsapp_message_id TEXT`, (err) => {
            if (err) console.error('Error agregando columna whatsapp_message_id:', err.message);
            else console.log('Columna whatsapp_message_id añadida a users');
          });
        }
      });
    });
  }

  async addUser(userData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (
          first_name, last_name, identification, phone, 
          exit_date, area, country, fechaInicio, cargo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        userData.first_name,
        userData.last_name,
        userData.identification,
        userData.phone || null,
        userData.exit_date,
        userData.area,
        userData.country,
        userData.fechaInicio || null,
        userData.cargo || null
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            reject(new Error('Ya existe un usuario con esa identificación'));
          } else {
            console.error('Error guardando usuario:', err.message);
            reject(err);
          }
        } else {
          console.log('Usuario guardado con ID:', this.lastID);
          resolve(this.lastID);
        }
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users 
        ORDER BY exit_date DESC, created_at DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo usuarios:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getUser(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ?`;

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error obteniendo usuario:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateUser(id, userData) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE users SET 
          first_name = ?, last_name = ?, identification = ?, 
          phone = ?, exit_date = ?, area = ?, country = ?,
          fechaInicio = ?, cargo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [
        userData.first_name,
        userData.last_name,
        userData.identification,
        userData.phone || null,
        userData.exit_date,
        userData.area,
        userData.country,
        userData.fechaInicio || null,
        userData.cargo || null,
        id
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            reject(new Error('Ya existe un usuario con esa identificación'));
          } else {
            console.error('Error actualizando usuario:', err.message);
            reject(err);
          }
        } else {
          console.log('Usuario actualizado, filas afectadas:', this.changes);
          resolve(this.changes);
        }
      });
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM users WHERE id = ?`;

      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error eliminando usuario:', err.message);
          reject(err);
        } else {
          console.log('Usuario eliminado, filas afectadas:', this.changes);
          resolve(this.changes);
        }
      });
    });
  }

  async bulkInsert(usersArray) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR IGNORE INTO users (
          first_name, last_name, identification, phone, 
          exit_date, area, country, fechaInicio, cargo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      let inserted = 0;
      let errors = [];

      const insertUser = (userData) => {
        const values = [
          userData.first_name,
          userData.last_name,
          userData.identification,
          userData.phone || null,
          userData.exit_date,
          userData.area,
          userData.country,
          userData.fechaInicio || null,
          userData.cargo || null
        ];

        this.db.run(sql, values, function(err) {
          if (err) {
            errors.push({ userData, error: err.message });
          } else if (this.changes > 0) {
            inserted++;
          }
        });
      };

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        usersArray.forEach(userData => {
          insertUser(userData);
        });

        this.db.run('COMMIT', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ inserted, errors, total: usersArray.length });
          }
        });
      });
    });
  }

  async getUserByIdentification(identification) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE identification = ?`;

      this.db.get(sql, [identification], (err, row) => {
        if (err) {
          console.error('Error obteniendo usuario por identificación:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_users,
          area,
          country,
          COUNT(*) as count
        FROM users 
        GROUP BY area, country
        UNION ALL
        SELECT 
          COUNT(*) as total_users,
          'TOTAL' as area,
          'TOTAL' as country,
          COUNT(*) as count
        FROM users
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo estadísticas de usuarios:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateWhatsAppStatus(userId, messageId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE users SET 
          whatsapp_sent_at = CURRENT_TIMESTAMP,
          whatsapp_message_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      this.db.run(sql, [messageId, userId], function(err) {
        if (err) {
          console.error('Error actualizando estado de WhatsApp:', err.message);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async getUsersWithWhatsAppStatus() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users 
        ORDER BY exit_date DESC, created_at DESC
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo usuarios con estado WhatsApp:', err.message);
          reject(err);
        } else {
          // Add has_response field set to 0 for now
          // This will be populated by the server logic using the responses database
          const usersWithStatus = rows.map(user => ({
            ...user,
            has_response: 0
          }));
          resolve(usersWithStatus);
        }
      });
    });
  }

  async getFilteredUsers(filter) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM users`;
      
      const conditions = [];
      const params = [];
      
      if (filter === 'whatsapp_sent') {
        conditions.push('whatsapp_sent_at IS NOT NULL');
      } else if (filter === 'whatsapp_not_sent') {
        conditions.push('whatsapp_sent_at IS NULL');
      }
      // Note: 'no_response' and 'has_response' filters will be handled by server logic
      // since they require cross-database queries
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      
      sql += ' ORDER BY exit_date DESC, created_at DESC';
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error obteniendo usuarios filtrados:', err.message);
          reject(err);
        } else {
          // Add has_response field set to 0 for now
          // This will be populated by the server logic using the responses database
          const usersWithStatus = rows.map(user => ({
            ...user,
            has_response: 0
          }));
          resolve(usersWithStatus);
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error cerrando base de datos de usuarios:', err.message);
      } else {
        console.log('Conexión a base de datos de usuarios cerrada');
      }
    });
  }
}

module.exports = UsersDatabase;