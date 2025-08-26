#!/usr/bin/env node
// Script de restauración para backup del 2025-08-23
// Uso: node restore.js

const fs = require('fs');
const path = require('path');

async function restore() {
  console.log('Restaurando backup del 2025-08-23...');
  
  try {
    const responses = JSON.parse(fs.readFileSync(path.join(__dirname, 'responses.json'), 'utf8'));
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    
    console.log('Datos cargados:');
    console.log('- Respuestas:', responses.length);
    console.log('- Usuarios:', users.length);
    
    // Aquí agregarías el código para insertar en la base de datos
    console.log('\n⚠️  Para completar la restauración, ejecuta:');
    console.log('node scripts/restore-from-backup.js ' + path.basename(__dirname));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

restore();
