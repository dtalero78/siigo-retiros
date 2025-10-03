// Sistema de mapeo dinámico para respuestas de formularios según área
const { getQuestionsByArea } = require('./questions-config');

/**
 * Mapea las respuestas dinámicas a campos de base de datos según el área del usuario
 */
class ResponseMapper {

  /**
   * Obtiene el mapeo de campos según el área
   */
  static getFieldMapping(area) {
    // Mapeos específicos por área basados en la estructura real de preguntas
    if (area === 'Sales') {
      return {
        'experience_rating': 'q1',        // ¿Cómo fue tu experiencia general en Siigo?
        'exit_reason_category': 'q25',    // Selecciona la categoría que mejor representa...
        'exit_reason_detail': 'q26',      // ¿Por qué? (después de categoría)
        'would_recommend': 'q22',         // Recomendarías trabajar en Siigo
        'what_enjoyed': 'q23',            // ¿Qué fue lo que más disfrutaste...
        'what_to_improve': 'q24',         // ¿Qué crees que podríamos mejorar...
        'last_leader': 'q6',              // Relación con líder (aunque es escala, mapeamos)
        'full_name': null,                // Viene pre-rellenado del usuario
        'identification': null,           // Viene pre-rellenado del usuario
        'exit_date': null,               // Viene pre-rellenado del usuario
        'tenure': null,                  // No hay pregunta específica para esto en Sales
        'area': null,                    // Viene pre-rellenado del usuario
        'country': null,                 // Viene pre-rellenado del usuario
        'would_return': null,            // No hay pregunta específica para esto en Sales
        'satisfaction_ratings': null,     // No hay matriz en formulario Sales
        'new_company_info': null         // No hay pregunta específica para esto en Sales
      };
    } else {
      // Mapeo para formularios General (17 preguntas)
      return {
        'experience_rating': 'q1',        // Primera pregunta suele ser experiencia general
        'exit_reason_category': 'q15',    // Típicamente cerca del final
        'exit_reason_detail': 'q16',      // Después de categoría
        'would_recommend': 'q12',         // Pregunta de recomendación
        'what_enjoyed': 'q13',            // Qué disfrutó
        'what_to_improve': 'q14',         // Qué mejorar
        'satisfaction_ratings': 'q17',    // Matriz de satisfacción (última pregunta)
        'full_name': null,
        'identification': null,
        'exit_date': null,
        'tenure': null,
        'area': null,
        'country': null,
        'last_leader': null,
        'would_return': null,
        'new_company_info': null
      };
    }
  }

  /**
   * Mapea las respuestas recibidas del frontend a formato de base de datos
   */
  static mapResponses(responses, area) {
    const mapping = this.getFieldMapping(area);
    const mappedData = {};

    // Datos básicos del usuario (pueden venir pre-rellenados)
    // Nota: user_id no existe en el esquema de base de datos, se omite
    mappedData.area = responses.area || area;

    // Mapear campos usando el mapeo dinámico
    Object.keys(mapping).forEach(field => {
      const questionKey = mapping[field];
      if (questionKey && responses[questionKey] !== undefined) {
        let value = responses[questionKey];

        // Procesamiento especial según el tipo de campo
        switch (field) {
          case 'experience_rating':
            mappedData[field] = value ? parseInt(value) : null;
            break;
          case 'satisfaction_ratings':
            mappedData[field] = typeof value === 'object' ? value : {};
            break;
          case 'exit_date':
            mappedData[field] = value ? new Date(value) : null;
            break;
          default:
            mappedData[field] = value || '';
        }
      } else {
        // Si no hay mapeo, usar valores por defecto o datos pre-rellenados
        if (responses[field] !== undefined) {
          mappedData[field] = responses[field];
        }
      }
    });

    // Campos adicionales que pueden venir del usuario pre-registrado
    const additionalFields = ['fechaInicio', 'cargo', 'subArea', 'lider', 'liderEntrenamiento', 'paisContratacion'];
    additionalFields.forEach(field => {
      if (responses[field] !== undefined) {
        mappedData[field] = responses[field];
      }
    });

    // Guardar también todas las respuestas originales en un campo JSON para referencia completa
    mappedData.all_responses = responses;

    return mappedData;
  }

  /**
   * Obtiene las respuestas completas desde el campo JSON para mostrar en el admin
   */
  static getCompleteResponses(dbRecord, area) {
    if (dbRecord.all_responses) {
      return dbRecord.all_responses;
    }

    // Si no hay respuestas completas, reconstruir desde campos mapeados (backward compatibility)
    const questions = getQuestionsByArea(area);
    const mapping = this.getFieldMapping(area);
    const reconstructed = {};

    Object.keys(mapping).forEach(field => {
      const questionKey = mapping[field];
      if (questionKey && dbRecord[field] !== undefined) {
        reconstructed[questionKey] = dbRecord[field];
      }
    });

    return reconstructed;
  }

  /**
   * Genera el mapeo de exportación CSV dinámico según el área
   */
  static getCsvMapping(area) {
    const questions = getQuestionsByArea(area);
    const csvHeaders = [
      'ID',
      'Nombre Completo',
      'Identificación',
      'Área',
      'País',
      'Fecha de Retiro',
      'Tiempo en Siigo',
      'Último Líder',
      'Fecha de Respuesta'
    ];

    // Agregar todas las preguntas como columnas
    questions.forEach((q, index) => {
      csvHeaders.push(`P${index + 1}: ${q.question}`);
    });

    return csvHeaders;
  }

  /**
   * Convierte un registro de BD a fila CSV con mapeo dinámico
   */
  static toCsvRow(dbRecord, area) {
    const questions = getQuestionsByArea(area);
    const responses = this.getCompleteResponses(dbRecord, area);

    const row = [
      dbRecord.id,
      dbRecord.full_name || '',
      dbRecord.identification || '',
      dbRecord.area || '',
      dbRecord.country || '',
      dbRecord.exit_date ? new Date(dbRecord.exit_date).toLocaleDateString('es-ES') : '',
      dbRecord.tenure || '',
      dbRecord.last_leader || '',
      dbRecord.created_at ? new Date(dbRecord.created_at).toLocaleDateString('es-ES') : ''
    ];

    // Agregar respuestas a cada pregunta
    questions.forEach((q, index) => {
      const questionKey = `q${index + 1}`;
      let value = responses[questionKey] || '';

      // Formatear según el tipo de pregunta
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }

      row.push(value);
    });

    return row;
  }
}

module.exports = ResponseMapper;