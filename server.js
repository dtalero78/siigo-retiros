require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
// Usar configuración flexible de base de datos
const { getDatabase, getUsersDatabase } = require('./database/config');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


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
// Inicializar bases de datos usando la configuración flexible
const db = getDatabase();
const usersDb = getUsersDatabase();

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
      phone: user.phone,
      fechaInicio: user.fechaInicio,
      cargo: user.cargo
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

// Eliminar una respuesta específica
app.delete('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la respuesta existe
    const response = await db.getResponse(id);
    if (!response) {
      return res.status(404).json({ error: 'Respuesta no encontrada' });
    }
    
    // Eliminar la respuesta
    const result = await db.deleteResponse(id);
    
    if (result) {
      console.log(`Respuesta ${id} eliminada exitosamente`);
      res.json({ 
        success: true, 
        message: 'Respuesta eliminada exitosamente' 
      });
    } else {
      res.status(500).json({ error: 'No se pudo eliminar la respuesta' });
    }
  } catch (error) {
    console.error('Error eliminando respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS API PARA USUARIOS
// ================================

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const { filter } = req.query;
    
    let users;
    if (filter && ['whatsapp_sent', 'whatsapp_not_sent'].includes(filter)) {
      users = await usersDb.getFilteredUsers(filter);
    } else {
      users = await usersDb.getUsersWithWhatsAppStatus();
    }
    
    // Get all responses to check which users have responded
    const responses = await db.getAllResponses();
    // Create set of identification numbers from responses (since user_id might be null)
    const responseIdentifications = new Set(
      responses
        .map(r => r.identification)
        .filter(id => id)
    );
    
    // Update has_response field for each user based on identification match
    const usersWithResponses = users.map(user => ({
      ...user,
      has_response: responseIdentifications.has(user.identification) ? 1 : 0
    }));
    
    // Apply response-based filters
    let filteredUsers = usersWithResponses;
    if (filter === 'no_response') {
      // Todos los usuarios que NO han respondido la encuesta (independiente del WhatsApp)
      filteredUsers = usersWithResponses.filter(u => !u.has_response);
    } else if (filter === 'has_response') {
      filteredUsers = usersWithResponses.filter(u => u.has_response);
    }
    
    res.json(filteredUsers);
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
    const validAreas = [
      "Aliados", "Cargo en Entrenamiento", "Commercial Ops", "Compensation & Benefits", 
      "Cross Selling", "Cultura", "Customer Success", "Data Analytics", 
      "Digital Strategy Engineering", "Engagement & Retention Core", 
      "Engagement & Retention Empresario", "Entrenamiento y Excelencia", 
      "Finance & Administration", "Fundación Siigo", "Ingenieria Cloud", 
      "Ingenieria Legacy", "Marketing", "Marketing Channels", 
      "Marketing Valor Agregado / Training", "Onboarding", "People Ops", 
      "Product", "Quality Assurance Cloud", "Renovaciones", "Sales", 
      "Small and Medium Business", "Soporte Legacy", "Soporte Nube", 
      "Strategy", "Talent Acquisition", "Tech", "Transformation & Innovation"
    ];
    if (!validAreas.includes(userData.area)) {
      return res.status(400).json({ error: 'Área inválida' });
    }

    // Asignar país por defecto si no se proporciona
    if (!userData.country || userData.country.trim() === '') {
      userData.country = 'Colombia';
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
    const validAreas = [
      "Aliados", "Cargo en Entrenamiento", "Commercial Ops", "Compensation & Benefits", 
      "Cross Selling", "Cultura", "Customer Success", "Data Analytics", 
      "Digital Strategy Engineering", "Engagement & Retention Core", 
      "Engagement & Retention Empresario", "Entrenamiento y Excelencia", 
      "Finance & Administration", "Fundación Siigo", "Ingenieria Cloud", 
      "Ingenieria Legacy", "Marketing", "Marketing Channels", 
      "Marketing Valor Agregado / Training", "Onboarding", "People Ops", 
      "Product", "Quality Assurance Cloud", "Renovaciones", "Sales", 
      "Small and Medium Business", "Soporte Legacy", "Soporte Nube", 
      "Strategy", "Talent Acquisition", "Tech", "Transformation & Innovation"
    ];
    const validCountries = ["Colombia", "Ecuador", "Uruguay", "México", "Perú"];

    // Procesar cada línea (omitir la primera si es header)
    const dataLines = lines[0].toLowerCase().includes('nombre') ? lines.slice(1) : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));

      if (columns.length < 13) {
        continue; // Saltar líneas incompletas
      }

      const [identification, firstName, lastName, country, paisContratacion, area, subArea, cargo, lider, liderEntrenamiento, phone, fechaInicio, exitDate] = columns;

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
        country: country,
        fechaInicio: fechaInicio || null,
        cargo: cargo || null,
        subArea: subArea || null,
        lider: lider || null,
        liderEntrenamiento: liderEntrenamiento || null,
        paisContratacion: paisContratacion || null
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

// Endpoint para descargar datos de respuestas
app.get('/api/export/responses', async (req, res) => {
  try {
    const responses = await db.getAllResponses();
    const csv = require('csv-stringify/sync');
    
    const output = csv.stringify(responses, {
      header: true
    });
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="responses_export.csv"');
    res.send(output);
  } catch (error) {
    console.error('Error exportando respuestas:', error);
    res.status(500).json({ error: 'Error exportando respuestas' });
  }
});

// Endpoint para descargar datos de usuarios
app.get('/api/export/users', async (req, res) => {
  try {
    const users = await usersDb.getAllUsers();
    const csv = require('csv-stringify/sync');
    
    const output = csv.stringify(users, {
      header: true
    });
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send(output);
  } catch (error) {
    console.error('Error exportando usuarios:', error);
    res.status(500).json({ error: 'Error exportando usuarios' });
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

// Importar servicios de WhatsApp con botones
const { 
  sendSurveyInvitationWithButton, 
  sendBulkSurveyInvitations 
} = require('./services/whatsapp-button-sender');

// Enviar mensaje de WhatsApp a usuario con botón interactivo
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

    console.log(`📱 Enviando WhatsApp con botón a ${name} (ID: ${userId})`);

    // Enviar usando el template con botón aprobado
    const result = await sendSurveyInvitationWithButton({
      id: userId,
      phone: phone,
      first_name: name.split(' ')[0] // Usar solo el primer nombre
    });

    if (result.success) {
      // Actualizar el registro del usuario con la información del WhatsApp enviado
      try {
        await usersDb.updateWhatsAppStatus(userId, result.messageId);
        console.log(`✅ WhatsApp con botón enviado a ${name} - ID: ${result.messageId}`);
      } catch (updateError) {
        console.error('Error actualizando estado de WhatsApp en BD:', updateError);
      }

      // URL del formulario para logging
      const formUrl = `https://www.siigo.digital/?user=${userId}`;

      res.json({
        success: true,
        message: 'Mensaje de WhatsApp con botón enviado exitosamente',
        whatsappId: result.messageId,
        formUrl: formUrl,
        status: result.status,
        sentTo: result.to,
        templateUsed: 'UTILITY_BUTTON_TEMPLATE'
      });
    } else {
      console.error(`❌ Error enviando WhatsApp a ${name}:`, result.error);
      res.status(500).json({ 
        error: 'Error al enviar mensaje con botón', 
        details: result.error,
        code: result.code 
      });
    }

  } catch (error) {
    console.error('Error en endpoint send-whatsapp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ================================
// ENDPOINT PARA ENVÍO MASIVO CON BOTONES
// ================================

app.post('/api/users/send-bulk-whatsapp', async (req, res) => {
  try {
    const { userIds, options = {} } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere un array de IDs de usuarios para envío masivo' 
      });
    }

    console.log(`🚀 Iniciando envío masivo con botones a ${userIds.length} usuarios`);

    // Obtener usuarios de la base de datos
    const users = [];
    for (const userId of userIds) {
      try {
        const user = await usersDb.getUser(userId);
        if (user && user.phone) {
          users.push({
            id: user.id,
            phone: user.phone,
            first_name: user.first_name || user.name?.split(' ')[0] || 'Usuario'
          });
        } else {
          console.warn(`Usuario ${userId} sin teléfono o no encontrado`);
        }
      } catch (userError) {
        console.error(`Error obteniendo usuario ${userId}:`, userError.message);
      }
    }

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron usuarios válidos con números de teléfono'
      });
    }

    // Configuración del envío masivo
    const bulkOptions = {
      batch_size: options.batch_size || 15,
      message_delay: options.message_delay || 4000,
      batch_delay: options.batch_delay || 45000
    };

    console.log(`📊 Configuración: ${bulkOptions.batch_size} por lote, ${bulkOptions.message_delay/1000}s entre mensajes`);

    // Ejecutar envío masivo
    const results = await sendBulkSurveyInvitations(users, bulkOptions);

    // Actualizar base de datos para usuarios exitosos
    if (results.details && results.details.length > 0) {
      for (const detail of results.details) {
        if (detail.status === 'sent' && detail.message_id) {
          try {
            await usersDb.updateWhatsAppStatus(detail.user_id, detail.message_id);
          } catch (updateError) {
            console.error(`Error actualizando BD para usuario ${detail.user_id}:`, updateError.message);
          }
        }
      }
    }

    console.log(`✅ Envío masivo completado: ${results.sent} enviados, ${results.errors} errores`);

    res.json({
      success: true,
      message: 'Envío masivo con botones completado',
      summary: {
        total_requested: userIds.length,
        users_processed: users.length,
        sent: results.sent,
        errors: results.errors,
        skipped: results.skipped
      },
      details: results.details,
      configuration: bulkOptions,
      template_used: 'UTILITY_BUTTON_TEMPLATE'
    });

  } catch (error) {
    console.error('Error en envío masivo:', error);
    res.status(500).json({ 
      error: 'Error interno en envío masivo', 
      message: error.message 
    });
  }
});

