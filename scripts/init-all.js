const fs = require('fs');
const path = require('path');

// Crear directorio data si no existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Directorio data creado');
}

console.log('Inicializando bases de datos...');

// Inicializar base de datos de respuestas
try {
    const Database = require('../database/db');
    const db = new Database();
    setTimeout(() => {
        console.log('Base de datos de respuestas inicializada');
        db.close();
        
        // Inicializar base de datos de usuarios
        try {
            const UsersDatabase = require('../database/users-db');
            const usersDb = new UsersDatabase();
            setTimeout(() => {
                console.log('Base de datos de usuarios inicializada');
                usersDb.close();
                console.log('Todas las bases de datos inicializadas correctamente');
                process.exit(0);
            }, 1000);
        } catch (error) {
            console.log('Error inicializando base de datos de usuarios:', error.message);
            console.log('Continuando sin base de datos de usuarios...');
            process.exit(0);
        }
    }, 1000);
} catch (error) {
    console.error('Error inicializando base de datos de respuestas:', error.message);
    process.exit(1);
}