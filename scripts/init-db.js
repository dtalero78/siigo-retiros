const fs = require('fs');
const path = require('path');
const Database = require('../database/db');

// Crear directorio de datos si no existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Directorio de datos creado');
}

// Inicializar base de datos
const db = new Database();

console.log('Base de datos inicializada correctamente');

// Cerrar conexión después de un momento
setTimeout(() => {
  db.close();
  process.exit(0);
}, 2000);