// ================================
// ENDPOINT PARA VER CONVERSACIONES DE WHATSAPP
// ================================

app.get('/api/whatsapp/conversations', async (req, res) => {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Obtener mensajes de los últimos 30 días
    const since = new Date();
    since.setDate(since.getDate() - 30);
    
    console.log('📱 Obteniendo conversaciones de WhatsApp...');
    
    // Obtener todos los mensajes enviados y recibidos
    const messages = await client.messages.list({
      dateSentAfter: since,
      limit: 500 // Limitar para evitar timeouts
    });
    
    // Filtrar solo mensajes de WhatsApp
    const whatsappMessages = messages.filter(msg => 
      msg.from.startsWith('whatsapp:') || msg.to.startsWith('whatsapp:')
    );
    
    // Agrupar mensajes por número de teléfono
    const conversations = {};
    
    for (const msg of whatsappMessages) {
      // Determinar el número del usuario (no nuestro número de Twilio)
      const ourNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      const userNumber = msg.from === ourNumber ? msg.to : msg.from;
      
      if (!conversations[userNumber]) {
        conversations[userNumber] = [];
      }
      
      conversations[userNumber].push({
        sid: msg.sid,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent,
        direction: msg.direction,
        status: msg.status,
        errorCode: msg.errorCode,
        errorMessage: msg.errorMessage,
        isFromUser: msg.from !== ourNumber
      });
    }
    
    // Ordenar mensajes por fecha en cada conversación
    Object.keys(conversations).forEach(number => {
      conversations[number].sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    });
    
    // Obtener estadísticas
    const stats = {
      totalConversations: Object.keys(conversations).length,
      totalMessages: whatsappMessages.length,
      incomingMessages: whatsappMessages.filter(m => m.direction === 'inbound').length,
      outgoingMessages: whatsappMessages.filter(m => m.direction === 'outbound-api').length
    };
    
    console.log(`📊 Conversaciones encontradas: ${stats.totalConversations}, Mensajes: ${stats.totalMessages}`);
    
    res.json({
      success: true,
      conversations,
      stats,
      ourNumber: process.env.TWILIO_WHATSAPP_NUMBER
    });
    
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ 
      error: 'Error obteniendo conversaciones de WhatsApp', 
      message: error.message 
    });
  }
});

