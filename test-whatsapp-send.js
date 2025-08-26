// Script de prueba para envío de WhatsApp personalizado
const http = require('http');

async function testWhatsAppSend() {
  // Primero obtener un usuario
  const getUsers = () => {
    return new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/users', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const users = JSON.parse(data);
            resolve(users);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  };

  const sendWhatsApp = (userId, phone, message) => {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        userId: userId,
        phone: phone,
        message: message
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/send-custom-whatsapp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: result });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: data });
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  };

  try {
    console.log('🔍 Obteniendo usuarios...');
    const users = await getUsers();
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    // Probar con el primer usuario
    const testUser = users[0];
    console.log(`\n📝 Usuario de prueba: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Teléfono: ${testUser.phone}`);

    console.log('\n📨 Enviando mensaje de prueba...');
    const message = `Hola ${testUser.first_name}, este es un mensaje de prueba. 
Link: ${process.env.FORM_URL || 'http://localhost:3000'}?user=${testUser.id}`;

    const result = await sendWhatsApp(testUser.id, testUser.phone, message);
    
    console.log(`\n📊 Resultado:`);
    console.log(`   Código HTTP: ${result.statusCode}`);
    console.log(`   Respuesta:`, result.data);

    if (result.statusCode === 200) {
      console.log('✅ Mensaje enviado exitosamente!');
    } else {
      console.log('❌ Error al enviar el mensaje');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWhatsAppSend();