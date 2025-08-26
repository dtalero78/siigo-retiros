require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function checkConfig() {
  console.log('\n🔍 VERIFICACIÓN COMPLETA DE CONFIGURACIÓN TWILIO\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar cuenta
    console.log('\n1️⃣ INFORMACIÓN DE LA CUENTA:');
    const account = await client.api.accounts(accountSid).fetch();
    console.log('   Nombre:', account.friendlyName);
    console.log('   Estado:', account.status);
    console.log('   Tipo:', account.type);
    
    // 2. Verificar senders de WhatsApp
    console.log('\n2️⃣ WHATSAPP SENDERS:');
    const senders = await client.messaging.v1.services.list({ limit: 20 });
    
    for (const service of senders) {
      console.log('\n   Servicio:', service.friendlyName);
      console.log('   SID:', service.sid);
      
      // Intentar obtener más detalles del servicio
      try {
        const phoneNumbers = await client.messaging.v1
          .services(service.sid)
          .phoneNumbers
          .list({ limit: 20 });
          
        for (const phone of phoneNumbers) {
          console.log('   Número:', phone.phoneNumber);
        }
      } catch (e) {
        // Silently continue
      }
    }
    
    // 3. Verificar plantillas/contenido
    console.log('\n3️⃣ PLANTILLAS DISPONIBLES:');
    try {
      const contents = await client.content.v2.contents.list({ limit: 10 });
      
      for (const content of contents) {
        console.log('\n   Plantilla:', content.friendlyName || 'Sin nombre');
        console.log('   SID:', content.sid);
        console.log('   Idioma:', content.language);
        console.log('   Estado:', content.approvalStatus || 'N/A');
        
        // Si es nuestra plantilla, mostrar más detalles
        if (content.sid === 'HX328f1e3d4eb8664aa2674b3edec72729') {
          console.log('   ⭐ ESTA ES TU PLANTILLA DE ENCUESTA');
          console.log('   Variables:', JSON.stringify(content.variables));
        }
      }
    } catch (e) {
      console.log('   Error obteniendo plantillas:', e.message);
    }
    
    // 4. Verificar el estado del número específico
    console.log('\n4️⃣ DIAGNÓSTICO DEL PROBLEMA:');
    console.log('\n   Error 63049 generalmente significa:');
    console.log('   • El número está en sandbox y requiere opt-in');
    console.log('   • La plantilla no está vinculada al número correcto');
    console.log('   • Falta configuración en el WhatsApp Business Profile');
    
    console.log('\n5️⃣ SOLUCIÓN RECOMENDADA:');
    console.log('\n   Opción A: Configurar Messaging Service');
    console.log('   1. Ve a Twilio Console > Messaging > Services');
    console.log('   2. Crea un nuevo Messaging Service');
    console.log('   3. Agrega tu número de WhatsApp al servicio');
    console.log('   4. Usa el Messaging Service SID en lugar del número directo');
    
    console.log('\n   Opción B: Verificar en Meta Business Manager');
    console.log('   1. Confirma que el número está totalmente aprobado');
    console.log('   2. Verifica que las plantillas estén asociadas al número');
    console.log('   3. Revisa que no haya restricciones de región');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
}

checkConfig().catch(console.error);