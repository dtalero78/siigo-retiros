const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const Database = require('./database/db');
const UsersDatabase = require('./database/users-db');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Configurar multer para subida de archivos
const upload = multer({
  dest: path.join(__dirname, 'temp'), // Usar ruta relativa
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  ...(process.env.NODE_ENV === 'development' ? {
    skip: () => false,
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  } : {
    trustProxy: true
  })
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar bases de datos
const db = new Database();
const usersDb = new UsersDatabase();

// Datos de las preguntas (extraídos del Excel)
const questions = [
  {
    number: 3,
    question: "¿Cuál es tu nombre completo?",
    type: "text",
    required: true
  },
  {
    number: 4,
    question: "¿Cuál es tu número de Identificación?",
    type: "text",
    required: true
  },
  {
    number: 5,
    question: "Confirma tu fecha de retiro",
    type: "date",
    required: true
  },
  {
    number: 6,
    question: "¿Cuál fue el tiempo total que duraste en Siigo?",
    type: "radio",
    required: true,
    options: [
      "Menos de 2 meses",
      "Menos de 6 meses",
      "6 meses a 1 año",
      "1-2 años",
      "2-5 años",
      "Más de 5 años"
    ]
  },
  {
    number: 7,
    question: "¿En cuál área estabas?",
    type: "radio",
    required: true,
    options: [
      "Cultura",
      "Customer Success",
      "Finance & Administration",
      "Fundación Siigo",
      "Marketing",
      "People Ops",
      "Product",
      "Sales",
      "Strategy",
      "Tech"
    ]
  },
  {
    number: 8,
    question: "¿En cuál país estabas trabajando?",
    type: "radio",
    required: true,
    options: [
      "Colombia",
      "Ecuador",
      "Uruguay",
      "México",
      "Perú"
    ]
  },
  {
    number: 9,
    question: "¿Cuál el es nombre del último líder que tuviste en Siigo?",
    type: "text",
    required: true
  },
  {
    number: 10,
    question: "¿Por favor confirma cuál fue el motivo principal que te llevó a tomar la decisión de retirarte de Siigo?",
    type: "textarea",
    required: true
  },
  {
    number: 11,
    question: "Selecciona la categoría que mejor representa el motivo principal de tu decisión de retirarte:",
    type: "radio",
    required: true,
    options: [
      "Cultura organizacional (falta de alineación con el proposito y los valores de Siigo)",
      "Decisión relacionada con un nuevo proyecto, emprendimiento, estudios u objetivos personales",
      "Dificultad para equilibrar las responsabilidades laborales con la vida personal o familiar",
      "Decisión tomada para anticipar una posible terminación del contrato en medio de un proceso o evaluación laboral.",
      "Dificultades en la relación o alineación con el estilo de liderazgo",
      "Falta de claridad, apoyo o efectividad en el proceso de formación y desarrollo",
      "Falta de oportunidades de desarrollo, promoción o nuevos desafíos profesionales",
      "Insatisfacción con los Beneficios emocionales o no económicos",
      "Mejor oferta económica",
      "Modificación de condiciones laborales inicialmente acordadas",
      "Percepción de carga laboral alta o estrés que afectó el equilibrio y la motivación personal",
      "Percepción de inequidad o descontento con metas, comisiones (si aplica)"
    ]
  },
  {
    number: 12,
    question: "En una escala del 1 al 10, ¿Qué tan buena fue tu experiencia laboral en Siigo?",
    type: "scale",
    required: true,
    min: 1,
    max: 10,
    labels: ["Nada satisfecho", "Muy satisfecho"]
  },
  {
    number: 13,
    question: "¿Recomendarías trabajar en Siigo a un amigo o familiar?",
    type: "radio",
    required: true,
    options: ["SÍ", "NO"]
  },
  {
    number: 14,
    question: "¿Qué fue lo que más disfrutaste de trabajar en Siigo?",
    type: "textarea",
    required: true
  },
  {
    number: 15,
    question: "¿Qué crees que podríamos mejorar como organización?",
    type: "textarea",
    required: true
  },
  {
    number: 16,
    question: "Durante tu experiencia en Siigo, ¿cómo calificarías tu nivel de satisfacción con los siguientes aspectos?",
    type: "matrix",
    required: true,
    items: [
      "Liderazgo de tu líder directo",
      "Ambiente laboral en tu equipo",
      "Cultura organizacional y valores",
      "Beneficios emocionales o no económicos",
      "Modalidad de trabajo remoto",
      "Proceso de formación y entrenamiento"
    ],
    scale: [1, 2, 3, 4, 5],
    scaleLabels: ["Muy insatisfecho", "Insatisfecho", "Neutral", "Satisfecho", "Muy satisfecho"]
  },
  {
    number: 17,
    question: "¿Puedes contarme a qué empresa te cambiaste y qué te gustó de su propuesta?",
    type: "textarea",
    required: false
  },
  {
    number: 18,
    question: "¿Estarías abierto(a) a regresar a Siigo en el futuro si se presenta una oportunidad que se alinee con tus intereses?",
    type: "radio",
    required: true,
    options: ["SÍ", "NO"]
  }
];

// ================================
// RUTAS API PARA RESPUESTAS
// ================================ 

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// ================================
// NUEVA RUTA: Obtener usuario para formulario
// ================================
app.get('/api/user-form/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersDb.getUser(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Devolver solo los datos necesarios para el formulario
    const userData = {
      id: user.id,
      full_name: `${user.first_name} ${user.last_name}`,
      identification: user.identification,
      exit_date: user.exit_date,
      area: user.area,
      country: user.country,
      phone: user.phone
    };

    res.json(userData);
  } catch (error) {
    console.error('Error obteniendo usuario para formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/responses', async (req, res) => {
  try {
    const { responses, userId } = req.body;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Respuestas inválidas' });
    }

    // Si hay userId, verificar que el usuario existe
    if (userId) {
      const user = await usersDb.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Agregar el userId a las respuestas para relacionarlas
      responses.userId = userId;
    }

    const responseId = await db.saveResponse(responses);

    res.json({
      success: true,
      message: 'Respuestas guardadas correctamente',
      id: responseId
    });
  } catch (error) {
    console.error('Error guardando respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/responses', async (req, res) => {
  try {
    const responses = await db.getAllResponses();
    res.json(responses);
  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await db.getResponse(id);

    if (!response) {
      return res.status(404).json({ error: 'Respuesta no encontrada' });
    }

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS API PARA USUARIOS
// ================================

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await usersDb.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un usuario por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersDb.getUser(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo usuario
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;

    // Validar campos requeridos
    const requiredFields = ['first_name', 'last_name', 'identification', 'exit_date', 'area', 'country'];
    for (const field of requiredFields) {
      if (!userData[field] || userData[field].trim() === '') {
        return res.status(400).json({ error: `El campo ${field} es requerido` });
      }
    }

    // Validar área
    const validAreas = ["Cultura", "Customer Success", "Finance & Administration", "Fundación Siigo", "Marketing", "People Ops", "Product", "Sales", "Strategy", "Tech"];
    if (!validAreas.includes(userData.area)) {
      return res.status(400).json({ error: 'Área inválida' });
    }

    // Validar país
    const validCountries = ["Colombia", "Ecuador", "Uruguay", "México", "Perú"];
    if (!validCountries.includes(userData.country)) {
      return res.status(400).json({ error: 'País inválido' });
    }

    const userId = await usersDb.addUser(userData);

    res.json({
      success: true,
      message: 'Usuario creado exitosamente',
      id: userId
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    if (error.message.includes('Ya existe un usuario')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Actualizar usuario
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    // Validar campos requeridos
    const requiredFields = ['first_name', 'last_name', 'identification', 'exit_date', 'area', 'country'];
    for (const field of requiredFields) {
      if (!userData[field] || userData[field].trim() === '') {
        return res.status(400).json({ error: `El campo ${field} es requerido` });
      }
    }

    const changesCount = await usersDb.updateUser(id, userData);

    if (changesCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    if (error.message.includes('Ya existe un usuario')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Eliminar usuario
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changesCount = await usersDb.deleteUser(id);

    if (changesCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cargar usuarios desde CSV
app.post('/api/users/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    const fs = require('fs');
    const csvContent = fs.readFileSync(req.file.path, 'utf8');

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    // Parsear CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío' });
    }

    const users = [];
    const validAreas = ["Cultura", "Customer Success", "Finance & Administration", "Fundación Siigo", "Marketing", "People Ops", "Product", "Sales", "Strategy", "Tech"];
    const validCountries = ["Colombia", "Ecuador", "Uruguay", "México", "Perú"];

    // Procesar cada línea (omitir la primera si es header)
    const dataLines = lines[0].toLowerCase().includes('nombre') ? lines.slice(1) : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));

      if (columns.length < 7) {
        continue; // Saltar líneas incompletas
      }

      const [firstName, lastName, identification, phone, exitDate, area, country] = columns;

      // Validar datos
      if (!firstName || !lastName || !identification || !exitDate || !area || !country) {
        continue;
      }

      if (!validAreas.includes(area) || !validCountries.includes(country)) {
        continue;
      }

      users.push({
        first_name: firstName,
        last_name: lastName,
        identification: identification,
        phone: phone || null,
        exit_date: exitDate,
        area: area,
        country: country
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No se encontraron usuarios válidos en el archivo CSV' });
    }

    // Insertar en lote
    const result = await usersDb.bulkInsert(users);

    res.json({
      success: true,
      message: 'Archivo CSV procesado exitosamente',
      inserted: result.inserted,
      total: result.total,
      errors: result.errors
    });

  } catch (error) {
    console.error('Error procesando CSV:', error);
    res.status(500).json({ error: 'Error procesando el archivo CSV' });
  }
});

// Obtener estadísticas de usuarios
app.get('/api/users/stats', async (req, res) => {
  try {
    const stats = await usersDb.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Enviar mensaje de WhatsApp a usuario
app.post('/api/users/send-whatsapp', async (req, res) => {
  try {
    const { userId, phone, name } = req.body;
    
    if (!userId || !phone || !name) {
      return res.status(400).json({ error: 'Datos incompletos para enviar WhatsApp' });
    }

    // Verificar que el usuario existe
    const user = await usersDb.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    // Formatear número para WhatsApp
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('57') && cleanPhone.length === 10) {
      whatsappNumber = '57' + cleanPhone; // Código de Colombia
    }

    // URL del formulario con ID del usuario
    const baseUrl = process.env.FORM_URL || 'https://www.siigo.digital';
    const formUrl = `${baseUrl}/?user=${userId}`;
    
    // Mensaje personalizado con la URL que incluye el ID
    const message = `Hola ${name.split(' ')[0]}. Antes de despedirnos queremos pedirte que realices la siguiente encuesta: ${formUrl}`;

    // Configuración de Whapi
    const whapiToken = process.env.WHAPI_TOKEN;
    if (!whapiToken) {
      return res.status(500).json({ error: 'Token de Whapi no configurado' });
    }

    // Enviar mensaje usando Whapi
    const whapiResponse = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: whatsappNumber,
        body: message
      })
    });

    if (whapiResponse.ok) {
      const result = await whapiResponse.json();
      
      // Log del envío exitoso
      console.log(`WhatsApp enviado a ${name} (${phone}): ${formUrl}`);
      
      res.json({ 
        success: true, 
        message: 'Mensaje de WhatsApp enviado exitosamente',
        whatsappId: result.id,
        formUrl: formUrl
      });
    } else {
      const error = await whapiResponse.text();
      console.error('Error de Whapi:', error);
      res.status(500).json({ error: 'Error al enviar mensaje a través de Whapi' });
    }

  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE PÁGINAS
// ================================

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para el panel de usuarios
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Visita: http://localhost:${PORT}`);
  console.log(`Panel admin: http://localhost:${PORT}/admin`);
  console.log(`Gestión usuarios: http://localhost:${PORT}/users`);
});

module.exports = app;