// Endpoint para obtener conversación específica de un usuario
app.get('/api/whatsapp/conversation/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Formatear número de WhatsApp
    let whatsappNumber = phone;
    if (!whatsappNumber.startsWith('whatsapp:')) {
      // Limpiar y formatear número
      const cleaned = phone.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length === 10) {
        formatted = '57' + cleaned; // Colombia
      }
      if (!formatted.startsWith('+')) {
        formatted = '+' + formatted;
      }
      whatsappNumber = `whatsapp:${formatted}`;
    }
    
    console.log(`📱 Obteniendo conversación con: ${whatsappNumber}`);
    
    // Obtener mensajes de los últimos 30 días
    const since = new Date();
    since.setDate(since.getDate() - 30);
    
    // Obtener mensajes enviados a este número
    const sentMessages = await client.messages.list({
      to: whatsappNumber,
      dateSentAfter: since,
      limit: 100
    });
    
    // Obtener mensajes recibidos de este número
    const receivedMessages = await client.messages.list({
      from: whatsappNumber,
      dateSentAfter: since,
      limit: 100
    });
    
    // Combinar y ordenar mensajes
    const allMessages = [...sentMessages, ...receivedMessages]
      .map(msg => ({
        sid: msg.sid,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent,
        direction: msg.direction,
        status: msg.status,
        errorCode: msg.errorCode,
        errorMessage: msg.errorMessage,
        isFromUser: msg.from === whatsappNumber,
        mediaUrl: msg.mediaUrl
      }))
      .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    
    // Buscar usuario en la base de datos
    let user = null;
    try {
      // Limpiar número para buscar en BD
      const cleanPhone = phone.replace(/\D/g, '');
      const users = await usersDb.getAllUsers();
      user = users.find(u => u.phone && u.phone.replace(/\D/g, '') === cleanPhone);
    } catch (dbError) {
      console.warn('No se pudo buscar usuario en BD:', dbError.message);
    }
    
    res.json({
      success: true,
      messages: allMessages,
      userNumber: whatsappNumber,
      user: user,
      stats: {
        totalMessages: allMessages.length,
        fromUser: allMessages.filter(m => m.isFromUser).length,
        toUser: allMessages.filter(m => !m.isFromUser).length
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo conversación específica:', error);
    res.status(500).json({ 
      error: 'Error obteniendo conversación', 
      message: error.message 
    });
  }
});

// ================================
// ENDPOINT PARA ENVIAR RESPUESTA EN CONVERSACIÓN
// ================================

