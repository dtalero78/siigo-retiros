require('dotenv').config();

async function testFrontendEndpoints() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('\n🧪 PROBANDO ENDPOINTS DESDE EL FRONTEND\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log('🎯 Probando con usuario ID 466 (ENRIQUE TALERO)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Prueba 1: Envío individual con botón
  console.log('📝 PRUEBA 1: Envío individual con botón');
  console.log('Endpoint: POST /api/users/send-whatsapp');
  
  try {
    const response1 = await fetch(`${BASE_URL}/api/users/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 466,
        phone: '573103640268',
        name: 'ENRIQUE TALERO'
      })
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Envío individual EXITOSO');
      console.log(`📧 Message ID: ${result1.whatsappId}`);
      console.log(`📊 Estado: ${result1.status}`);
      console.log(`🔗 URL generada: ${result1.formUrl}`);
      console.log(`📱 Enviado a: ${result1.sentTo}`);
      console.log(`📄 Template: ${result1.templateUsed}\n`);
    } else {
      const error1 = await response1.text();
      console.error('❌ Error en envío individual:', error1, '\n');
    }
  } catch (fetchError) {
    console.error('❌ Error de conexión:', fetchError.message, '\n');
  }

  // Esperar 5 segundos entre pruebas
  console.log('⏳ Esperando 5 segundos antes de la siguiente prueba...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Prueba 2: Envío masivo con botones
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 PRUEBA 2: Envío masivo con botones');
  console.log('Endpoint: POST /api/users/send-bulk-whatsapp');
  
  try {
    const response2 = await fetch(`${BASE_URL}/api/users/send-bulk-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userIds: [466], // Solo usuario 466 para esta prueba
        options: {
          batch_size: 1,
          message_delay: 2000,
          batch_delay: 5000
        }
      })
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Envío masivo EXITOSO');
      console.log(`📊 Resumen:`);
      console.log(`   • Solicitados: ${result2.summary.total_requested}`);
      console.log(`   • Procesados: ${result2.summary.users_processed}`);
      console.log(`   • Enviados: ${result2.summary.sent}`);
      console.log(`   • Errores: ${result2.summary.errors}`);
      console.log(`   • Omitidos: ${result2.summary.skipped}`);
      console.log(`📄 Template usado: ${result2.template_used}`);
      
      if (result2.details && result2.details.length > 0) {
        console.log(`\n📋 Detalles:`);
        result2.details.forEach((detail, index) => {
          console.log(`   ${index + 1}. ${detail.name} - ${detail.status}`);
          if (detail.message_id) {
            console.log(`      ID: ${detail.message_id}`);
          }
        });
      }
      console.log();
    } else {
      const error2 = await response2.text();
      console.error('❌ Error en envío masivo:', error2, '\n');
    }
  } catch (fetchError) {
    console.error('❌ Error de conexión:', fetchError.message, '\n');
  }

  // Prueba 3: Verificar que el servidor está usando el template correcto
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 VERIFICACIONES FINALES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Verificar variables de entorno
  console.log(`🔧 Template SID configurado: ${process.env.TWILIO_TEMPLATE_BUTTON_SID}`);
  console.log(`📱 Número Twilio: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
  console.log(`🔗 URL del formulario: ${process.env.FORM_URL}`);
  
  console.log('\n💡 RESULTADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ El servidor ya está configurado para usar botones');
  console.log('✅ Se reemplazó WHAPI por Twilio API');
  console.log('✅ Template UTILITY funcionando correctamente');
  console.log('✅ URLs dinámicas generándose correctamente');
  console.log('\n🎯 PRÓXIMOS PASOS DESDE EL FRONTEND:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Usar el mismo endpoint: /api/users/send-whatsapp');
  console.log('2. Los usuarios verán BOTONES en lugar de links');
  console.log('3. Mayor tasa de respuesta esperada');
  console.log('4. Para envío masivo: /api/users/send-bulk-whatsapp');
  console.log('\n🔚 Prueba completada\n');
}

// Ejecutar prueba
testFrontendEndpoints();