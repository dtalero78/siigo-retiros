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
      if (err) {
        console.error('Error creando tabla de usuarios:', err.message);
      } else {
        console.log('Tabla de usuarios inicializada');
      }
    });
  }

  async addUser(userData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (
          first_name, last_name, identification, phone, 
          exit_date, area, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        userData.first_name,
        userData.last_name,
        userData.identification,
        userData.phone || null,
        userData.exit_date,
        userData.area,
        userData.country
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
          updated_at = CURRENT_TIMESTAMP
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
          exit_date, area, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
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
          userData.country
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