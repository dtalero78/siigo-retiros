// Script para probar el mapeo mejorado de respuestas
const ResponseMapper = require('./response-mapper');

// Datos de ejemplo del registro ID 196
const existingRecord = {
  id: 196,
  area: "Sales",
  all_responses: {
    "q1": "10",                                              // Experiencia general
    "q2": "Oportunidad de crecimiento y desarrollo profesional",
    "q3": "8",
    "q4": "a",
    "q5": "7",
    "q6": "6",                                               // Relación con líder
    "q22": "8",                                              // Recomendarías
    "q23": "a",                                              // Qué disfrutaste
    "q24": "d",                                              // Qué mejorar
    "q25": "Cambio en condiciones acordadas",               // Categoría motivo
    "q26": "s",                                              // Detalle motivo
    "area": "Sales",
    "userId": 561,
    "country": "Colombia",
    "exit_date": "2025-09-29T00:00:00.000Z",
    "full_name": "prueba2 talero",
    "identification": "799815851346",
    "liderEntrenamiento": "MARIA PAZ"
  }
};

console.log('=== PROBANDO MAPEO MEJORADO ===');
console.log('Área:', existingRecord.area);

// Probar el mapeo mejorado
const mappedData = ResponseMapper.mapResponses(existingRecord.all_responses, existingRecord.area);

console.log('\n=== DATOS MAPEADOS ===');
console.log('experience_rating:', mappedData.experience_rating);
console.log('exit_reason_category:', mappedData.exit_reason_category);
console.log('exit_reason_detail:', mappedData.exit_reason_detail);
console.log('would_recommend:', mappedData.would_recommend);
console.log('what_enjoyed:', mappedData.what_enjoyed);
console.log('what_to_improve:', mappedData.what_to_improve);
console.log('last_leader:', mappedData.last_leader);

console.log('\n=== MAPEO DE CAMPOS ===');
const mapping = ResponseMapper.getFieldMapping('Sales');
Object.keys(mapping).forEach(field => {
  if (mapping[field]) {
    console.log(`${field} -> ${mapping[field]} (${existingRecord.all_responses[mapping[field]]})`);
  }
});