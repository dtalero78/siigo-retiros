require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ContentSids encontrados en el código
const CONTENT_SIDS = [
  'HXd85118b65ad3e326a4b6a4531b578bf2', // whatsapp-button-sender.js
  'HX221248573e750c16de8699170feae6c8', // Template segundo mensaje
  'HXbd68439f2a15a3a23fff482129f82b22', // Template tercer mensaje
  'HXabd9517719a844afc93a367ef4e23927', // send-utility-template-466.js
  'HX328f1e3d4eb8664aa2674b3edec72729', // test-with-messaging-service.js
  'HXf052bc7cb7a44ab25e4df78eba76de9f'  // send-survey-invitation.js
];

async function checkContentTemplates() {
  try {
    console.log('🔍 Verificando ContentSids en Twilio...\n');
    
    // Obtener todos los contenidos
    const contents = await client.content.contents.list({ limit: 100 });
    
    console.log(`Total de contenidos en Twilio: ${contents.length}\n`);
    
    // Verificar cada ContentSid
    for (const sid of CONTENT_SIDS) {
      console.log(`\n🔍 Verificando: ${sid}`);
      
      try {
        const content = await client.content.contents(sid).fetch();
        
        console.log(`   ✅ VÁLIDO - ${content.friendlyName}`);
        console.log(`   📋 Tipo: ${content.types ? Object.keys(content.types).join(', ') : 'No definido'}`);
        console.log(`   📅 Fecha creación: ${content.dateCreated}`);
        console.log(`   📅 Última actualización: ${content.dateUpdated}`);
        
        // Verificar aprobación para WhatsApp
        if (content.approvalRequests) {
          const whatsappApproval = content.approvalRequests.find(req => 
            req.name === 'whatsapp' || req.channel === 'whatsapp'
          );
          
          if (whatsappApproval) {
            console.log(`   📱 Estado WhatsApp: ${whatsappApproval.status}`);
          } else {
            console.log(`   📱 Estado WhatsApp: No encontrado`);
          }
        }
        
      } catch (error) {
        if (error.code === 20404) {
          console.log(`   ❌ NO ENCONTRADO - El ContentSid no existe`);
        } else {
          console.log(`   ⚠️ ERROR: ${error.message}`);
        }
      }
    }
    
    // Mostrar contenidos válidos para WhatsApp
    console.log('\n' + '='.repeat(80));
    console.log('📱 CONTENIDOS APROBADOS PARA WHATSAPP:');
    console.log('='.repeat(80));
    
    const approvedContents = [];
    
    for (const content of contents) {
      if (content.approvalRequests) {
        const whatsappApproval = content.approvalRequests.find(req => 
          req.name === 'whatsapp' || req.channel === 'whatsapp'
        );
        
        if (whatsappApproval && whatsappApproval.status === 'approved') {
          approvedContents.push({
            sid: content.sid,
            name: content.friendlyName,
            language: content.language,
            category: whatsappApproval.category || 'No definida'
          });
        }
      }
    }
    
    if (approvedContents.length === 0) {
      console.log('❌ No hay contenidos aprobados para WhatsApp');
    } else {
      console.log(`✅ Encontrados ${approvedContents.length} contenido(s) aprobado(s):`);
      approvedContents.forEach((content, index) => {
        console.log(`\n${index + 1}. ${content.sid}`);
        console.log(`   📝 Nombre: ${content.name}`);
        console.log(`   🌐 Idioma: ${content.language}`);
        console.log(`   📂 Categoría: ${content.category}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkContentTemplates();