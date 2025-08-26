const fs = require('fs');
const path = require('path');

// Leer el archivo JSON con los usuarios afectados
const affectedUsers = require('./responders_to_apologize.json');

console.log(`\n📊 RESUMEN DE USUARIOS AFECTADOS`);
console.log(`================================`);
console.log(`Total de usuarios: ${affectedUsers.length}`);
console.log(`\nEstos usuarios respondieron la encuesta pero sus respuestas se perdieron.`);
console.log(`Se les envió un mensaje de disculpas el 22 de agosto de 2025.\n`);

// Crear CSV con los datos
const csvHeader = 'Identificación,Nombre,Apellido,Teléfono,Área,País,Fecha Retiro,Nombre Completo\n';
const csvRows = affectedUsers.map(user => {
  return `"${user.identificacion}","${user.nombre}","${user.apellido}","${user.telefono}","${user.area}","${user.pais}","${user.fecha_retiro}","${user.full_name}"`;
}).join('\n');

const csvContent = csvHeader + csvRows;

// Guardar como CSV
const outputPath = path.join(__dirname, 'usuarios_afectados_22ago2025.csv');
fs.writeFileSync(outputPath, csvContent, 'utf8');
console.log(`✅ Archivo CSV creado: ${outputPath}`);

// Crear resumen por área
const areaCount = {};
affectedUsers.forEach(user => {
  areaCount[user.area] = (areaCount[user.area] || 0) + 1;
});

console.log(`\n📈 DISTRIBUCIÓN POR ÁREA:`);
console.log(`------------------------`);
Object.entries(areaCount).sort((a, b) => b[1] - a[1]).forEach(([area, count]) => {
  console.log(`  ${area}: ${count} usuarios`);
});

// Crear resumen por país
const countryCount = {};
affectedUsers.forEach(user => {
  countryCount[user.pais] = (countryCount[user.pais] || 0) + 1;
});

console.log(`\n🌎 DISTRIBUCIÓN POR PAÍS:`);
console.log(`------------------------`);
Object.entries(countryCount).sort((a, b) => b[1] - a[1]).forEach(([country, count]) => {
  console.log(`  ${country}: ${count} usuarios`);
});

// Crear archivo de texto con la lista completa
const txtContent = `LISTA DE USUARIOS AFECTADOS - INCIDENTE 22 DE AGOSTO 2025
==========================================================

Estos ${affectedUsers.length} usuarios respondieron la encuesta de retiro pero sus respuestas se perdieron
debido a un error técnico. Se les envió un mensaje de disculpas pidiendo que vuelvan a completar
el formulario.

DETALLE DE USUARIOS:
-------------------
${affectedUsers.map((user, index) => {
  return `
${index + 1}. ${user.full_name}
   - Identificación: ${user.identificacion}
   - Teléfono: ${user.telefono}
   - Área: ${user.area}
   - País: ${user.pais}
   - Fecha de Retiro: ${user.fecha_retiro}`;
}).join('\n')}

RESUMEN:
--------
Total de usuarios afectados: ${affectedUsers.length}

Por Área:
${Object.entries(areaCount).sort((a, b) => b[1] - a[1]).map(([area, count]) => `  - ${area}: ${count}`).join('\n')}

Por País:
${Object.entries(countryCount).sort((a, b) => b[1] - a[1]).map(([country, count]) => `  - ${country}: ${count}`).join('\n')}

ACCIONES TOMADAS:
----------------
1. Se identificaron los usuarios que habían respondido pero perdieron sus datos
2. Se les envió mensaje de WhatsApp con disculpas y nuevo enlace personalizado
3. Se implementó sistema de respaldo para prevenir futuras pérdidas

Fecha del incidente: 22 de agosto de 2025
`;

const txtOutputPath = path.join(__dirname, 'usuarios_afectados_detalle.txt');
fs.writeFileSync(txtOutputPath, txtContent, 'utf8');
console.log(`✅ Archivo de texto creado: ${txtOutputPath}`);

console.log(`\n📋 LISTA DE IDENTIFICACIONES (para búsqueda rápida):`);
console.log(`----------------------------------------------------`);
console.log(affectedUsers.map(u => u.identificacion).join(', '));

console.log(`\n✅ Extracción completada. Se generaron 2 archivos:`);
console.log(`   1. usuarios_afectados_22ago2025.csv - Para Excel/Sheets`);
console.log(`   2. usuarios_afectados_detalle.txt - Reporte completo`);