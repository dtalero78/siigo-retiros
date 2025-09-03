#!/usr/bin/env node

/**
 * Script de prueba para el tercer mensaje de WhatsApp
 * Template ID: HXbd68439f2a15a3a23fff482129f82b22
 */

require('dotenv').config();

const { sendSurveyInvitationWithButton } = require('./services/whatsapp-button-sender');

async function testThirdMessage() {
  console.log('\n===============================================');
  console.log('   PRUEBA DEL TERCER MENSAJE DE WHATSAPP');
  console.log('===============================================\n');
  
  // Usuario de prueba (modificar según necesidad)
  const testUser = {
    id: 999,
    first_name: 'Test',
    phone: process.env.TEST_PHONE || '+573000000000' // Cambiar a un número real para probar
  };

  const thirdTemplateId = 'HXbd68439f2a15a3a23fff482129f82b22';
  
  console.log('📋 Configuración de la prueba:');
  console.log(`   - Template ID: ${thirdTemplateId}`);
  console.log(`   - Usuario: ${testUser.first_name} (ID: ${testUser.id})`);
  console.log(`   - Teléfono: ${testUser.phone}`);
  console.log(`   - URL del botón: https://www.siigo.digital/?user=${testUser.id}\n`);
  
  if (testUser.phone === '+573000000000') {
    console.log('⚠️  ADVERTENCIA: Usando número de prueba. Para envío real, configura TEST_PHONE en .env');
    console.log('   o modifica el número directamente en este script.\n');
  }
  
  try {
    console.log('📤 Enviando tercer mensaje...\n');
    
    const result = await sendSurveyInvitationWithButton(testUser, thirdTemplateId);
    
    if (result.success) {
      console.log('✅ ÉXITO: Tercer mensaje enviado correctamente');
      console.log(`   - Message ID: ${result.messageId}`);
      console.log(`   - Estado: ${result.status || 'Enviado'}`);
      if (result.details) {
        console.log(`   - Detalles adicionales:`, result.details);
      }
    } else {
      console.log('❌ ERROR: No se pudo enviar el tercer mensaje');
      console.log(`   - Error: ${result.error}`);
      if (result.details) {
        console.log(`   - Detalles:`, result.details);
      }
    }
    
  } catch (error) {
    console.log('❌ ERROR INESPERADO:', error.message);
    console.log('   Stack trace:', error.stack);
  }
  
  console.log('\n===============================================');
  console.log('   FIN DE LA PRUEBA');
  console.log('===============================================\n');
}

// Ejecutar la prueba
testThirdMessage();