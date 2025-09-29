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
    const questions = getQuestionsByArea(area);
    const mapping = {};

    // Campos comunes que se encuentran en ambos formularios
    const commonFields = {
      'full_name': null,
      'identification': null,
      'exit_date': null,
      'tenure': null,
      'area': null,
      'country': null,
      'last_leader': null,
      'exit_reason_category': null,
      'exit_reason_detail': null,
      'experience_rating': null,
      'would_recommend': null,
      'would_return': null,
      'what_enjoyed': null,
      'what_to_improve': null,
      'satisfaction_ratings': null,
      'new_company_info': null
    };

    // Mapear preguntas según el contenido y tipo
    questions.forEach((q, index) => {
      const questionText = q.question.toLowerCase();
      const questionNumber = `q${index + 1}`;

      // Mapear según el contenido de la pregunta
      if (questionText.includes('nombre completo') || questionText.includes('full name')) {
        commonFields.full_name = questionNumber;
      } else if (questionText.includes('identificación') || questionText.includes('cédula') || questionText.includes('id')) {
        commonFields.identification = questionNumber;
      } else if (questionText.includes('fecha de retiro') || questionText.includes('exit date')) {
        commonFields.exit_date = questionNumber;
      } else if (questionText.includes('tiempo en siigo') || questionText.includes('tenure')) {
        commonFields.tenure = questionNumber;
      } else if (questionText.includes('área') && !questionText.includes('líder')) {
        commonFields.area = questionNumber;
      } else if (questionText.includes('país') || questionText.includes('country')) {
        commonFields.country = questionNumber;
      } else if (questionText.includes('líder') || questionText.includes('leader')) {
        commonFields.last_leader = questionNumber;
      } else if (questionText.includes('experiencia general') || questionText.includes('experience')) {
        commonFields.experience_rating = questionNumber;
      } else if (questionText.includes('recomendarías') || questionText.includes('recommend')) {
        commonFields.would_recommend = questionNumber;
      } else if (questionText.includes('regresarías') || questionText.includes('would return')) {
        commonFields.would_return = questionNumber;
      } else if (questionText.includes('qué fue lo que más disfrutaste') || questionText.includes('what enjoyed')) {
        commonFields.what_enjoyed = questionNumber;
      } else if (questionText.includes('qué crees que podríamos mejorar') || questionText.includes('what to improve')) {
        commonFields.what_to_improve = questionNumber;
      } else if (questionText.includes('selecciona la categoría') || questionText.includes('motivo principal')) {
        commonFields.exit_reason_category = questionNumber;
      } else if (q.type === 'textarea' && q.section && q.section.includes('Razones') && questionText.includes('¿por qué?')) {
        commonFields.exit_reason_detail = questionNumber;
      } else if (q.type === 'matrix' || (q.question.includes('califica') && q.type === 'scale')) {
        commonFields.satisfaction_ratings = questionNumber;
      } else if (questionText.includes('nueva empresa') || questionText.includes('new company')) {
        commonFields.new_company_info = questionNumber;
      }
    });

    return commonFields;
  }

  /**
   * Mapea las respuestas recibidas del frontend a formato de base de datos
   */
  static mapResponses(responses, area) {
    const mapping = this.getFieldMapping(area);
    const mappedData = {};

    // Datos básicos del usuario (pueden venir pre-rellenados)
    mappedData.user_id = responses.userId || null;
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