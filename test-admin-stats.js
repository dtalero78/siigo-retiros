const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    // Buscar los valores en el HTML
    const recommendMatch = data.match(/id="recommendPercent">([^<]+)</);
    const returnMatch = data.match(/id="returnPercent">([^<]+)</);
    
    console.log('Valores en el panel de admin:');
    console.log('% Recomiendan:', recommendMatch ? recommendMatch[1] : 'No encontrado');
    console.log('% Regresarían:', returnMatch ? returnMatch[1] : 'No encontrado');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();