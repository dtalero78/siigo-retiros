const fs = require('fs');
const path = require('path');
const UsersDatabase = require('../database/users-db');

// Crear directorio data si no existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Directorio data creado');
}

// Inicializar base de datos de usuarios
console.log('Inicializando base de datos de usuarios...');

const usersDb = new UsersDatabase();

// Esperar un momento para que se inicialice completamente
setTimeout(() => {
    console.log('Base de datos de usuarios inicializada correctamente');
    usersDb.close();
    process.exit(0);
}, 1000);