app.post('/api/whatsapp/reply', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Número de teléfono y mensaje son requeridos' });
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Formatear número de WhatsApp
    let whatsappTo = phone;
    if (!whatsappTo.startsWith('whatsapp:')) {
      const cleaned = phone.replace(/\D/g, '');
      let formattedNumber = cleaned;
      
      // Agregar código de país si no lo tiene
      if (cleaned.length === 10) {
        formattedNumber = '57' + cleaned;
      }
      
      whatsappTo = `whatsapp:+${formattedNumber}`;
    }

    console.log(`📤 Enviando respuesta a ${whatsappTo}: ${message.substring(0, 50)}...`);

    // Enviar mensaje de respuesta
    const messageParams = {
      to: whatsappTo,
      body: message
    };

    // Usar Messaging Service si está disponible, sino usar número directo
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else {
      messageParams.from = process.env.TWILIO_WHATSAPP_NUMBER;
    }

    const sentMessage = await client.messages.create(messageParams);

    console.log(`✅ Respuesta enviada. SID: ${sentMessage.sid}`);

    res.json({
      success: true,
      messageId: sentMessage.sid,
      status: sentMessage.status,
      message: 'Respuesta enviada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error enviando respuesta WhatsApp:', error);
    res.status(500).json({ 
      error: 'Error enviando respuesta', 
      message: error.message,
      code: error.code 
    });
  }
});

// ================================
// ENDPOINT PARA ENVÍO CON MENSAJE PERSONALIZADO
// ================================

