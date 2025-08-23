// Configuración de base de datos - Soporta SQLite y PostgreSQL
require('dotenv').config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite'; // 'sqlite' o 'postgres'

function getDatabase() {
  if (DATABASE_TYPE === 'postgres') {
    console.log('Usando PostgreSQL como base de datos');
    const DatabasePostgres = require('./db-postgres');
    return new DatabasePostgres();
  } else {
    console.log('Usando SQLite como base de datos');
    const Database = require('./db');
    return new Database();
  }
}

function getUsersDatabase() {
  if (DATABASE_TYPE === 'postgres') {
    console.log('Usando PostgreSQL para usuarios');
    const UsersDbPostgres = require('./users-db-postgres');
    return new UsersDbPostgres();
  } else {
    console.log('Usando SQLite para usuarios');
    const UsersDb = require('./users-db');
    return new UsersDb();
  }
}

module.exports = {
  getDatabase,
  getUsersDatabase,
  DATABASE_TYPE
};