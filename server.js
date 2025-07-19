const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('./database/db');

const app = express();
app.set('trust proxy', true); // Agregar esta línea
const PORT = process.env.PORT || 3000;

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
// Rate limiting - configurado para entornos de desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  // Configuración específica para Codespaces/desarrollo
  ...(process.env.NODE_ENV === 'development' ? {
    skip: () => false, // No saltar el rate limiting en desarrollo
    keyGenerator: (req) => {
      // Usar una clave más simple en desarrollo
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

// Inicializar base de datos
const db = new Database();

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

// Rutas API
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.post('/api/responses', async (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Respuestas inválidas' });
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

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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
});

module.exports = app;