/**
 * Servicio unificado para envío de WhatsApp con botones
 * Usa la plantilla aprobada HX4c5c8ed40f20fa12d9b2c04df318ac70 (siigo_twilio_primer)
 */

const { sendTemplateWithUrlButton } = require('./twilio-template-button');

// Content SID de la plantilla aprobada con botón - PRIMER MENSAJE
const SURVEY_TEMPLATE_SID = process.env.TWILIO_TEMPLATE_BUTTON_SID || 'HX4c5c8ed40f20fa12d9b2c04df318ac70';

/**
 * Enviar invitación de encuesta con botón usando la plantilla aprobada
 * @param {Object} user - Debe contener: id, phone, first_name
 * @param {String} templateId - ID de la plantilla a usar (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendSurveyInvitationWithButton(user, templateId = null) {
  try {
    // Validaciones
    if (!user.id) {
      return {
        success: false,
        error: 'Usuario sin ID en la base de datos'
      };
    }

    if (!user.phone) {
      return {
        success: false,
        error: 'Usuario sin número de teléfono'
      };
    }

    // Preparar variables para la plantilla
    const templateVariables = {
      '1': user.first_name || 'Colaborador'  // {{1}} para el nombre en el mensaje
    };

    // ID del usuario para la URL del botón
    // Se agregará a: https://www.siigo.digital/?user=
    const buttonUrlVariable = user.id.toString();

    // Usar la plantilla especificada o la por defecto
    const templateToUse = templateId || SURVEY_TEMPLATE_SID;

    console.log(`📱 Enviando invitación con botón a ${user.first_name} (${user.phone})`);
    console.log(`🔗 URL del botón: https://www.siigo.digital/?user=${buttonUrlVariable}`);
    console.log(`📋 Plantilla: ${templateToUse}`);

    // Enviar usando la plantilla con botón
    const result = await sendTemplateWithUrlButton(
      user.phone,
      templateToUse,
      templateVariables,
      buttonUrlVariable
    );

    if (result.success) {
      console.log(`✅ Mensaje enviado a ${user.first_name} - ID: ${result.messageId}`);
    } else {
      console.error(`❌ Error enviando a ${user.first_name}: ${result.error}`);
    }

    return result;

  } catch (error) {
    console.error('Error en sendSurveyInvitationWithButton:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enviar invitaciones masivas con botón
 * @param {Array} users - Lista de usuarios
 * @param {Object} options - Opciones de envío (batch_size, delay, etc.)
 * @returns {Promise<Object>} Resumen del envío
 */
async function sendBulkSurveyInvitations(users, options = {}) {
  // Configuración de envío
  const BATCH_SIZE = options.batch_size || 20;
  const DELAY_BETWEEN_MESSAGES = options.message_delay || 3000; // 3 segundos
  const DELAY_BETWEEN_BATCHES = options.batch_delay || 30000; // 30 segundos
  const TEMPLATE_ID = options.templateId || SURVEY_TEMPLATE_SID; // Usar template seleccionado o el default

  const results = {
    total: users.length,
    sent: 0,
    errors: 0,
    skipped: 0,
    details: []
  };

  // Filtrar usuarios con teléfono
  const usersWithPhone = users.filter(u => u.phone && u.phone.trim());
  results.skipped = users.length - usersWithPhone.length;

  if (usersWithPhone.length === 0) {
    return {
      ...results,
      message: 'No hay usuarios con número de teléfono'
    };
  }

  console.log(`\n🚀 Iniciando envío masivo con botones`);
  console.log(`📊 Total a enviar: ${usersWithPhone.length}`);
  console.log(`📦 Tamaño de lote: ${BATCH_SIZE}`);
  console.log(`⏱️ Delay entre mensajes: ${DELAY_BETWEEN_MESSAGES/1000}s`);
  console.log(`⏱️ Delay entre lotes: ${DELAY_BETWEEN_BATCHES/1000}s`);
  console.log(`📋 Plantilla a usar: ${TEMPLATE_ID}\n`);

  // Dividir en lotes
  const batches = [];
  for (let i = 0; i < usersWithPhone.length; i += BATCH_SIZE) {
    batches.push(usersWithPhone.slice(i, i + BATCH_SIZE));
  }

  // Procesar cada lote
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n📦 Procesando lote ${batchIndex + 1}/${batches.length}`);

    for (let userIndex = 0; userIndex < batch.length; userIndex++) {
      const user = batch[userIndex];
      
      try {
        const result = await sendSurveyInvitationWithButton(user, TEMPLATE_ID);
        
        if (result.success) {
          results.sent++;
          results.details.push({
            user_id: user.id,
            name: user.first_name,
            status: 'sent',
            message_id: result.messageId
          });
        } else {
          results.errors++;
          results.details.push({
            user_id: user.id,
            name: user.first_name,
            status: 'error',
            error: result.error
          });
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          user_id: user.id,
          name: user.first_name,
          status: 'error',
          error: error.message
        });
      }

      // Delay entre mensajes (excepto el último del lote)
      if (userIndex < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
      }
    }

    // Delay entre lotes (excepto el último)
    if (batchIndex < batches.length - 1) {
      console.log(`⏳ Esperando ${DELAY_BETWEEN_BATCHES/1000}s antes del siguiente lote...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Resumen final
  console.log('\n📊 RESUMEN DEL ENVÍO:');
  console.log(`✅ Enviados: ${results.sent}`);
  console.log(`❌ Errores: ${results.errors}`);
  console.log(`⏭️ Omitidos (sin teléfono): ${results.skipped}`);
  console.log(`📊 Total procesados: ${results.total}\n`);

  return results;
}

/**
 * Validar si la plantilla está configurada
 */
function isTemplateConfigured() {
  return SURVEY_TEMPLATE_SID && SURVEY_TEMPLATE_SID !== 'HXxxxx';
}

/**
 * Obtener información de la configuración actual
 */
function getConfiguration() {
  return {
    templateSid: SURVEY_TEMPLATE_SID,
    isConfigured: isTemplateConfigured(),
    buttonUrl: 'https://www.siigo.digital/?user={userId}',
    provider: 'Twilio WhatsApp Business'
  };
}

module.exports = {
  sendSurveyInvitationWithButton,
  sendBulkSurveyInvitations,
  isTemplateConfigured,
  getConfiguration
};