app.post('/api/users/send-custom-whatsapp', async (req, res) => {
  try {
    const { userId, phone, message } = req.body;

    if (!userId || !phone || !message) {
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

    // Configuración de Whapi
    const whapiToken = process.env.WHAPI_TOKEN;
    if (!whapiToken) {
      return res.status(500).json({ error: 'Token de Whapi no configurado' });
    }

    // Enviar mensaje a través de Whapi
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
      
      // Actualizar el estado de WhatsApp en la base de datos
      await usersDb.updateWhatsAppStatus(userId, result.id);

      // Log del envío exitoso
      console.log(`WhatsApp personalizado enviado a ${user.first_name} ${user.last_name} (${phone})`);

      res.json({
        success: true,
        message: 'Mensaje de WhatsApp personalizado enviado exitosamente',
        whatsappId: result.id
      });
    } else {
      const error = await whapiResponse.text();
      console.error('Error de Whapi:', error);
      res.status(500).json({ error: 'Error al enviar mensaje a través de Whapi' });
    }

  } catch (error) {
    console.error('Error enviando WhatsApp personalizado:', error);
    console.error('Stack trace:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ================================
// ENDPOINT PARA SEGUNDO ENVÍO MASIVO (RECORDATORIO)
// ================================

app.post('/api/users/send-second-whatsapp', async (req, res) => {
  try {
    // Cargar lista de usuarios que NO deben recibir el mensaje (los 25 con disculpas)
    const fs = require('fs');
    let excludedIdentifications = [];
    
    try {
      // Intentar cargar desde la ruta del servidor
      const apologizedUsers = JSON.parse(fs.readFileSync('./responders_to_apologize.json', 'utf8'));
      excludedIdentifications = apologizedUsers.map(u => u.identificacion);
      console.log(`Excluyendo ${excludedIdentifications.length} usuarios que ya recibieron disculpas`);
    } catch (err) {
      console.log('No se pudo cargar lista de exclusión, continuando sin filtro');
    }
    
    // Obtener todos los usuarios
    const users = await usersDb.getAllUsers();
    
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No hay usuarios en la base de datos',
        sent: 0,
        total: 0
      });
    }

    // Filtrar usuarios: debe tener teléfono Y NO estar en la lista de exclusión
    const usersWithPhone = users.filter(user => {
      // Debe tener teléfono
      if (!user.phone || !user.phone.trim()) return false;
      
      // NO debe estar en la lista de los 25 que recibieron disculpas
      if (excludedIdentifications.includes(user.identification)) {
        console.log(`Excluyendo a ${user.first_name} ${user.last_name} (${user.identification}) - ya recibió disculpas`);
        return false;
      }
      
      return true;
    });
    
    if (usersWithPhone.length === 0) {
      return res.json({
        success: true,
        message: 'No hay usuarios con número de teléfono',
        sent: 0,
        total: users.length
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Configuración para evitar bloqueos
    const BATCH_SIZE = 20;
    const DELAY_BETWEEN_MESSAGES = 5000; // 5 segundos entre mensajes
    const DELAY_BETWEEN_BATCHES = 60000; // 60 segundos entre lotes

    // Procesar en lotes
    const batches = [];
    for (let i = 0; i < usersWithPhone.length; i += BATCH_SIZE) {
      batches.push(usersWithPhone.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (let userIndex = 0; userIndex < batch.length; userIndex++) {
        const user = batch[userIndex];
        
        try {
          // Limpiar número de teléfono
          const cleanPhone = user.phone.replace(/\D/g, '');
          
          if (cleanPhone.length < 10) {
            errorCount++;
            console.warn(`Teléfono inválido para ${user.first_name} ${user.last_name}: ${user.phone}`);
            continue;
          }

          // Formatear número para WhatsApp
          let whatsappNumber = cleanPhone;
          if (!whatsappNumber.startsWith('57') && cleanPhone.length === 10) {
            whatsappNumber = '57' + cleanPhone;
          }

          // URL del formulario con ID del usuario
          const baseUrl = process.env.FORM_URL || 'https://www.siigo.digital';
          const formUrl = `${baseUrl}/?user=${user.id}`;

          // Mensaje de segundo envío (recordatorio)
          const primerNombre = user.first_name;
          const message = `Hola ${primerNombre} nuevamente!

Ayúdanos a realizar la encuesta. No toma más de 5 minutos y nos ayudas muchísimo a mejorar.

${formUrl}`;

          // Configuración de Whapi
          const whapiToken = process.env.WHAPI_TOKEN;
          if (!whapiToken) {
            throw new Error('Token de Whapi no configurado');
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
            
            // Actualizar estado en la BD
            try {
              await usersDb.updateWhatsAppStatus(user.id, result.id, 'second_reminder');
            } catch (updateError) {
              console.error('Error actualizando estado de WhatsApp:', updateError);
            }
            
            successCount++;
            console.log(`✅ Segundo envío a ${primerNombre} ${user.last_name} (${user.phone})`);
          } else {
            errorCount++;
            const errorText = await whapiResponse.text();
            console.warn(`❌ Error en segundo envío a ${primerNombre}: ${errorText}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error en segundo envío a ${user.first_name}:`, error.message);
        }

        // Delay entre mensajes dentro del lote
        if (userIndex < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
        }
      }

      // Delay entre lotes
      if (batchIndex < batches.length - 1) {
        console.log(`⏳ Esperando ${DELAY_BETWEEN_BATCHES/1000} segundos antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    const excludedCount = users.filter(u => u.phone && excludedIdentifications.includes(u.identification)).length;
    
    res.json({
      success: true,
      message: 'Proceso de segundo envío completado',
      sent: successCount,
      errors: errorCount,
      total: usersWithPhone.length,
      excluded: excludedCount,
      details: `Se excluyeron ${excludedCount} usuarios que ya recibieron disculpas`
    });

  } catch (error) {
    console.error('Error en segundo envío masivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: error.message 
    });
  }
});

// ================================
// ENDPOINT PARA DISCULPAS MASIVAS A LOS 26 QUE YA RESPONDIERON
// ================================

app.post('/api/users/send-apology-whatsapp', async (req, res) => {
  try {
    const fs = require('fs');
    
    // Leer lista de usuarios que ya habían respondido
    const respondersData = JSON.parse(fs.readFileSync('/app/responders_to_apologize.json', 'utf8'));
    
    if (respondersData.length === 0) {
      return res.json({
        success: true,
        message: 'No hay usuarios en la lista de disculpas',
        sent: 0,
        total: 0
      });
    }

    // Filtrar usuarios con teléfono
    const usersWithPhone = respondersData.filter(user => user.telefono && user.telefono.trim());
    
    if (usersWithPhone.length === 0) {
      return res.json({
        success: true,
        message: 'No hay usuarios en lista de disculpas con número de teléfono',
        sent: 0,
        total: respondersData.length
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Configuración para evitar bloqueos
    const BATCH_SIZE = 15; // Más conservador para mensajes de disculpa
    const DELAY_BETWEEN_MESSAGES = 5000; // 5 segundos entre mensajes
    const DELAY_BETWEEN_BATCHES = 45000; // 45 segundos entre lotes

    // Procesar en lotes
    const batches = [];
    for (let i = 0; i < usersWithPhone.length; i += BATCH_SIZE) {
      batches.push(usersWithPhone.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (let userIndex = 0; userIndex < batch.length; userIndex++) {
        const user = batch[userIndex];
        
        try {
          // Limpiar número de teléfono
          const cleanPhone = user.telefono.replace(/\D/g, '');
          
          if (cleanPhone.length < 10) {
            errorCount++;
            console.warn(`Teléfono inválido para ${user.full_name}: ${user.telefono}`);
            continue;
          }

          // Formatear número para WhatsApp
          let whatsappNumber = cleanPhone;
          if (!whatsappNumber.startsWith('57') && cleanPhone.length === 10) {
            whatsappNumber = '57' + cleanPhone;
          }

          // Necesitamos crear el usuario en la BD primero para obtener el ID
          // Buscar si el usuario ya existe por identificación
          let userId;
          try {
            const existingUser = await usersDb.getUserByIdentification(user.identificacion);
            
            if (existingUser) {
              userId = existingUser.id;
            } else {
              // Crear usuario si no existe
              const userData = {
                first_name: user.nombre,
                last_name: user.apellido,
                identification: user.identificacion,
                phone: user.telefono,
                exit_date: user.fecha_retiro,
                area: user.area,
                country: user.pais,
                fechaInicio: null,
                cargo: null,
                subArea: null,
                lider: null,
                liderEntrenamiento: null,
                paisContratacion: user.pais
              };
              userId = await usersDb.addUser(userData);
            }
          } catch (dbError) {
            console.error(`Error manejando usuario ${user.full_name}:`, dbError);
            errorCount++;
            continue;
          }

          // URL del formulario con ID del usuario
          const baseUrl = process.env.FORM_URL || 'https://www.siigo.digital';
          const formUrl = `${baseUrl}/?user=${userId}`;

          // Mensaje personalizado de disculpas
          const primerNombre = user.nombre;
          const message = `Hola ${primerNombre}, disculpas por contactarte nuevamente 🙏

Lamentamos informarte que por un error técnico se perdió tu respuesta anterior de la entrevista de retiro. 

Sabemos que ya dedicaste tu tiempo a completarla y entendemos si esto es incómodo. 

¿Nos ayudarías completando nuevamente la encuesta? No toma más de 5 minutos:
${formUrl}

Realmente valoramos tu feedback para seguir mejorando como organización.

Mil disculpas por las molestias 🙏
Equipo de Cultura – Siigo`;

          // Configuración de Whapi
          const whapiToken = process.env.WHAPI_TOKEN;
          if (!whapiToken) {
            throw new Error('Token de Whapi no configurado');
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
            successCount++;
            console.log(`✅ Disculpa enviada a ${user.full_name} (${user.telefono})`);
          } else {
            errorCount++;
            const errorText = await whapiResponse.text();
            console.warn(`❌ Error enviando disculpa a ${user.full_name}: ${errorText}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error enviando disculpa a ${user.full_name}:`, error.message);
        }

        // Delay entre mensajes dentro del lote
        if (userIndex < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
        }
      }

      // Delay más largo entre lotes
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    res.json({
      success: true,
      message: `Disculpas enviadas: ${successCount} exitosos, ${errorCount} errores`,
      sent: successCount,
      errors: errorCount,
      total: usersWithPhone.length
    });

  } catch (error) {
    console.error('Error enviando disculpas WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ================================
// ENDPOINT DE EMERGENCIA PARA RECUPERACIÓN
// ================================

app.get('/emergency-recovery', async (req, res) => {
  try {
    const db = getDatabase();
    const usersDb = getUsersDatabase();
    
    // Verificar respuestas
    const responses = await db.getAllResponses();
    
    let recoveryLog = [`🚨 RECOVERY LOG - ${new Date().toISOString()}`];
    recoveryLog.push(`📊 Respuestas encontradas: ${responses.length}`);
    
    if (responses.length > 0) {
      recoveryLog.push('\n📋 RESPUESTAS DISPONIBLES:');
      responses.forEach((resp, i) => {
        recoveryLog.push(`${i+1}. ${resp.full_name} - ${resp.area} - ${resp.country}`);
      });
      
      // Intentar recuperar usuarios
      let recovered = 0;
      for (const response of responses) {
        if (!response.full_name) continue;
        
        const nameParts = response.full_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const userData = {
          first_name: firstName,
          last_name: lastName,
          identification: response.identification || `REC-${Date.now()}-${response.id}`,
          phone: null,
          exit_date: response.exit_date || new Date().toISOString().split('T')[0],
          area: response.area || 'Sin área',
          country: response.country || 'Colombia',
          fechaInicio: null,
          cargo: null,
          subArea: null,
          lider: response.last_leader || null,
          liderEntrenamiento: null,
          paisContratacion: response.country || 'Colombia'
        };
        
        try {
          const newUserId = await usersDb.addUser(userData);
          recovered++;
          recoveryLog.push(`✅ Recuperado: ${response.full_name} (ID: ${newUserId})`);
        } catch (error) {
          recoveryLog.push(`❌ Error: ${response.full_name} - ${error.message}`);
        }
      }
      
      recoveryLog.push(`\n🎉 USUARIOS RECUPERADOS: ${recovered}/${responses.length}`);
    }
    
    db.close();
    usersDb.close();
    
    res.send('<pre>' + recoveryLog.join('\n') + '</pre>');
    
  } catch (error) {
    res.send(`💥 ERROR: ${error.message}`);
  }
});

// ================================
// RUTAS DE ANÁLISIS OPENAI
// ================================

app.post('/api/analysis', async (req, res) => {
  try {
    // 1. Obtengo todas las respuestas desde la base de datos
    const allResponses = await db.getAllResponses();
    const analyses = [];

    // 2. Itero sobre cada respuesta para enviarla a OpenAI
    for (let resp of allResponses) {
      // Construyo el prompt a partir de los campos que guardaste en la tabla
      const prompt = `
      Eres un experto en recursos humanos y ambiente laboral de la empresa SIIGO.
Analiza esta respuesta de salida de entrevista:
${JSON.stringify({
        full_name: resp.full_name,
        identification: resp.identification,
        exit_date: resp.exit_date,
        tenure: resp.tenure,
        area: resp.area,
        country: resp.country,
        last_leader: resp.last_leader,
        exit_reason_category: resp.exit_reason_category,
        exit_reason_detail: resp.exit_reason_detail,
        experience_rating: resp.experience_rating,
        would_recommend: resp.would_recommend,
        would_return: resp.would_return,
        what_enjoyed: resp.what_enjoyed,
        what_to_improve: resp.what_to_improve,
        satisfaction_ratings: resp.satisfaction_ratings,
        new_company_info: resp.new_company_info
      }, null, 2)}

Genera sugerencias de mejora con justificación de teorías de recursos humanos
`;

      // 3. Llamada a la API de Chat Completions
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      // 4. Extraigo el contenido generado
      const content = aiResponse.choices[0].message.content.trim();

      analyses.push({
        id: resp.id,
        analysis: content
      });
    }

    // 5. Devuelvo el array de análisis
    res.json(analyses);

  } catch (err) {
    console.error('Error en /api/analysis:', err);
    res.status(500).json({ error: 'No se pudo generar el análisis' });
  }
});

// ================================
// ANÁLISIS GLOBAL DE ORGANIZACIÓN (debe ir ANTES del :id)
// ================================

app.post('/api/analysis/global', async (req, res) => {
  try {
    console.log('Iniciando análisis global...');
    
    // 1. Obtener todas las respuestas completadas
    const responses = await db.getAllResponses();
    
    if (responses.length === 0) {
      return res.status(400).json({ 
        error: 'No hay respuestas disponibles para análizar' 
      });
    }

    console.log(`Analizando ${responses.length} respuestas globalmente...`);

    // 2. Calcular estadísticas generales
    const stats = {
      total_responses: responses.length,
      average_experience_rating: 0,
      would_recommend_percentage: 0,
      would_return_percentage: 0,
      exit_reasons: {},
      areas_analysis: {},
      countries_analysis: {},
      tenure_analysis: {},
      satisfaction_ratings_avg: {}
    };

    // Calcular promedios y conteos
    let totalExperienceRating = 0;
    let recommendCount = 0;
    let returnCount = 0;

    responses.forEach(resp => {
      // Rating de experiencia
      if (resp.experience_rating) {
        totalExperienceRating += parseInt(resp.experience_rating);
      }

      // Recomendaciones
      if (resp.would_recommend === true || resp.would_recommend === 'SÍ') {
        recommendCount++;
      }

      // Regreso
      if (resp.would_return === true || resp.would_return === 'SÍ') {
        returnCount++;
      }

      // Razones de salida
      if (resp.exit_reason_category) {
        stats.exit_reasons[resp.exit_reason_category] = 
          (stats.exit_reasons[resp.exit_reason_category] || 0) + 1;
      }

      // Análisis por área
      if (resp.area) {
        if (!stats.areas_analysis[resp.area]) {
          stats.areas_analysis[resp.area] = {
            count: 0,
            avg_experience: 0,
            would_recommend: 0,
            would_return: 0
          };
        }
        stats.areas_analysis[resp.area].count++;
        if (resp.experience_rating) {
          stats.areas_analysis[resp.area].avg_experience += parseInt(resp.experience_rating);
        }
        if (resp.would_recommend === true || resp.would_recommend === 'SÍ') {
          stats.areas_analysis[resp.area].would_recommend++;
        }
        if (resp.would_return === true || resp.would_return === 'SÍ') {
          stats.areas_analysis[resp.area].would_return++;
        }
      }

      // Análisis por país
      if (resp.country) {
        stats.countries_analysis[resp.country] = 
          (stats.countries_analysis[resp.country] || 0) + 1;
      }

      // Análisis por tiempo en la empresa
      if (resp.tenure) {
        stats.tenure_analysis[resp.tenure] = 
          (stats.tenure_analysis[resp.tenure] || 0) + 1;
      }

      // Promedios de satisfacción
      if (resp.satisfaction_ratings) {
        let ratings;
        try {
          ratings = typeof resp.satisfaction_ratings === 'string' 
            ? JSON.parse(resp.satisfaction_ratings) 
            : resp.satisfaction_ratings;
        } catch {
          ratings = {};
        }

        Object.entries(ratings).forEach(([category, rating]) => {
          if (!stats.satisfaction_ratings_avg[category]) {
            stats.satisfaction_ratings_avg[category] = { total: 0, count: 0 };
          }
          stats.satisfaction_ratings_avg[category].total += parseFloat(rating) || 0;
          stats.satisfaction_ratings_avg[category].count++;
        });
      }
    });

    // Calcular promedios finales
    stats.average_experience_rating = (totalExperienceRating / responses.length).toFixed(2);
    stats.would_recommend_percentage = ((recommendCount / responses.length) * 100).toFixed(1);
    stats.would_return_percentage = ((returnCount / responses.length) * 100).toFixed(1);

    // Promedios por área
    Object.keys(stats.areas_analysis).forEach(area => {
      const areaData = stats.areas_analysis[area];
      areaData.avg_experience = (areaData.avg_experience / areaData.count).toFixed(2);
      areaData.would_recommend_percentage = ((areaData.would_recommend / areaData.count) * 100).toFixed(1);
      areaData.would_return_percentage = ((areaData.would_return / areaData.count) * 100).toFixed(1);
    });

    // Promedios de satisfacción por categoría
    Object.keys(stats.satisfaction_ratings_avg).forEach(category => {
      const catData = stats.satisfaction_ratings_avg[category];
      stats.satisfaction_ratings_avg[category] = (catData.total / catData.count).toFixed(2);
    });

    // 3. Preparar datos para análisis con IA
    const analysisData = {
      resumen_estadistico: stats,
      comentarios_principales: {
        lo_que_disfrutaron: responses.filter(r => r.what_enjoyed).map(r => r.what_enjoyed).slice(0, 10),
        areas_mejora: responses.filter(r => r.what_to_improve).map(r => r.what_to_improve).slice(0, 10)
      },
      patrones_identificados: {
        area_mayor_rotacion: Object.keys(stats.areas_analysis).reduce((a, b) => 
          stats.areas_analysis[a].count > stats.areas_analysis[b].count ? a : b),
        razon_salida_principal: Object.keys(stats.exit_reasons).reduce((a, b) => 
          stats.exit_reasons[a] > stats.exit_reasons[b] ? a : b),
        satisfaccion_mas_baja: Object.keys(stats.satisfaction_ratings_avg).reduce((a, b) => 
          parseFloat(stats.satisfaction_ratings_avg[a]) < parseFloat(stats.satisfaction_ratings_avg[b]) ? a : b)
      }
    };

    // 4. Generar análisis con OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API Key no configurado - devolviendo solo estadísticas');
      return res.json({
        success: true,
        data: {
          ...analysisData,
          ai_analysis: 'Análisis de IA no disponible - API Key no configurado',
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('Generando análisis organizacional con IA...');

    const prompt = `
    Eres un experto consultor en recursos humanos y análisis organizacional para la empresa SIIGO.
    
    Analiza los siguientes datos de entrevistas de salida y genera un análisis estratégico:
    
    ${JSON.stringify(analysisData, null, 2)}
    
    Proporciona:
    1. ANÁLISIS DE TENDENCIAS CRÍTICAS
    2. RECOMENDACIONES ESTRATÉGICAS PRIORITARIAS
    3. PLAN DE ACCIÓN INMEDIATO (próximos 90 días)
    4. MÉTRICAS DE SEGUIMIENTO SUGERIDAS
    
    Usa teorías de recursos humanos y gestión organizacional respaldadas.
    `;

    const ai = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    });

    const aiAnalysis = ai.choices[0].message.content.trim();

    res.json({
      success: true,
      data: {
        ...analysisData,
        ai_analysis: aiAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en análisis global:', error);
    res.status(500).json({ 
      error: 'Error generando análisis global',
      details: error.message 
    });
  }
});

//ANÁLISIS OPENAI PARA CADA REGISTRO
app.post('/api/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Si el ID es "global", rechazar - debe usar /api/analysis/global
    if (id === 'global') {
      return res.status(400).json({ 
        error: 'Para análisis global, use el endpoint /api/analysis/global'
      });
    }
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'ID de respuesta debe ser un número válido'
      });
    }
    
    // Verificar si OpenAI está configurado
    if (!process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY no está configurado');
      return res.status(500).json({ 
        error: 'API Key de OpenAI no configurado',
        details: 'Contacte al administrador para configurar OPENAI_API_KEY'
      });
    }

    const resp = await db.getResponse(id);

    if (!resp) return res.status(404).json({ error: 'Respuesta no encontrada' });

    if (resp.analysis && resp.analysis.trim() !== '') {
      return res.json({ id, analysis: resp.analysis });
    }

    console.log(`🤖 Generando análisis OpenAI para respuesta ID: ${id}`);

    // Construir objeto compacto igual al análisis general
    const userData = {
      full_name: resp.full_name,
      identification: resp.identification,
      exit_date: resp.exit_date,
      tenure: resp.tenure,
      area: resp.area,
      country: resp.country,
      last_leader: resp.last_leader,
      exit_reason_category: resp.exit_reason_category,
      exit_reason_detail: resp.exit_reason_detail,
      experience_rating: resp.experience_rating,
      would_recommend: resp.would_recommend,
      would_return: resp.would_return,
      what_enjoyed: resp.what_enjoyed,
      what_to_improve: resp.what_to_improve,
      satisfaction_ratings: resp.satisfaction_ratings,
      new_company_info: resp.new_company_info
    };

    const prompt = `
Eres un experto en recursos humanos y ambiente laboral de la empresa SIIGO.
Analiza esta respuesta de salida de entrevista:
${JSON.stringify(userData, null, 2)}

Genera sugerencias de mejora con justificación de teorías de recursos humanos
`;

    console.log('📤 Enviando solicitud a OpenAI...');

    const ai = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const analysisText = ai.choices[0].message.content.trim();
    console.log('✅ Análisis generado exitosamente');

    await db.updateAnalysis(id, analysisText);

    res.json({ id, analysis: analysisText });

  } catch (err) {
    console.error('❌ Error detallado en /api/analysis/:id:', {
      message: err.message,
      code: err.code,
      status: err.status,
      type: err.type,
      stack: err.stack
    });
    
    // Manejo específico de errores de OpenAI
    if (err.code === 'insufficient_quota') {
      return res.status(500).json({ 
        error: 'Límite de créditos de OpenAI excedido',
        details: 'La cuenta de OpenAI no tiene créditos suficientes'
      });
    }
    
    if (err.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'API Key de OpenAI inválido',
        details: 'Verificar configuración de OPENAI_API_KEY'
      });
    }
    
    if (err.status === 429) {
      return res.status(500).json({ 
        error: 'Límite de solicitudes excedido',
        details: 'Intente nuevamente en unos minutos'
      });
    }
    
    res.status(500).json({ 
      error: 'No se pudo generar el análisis',
      details: err.message
    });
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