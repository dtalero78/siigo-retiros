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
// Importar configuración de preguntas por área
const { getQuestionsByArea } = require('./questions-config');

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
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
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

// Las preguntas ahora se obtienen dinámicamente según el área del usuario
// usando la función getQuestionsByArea del módulo questions-config

// ================================
// RUTAS API PARA RESPUESTAS
// ================================ 

// Endpoint de diagnóstico para verificar versión del código
app.get('/api/health', (req, res) => {
  const fs = require('fs');
  const dbPath = './database/db.js';
  const dbPostgresPath = './database/db-postgres.js';
  
  let dbContent = '';
  let dbPostgresContent = '';
  
  try {
    if (fs.existsSync(dbPath)) {
      dbContent = fs.readFileSync(dbPath, 'utf8');
      const line94 = dbContent.split('\n')[93] || '';
      dbContent = line94.includes('q10') ? 'CONTIENE q10' : 'NO contiene q10';
    }
    if (fs.existsSync(dbPostgresPath)) {
      dbPostgresContent = fs.readFileSync(dbPostgresPath, 'utf8');
      const line111 = dbPostgresContent.split('\n')[110] || '';
      dbPostgresContent = line111.includes('q10') ? 'CONTIENE q10' : 'NO contiene q10';
    }
  } catch (e) {
    console.error('Error leyendo archivos:', e);
  }
  
  res.json({
    status: 'ok',
    database: process.env.DATABASE_TYPE || 'sqlite',
    dbFile: dbContent,
    dbPostgresFile: dbPostgresContent,
    lastCommit: process.env.COMMIT_SHA || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Endpoint actualizado para servir preguntas según el área
app.get('/api/questions', (req, res) => {
  const { area } = req.query;
  const questions = getQuestionsByArea(area);
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
    console.error('Stack trace:', error.stack);
    console.error('Datos recibidos:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const { dateFrom, dateTo, messageCount } = req.query;
    
    // Get all users with WhatsApp status
    let users = await usersDb.getUsersWithWhatsAppStatus();
    
    // Apply date filters
    if (dateFrom || dateTo) {
      users = users.filter(user => {
        const userDate = new Date(user.created_at);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (userDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (userDate > toDate) return false;
        }
        return true;
      });
    }
    
    // Get all responses to check which users have responded
    const responses = await db.getAllResponses();
    const responseIdentifications = new Set(
      responses
        .map(r => r.identification)
        .filter(id => id)
    );
    
    // Update has_response field for each user
    const usersWithResponses = users.map(user => ({
      ...user,
      has_response: responseIdentifications.has(user.identification) ? 1 : 0
    }));
    
    // Apply message count filters
    let filteredUsers = usersWithResponses;
    if (messageCount) {
      switch(messageCount) {
        case 'no_survey':
          // Users without survey responses
          filteredUsers = usersWithResponses.filter(u => !u.has_response);
          break;
        case 'no_messages':
          // Users with no WhatsApp messages sent
          filteredUsers = usersWithResponses.filter(u => u.whatsapp_sent_count === 0);
          break;
        case 'one_message':
          // Users with exactly 1 message sent and no response
          filteredUsers = usersWithResponses.filter(u => 
            u.whatsapp_sent_count === 1 && !u.has_response
          );
          break;
        case 'two_messages':
          // Users with exactly 2 messages sent and no response
          filteredUsers = usersWithResponses.filter(u => 
            u.whatsapp_sent_count === 2 && !u.has_response
          );
          break;
        case 'three_messages':
          // Users with exactly 3 messages sent and no response
          filteredUsers = usersWithResponses.filter(u => 
            u.whatsapp_sent_count === 3 && !u.has_response
          );
          break;
      }
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

    // Parsear CSV - soportar tanto coma como punto y coma como separador
    const separator = csvContent.includes(';') ? ';' : ',';
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ error: 'El archivo CSV está vacío o no tiene datos' });
    }

    // Mapeo de nombres de columnas del CSV a campos internos
    const columnMapping = {
      // Identificación
      'id': 'identification',
      'identificacion': 'identification',
      'identification': 'identification',
      'cedula': 'identification',
      'documento': 'identification',

      // Código empleado
      'codigo del empleado': 'codigoEmpleado',
      'codigo empleado': 'codigoEmpleado',
      'codigoempleado': 'codigoEmpleado',

      // Tipo de identificación
      'tipo de identificacion': 'tipoIdentificacion',
      'tipo identificacion': 'tipoIdentificacion',
      'tipoidentificacion': 'tipoIdentificacion',

      // Tipo de empleado
      'tipo de empleado': 'tipoEmpleado',
      'tipo empleado': 'tipoEmpleado',
      'tipoempleado': 'tipoEmpleado',

      // Estado
      'estado': 'estado',

      // Nombre (se parsea para extraer nombre y apellido)
      'nombre': 'nombreCompleto',
      'nombre completo': 'nombreCompleto',
      'nombrecompleto': 'nombreCompleto',
      'first_name': 'first_name',
      'firstname': 'first_name',
      'primer nombre': 'first_name',
      'last_name': 'last_name',
      'lastname': 'last_name',
      'apellido': 'last_name',
      'apellidos': 'last_name',

      // Género
      'genero': 'genero',
      'género': 'genero',
      'sexo': 'genero',

      // Fechas
      'fecha inicio': 'fechaInicio',
      'fechainicio': 'fechaInicio',
      'fecha_inicio': 'fechaInicio',
      'fecha de inicio': 'fechaInicio',
      'fecha final contrato': 'exitDate',
      'fechafinalcontrato': 'exitDate',
      'fecha_final_contrato': 'exitDate',
      'fecha retiro': 'exitDate',
      'fecharetiro': 'exitDate',
      'fecha_retiro': 'exitDate',
      'exit_date': 'exitDate',
      'exitdate': 'exitDate',
      'fecha salida': 'exitDate',

      // Motivo de retiro
      'motivo de retiro': 'motivoRetiro',
      'motivoretiro': 'motivoRetiro',
      'motivo retiro': 'motivoRetiro',
      'motivo': 'motivoRetiro',

      // División
      'division': 'division',
      'división': 'division',

      // País
      'pais de contratacion': 'paisContratacion',
      'paiscontratacion': 'paisContratacion',
      'pais contratacion': 'paisContratacion',
      'país de contratación': 'paisContratacion',
      'pais gestion': 'country',
      'paisgestion': 'country',
      'pais de gestion': 'country',
      'país gestión': 'country',
      'país de gestión': 'country',
      'country': 'country',
      'pais': 'country',
      'país': 'country',

      // Centro de costos
      'cod ceco': 'codCeco',
      'codceco': 'codCeco',
      'codigo ceco': 'codCeco',
      'subceco': 'subCeco',
      'codigo subceco': 'codigoSubCeco',
      'codigosubceco': 'codigoSubCeco',
      'subcentro de costo': 'subcentroCosto',
      'subcentrodecosto': 'subcentroCosto',

      // Proyecto
      'proyecto': 'proyecto',

      // Área
      'area': 'area',
      'área': 'area',
      'subarea': 'subArea',
      'sub area': 'subArea',
      'sub-area': 'subArea',
      'subárea': 'subArea',

      // Célula
      'celula': 'celula',
      'célula': 'celula',

      // Posición/Cargo
      'cod posicion': 'codPosicion',
      'codposicion': 'codPosicion',
      'codigo posicion': 'codPosicion',
      'posicion': 'cargo',
      'posición': 'cargo',
      'cargo': 'cargo',

      // Líder
      'codigo de jefe': 'codigoJefe',
      'codigodejefe': 'codigoJefe',
      'codigo jefe': 'codigoJefe',
      'lider': 'lider',
      'líder': 'lider',
      'jefe': 'lider',

      // Email
      'e-mail corporativo 1': 'emailCorporativo1',
      'email corporativo 1': 'emailCorporativo1',
      'emailcorporativo1': 'emailCorporativo1',
      'email': 'emailCorporativo1',
      'correo': 'emailCorporativo1',
      'e-mail corporativo 2': 'emailCorporativo2',
      'email corporativo 2': 'emailCorporativo2',
      'emailcorporativo2': 'emailCorporativo2',

      // Teléfono
      'telefono 2': 'phone',
      'telefono2': 'phone',
      'teléfono 2': 'phone',
      'telefono': 'phone',
      'teléfono': 'phone',
      'celular': 'phone',
      'phone': 'phone',
      'movil': 'phone',
      'móvil': 'phone'
    };

    // Parsear headers (primera línea)
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    // Crear índice de columnas basado en headers
    const columnIndex = {};
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header];
      if (mappedField) {
        columnIndex[mappedField] = index;
      }
    });

    const users = [];
    const skippedRows = [];

    // Procesar cada línea de datos (omitir headers)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));

      // Extraer valores usando el índice de columnas
      const getValue = (field) => {
        const idx = columnIndex[field];
        return idx !== undefined ? columns[idx] || null : null;
      };

      // Manejar nombre completo vs nombre/apellido separados
      let firstName = getValue('first_name');
      let lastName = getValue('last_name');

      if (!firstName && !lastName) {
        const nombreCompleto = getValue('nombreCompleto');
        if (nombreCompleto) {
          const partes = nombreCompleto.split(' ');
          if (partes.length >= 2) {
            firstName = partes[0];
            lastName = partes.slice(1).join(' ');
          } else {
            firstName = nombreCompleto;
            lastName = '';
          }
        }
      }

      const identification = getValue('identification');
      const exitDate = getValue('exitDate');
      const area = getValue('area');
      const country = getValue('country');

      // Validar campos requeridos mínimos
      if (!identification) {
        skippedRows.push({ row: i + 1, reason: 'Sin identificación' });
        continue;
      }

      let phone = getValue('phone');

      // Limpiar teléfono: eliminar si es '0', vacío, o solo espacios
      if (phone && (phone.trim() === '0' || phone.trim() === '')) {
        phone = null;
      }

      // Convertir fechas de formato MM/DD/YYYY a YYYY-MM-DD si es necesario
      const parseDate = (dateStr) => {
        if (!dateStr) return null;

        // Si ya está en formato YYYY-MM-DD, retornar
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        // Intentar parsear MM/DD/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          // Validar que sean números
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            const m = month.padStart(2, '0');
            const d = day.padStart(2, '0');
            return `${year}-${m}-${d}`;
          }
        }

        return dateStr; // Retornar original si no se puede parsear
      };

      const parsedExitDate = parseDate(exitDate);
      const parsedFechaInicio = parseDate(getValue('fechaInicio'));

      users.push({
        first_name: firstName || 'Sin nombre',
        last_name: lastName || '',
        identification: identification,
        phone: phone,
        exit_date: parsedExitDate,
        area: area || 'Sin área',
        country: country || getValue('paisContratacion') || 'Sin país',
        fechaInicio: parsedFechaInicio,
        cargo: getValue('cargo'),
        subArea: getValue('subArea'),
        lider: getValue('lider'),
        paisContratacion: getValue('paisContratacion'),
        // Nuevos campos
        codigoEmpleado: getValue('codigoEmpleado'),
        tipoIdentificacion: getValue('tipoIdentificacion'),
        tipoEmpleado: getValue('tipoEmpleado'),
        estado: getValue('estado'),
        genero: getValue('genero'),
        motivoRetiro: getValue('motivoRetiro'),
        division: getValue('division'),
        codCeco: getValue('codCeco'),
        subCeco: getValue('subCeco'),
        codigoSubCeco: getValue('codigoSubCeco'),
        subcentroCosto: getValue('subcentroCosto'),
        proyecto: getValue('proyecto'),
        celula: getValue('celula'),
        codPosicion: getValue('codPosicion'),
        codigoJefe: getValue('codigoJefe'),
        emailCorporativo1: getValue('emailCorporativo1'),
        emailCorporativo2: getValue('emailCorporativo2')
      });
    }

    // Separar usuarios con y sin celular
    const usersWithPhone = [];
    const usersWithoutPhone = [];

    users.forEach(user => {
      if (user.phone && user.phone.trim() !== '') {
        usersWithPhone.push(user);
      } else {
        usersWithoutPhone.push({
          row: users.indexOf(user) + 2, // +2 porque: +1 por índice 0, +1 por header
          name: `${user.first_name} ${user.last_name}`,
          identification: user.identification,
          area: user.area,
          cargo: user.cargo || '-'
        });
      }
    });

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron usuarios válidos en el archivo CSV',
        skippedRows: skippedRows.slice(0, 10),
        detectedHeaders: headers,
        mappedFields: Object.keys(columnIndex)
      });
    }

    // Si no hay usuarios con teléfono, retornar error con lista de usuarios sin celular
    if (usersWithPhone.length === 0) {
      return res.status(400).json({
        error: 'Ningún usuario del CSV tiene número de celular',
        usersWithoutPhone: usersWithoutPhone,
        totalWithoutPhone: usersWithoutPhone.length,
        detectedHeaders: headers
      });
    }

    // Obtener usuarios existentes para verificar duplicados por teléfono
    const existingUsers = await usersDb.getAllUsers();
    const existingPhones = new Set(
      existingUsers
        .filter(u => u.phone)
        .map(u => u.phone.replace(/\D/g, '')) // Normalizar: solo dígitos
    );
    const existingIdentifications = new Set(
      existingUsers.map(u => u.identification)
    );

    // Filtrar usuarios que ya existen por teléfono o identificación (solo de usersWithPhone)
    const duplicatesByPhone = [];
    const duplicatesByIdentification = [];
    const usersToInsert = usersWithPhone.filter(user => {
      const phoneNormalized = user.phone ? user.phone.replace(/\D/g, '') : null;

      // Verificar duplicado por identificación
      if (existingIdentifications.has(user.identification)) {
        duplicatesByIdentification.push({
          identification: user.identification,
          name: `${user.first_name} ${user.last_name}`
        });
        return false;
      }

      // Verificar duplicado por teléfono (solo si tiene teléfono)
      if (phoneNormalized && existingPhones.has(phoneNormalized)) {
        duplicatesByPhone.push({
          phone: user.phone,
          name: `${user.first_name} ${user.last_name}`
        });
        return false;
      }

      // Agregar a los sets para evitar duplicados dentro del mismo CSV
      if (phoneNormalized) {
        existingPhones.add(phoneNormalized);
      }
      existingIdentifications.add(user.identification);

      return true;
    });

    if (usersToInsert.length === 0) {
      return res.status(400).json({
        error: 'Todos los usuarios con celular del CSV ya existen en la base de datos',
        duplicatesByPhone: duplicatesByPhone.length,
        duplicatesByIdentification: duplicatesByIdentification.length,
        usersWithoutPhone: usersWithoutPhone,
        totalWithoutPhone: usersWithoutPhone.length,
        detectedHeaders: headers
      });
    }

    // Insertar en lote solo los usuarios no duplicados
    const result = await usersDb.bulkInsert(usersToInsert);

    res.json({
      success: true,
      message: 'Archivo CSV procesado exitosamente',
      inserted: result.inserted,
      total: users.length,
      totalWithPhone: usersWithPhone.length,
      errors: result.errors,
      skippedRows: skippedRows.length,
      duplicatesByPhone: duplicatesByPhone.length,
      duplicatesByIdentification: duplicatesByIdentification.length,
      usersWithoutPhone: usersWithoutPhone,
      totalWithoutPhone: usersWithoutPhone.length,
      detectedHeaders: headers,
      mappedFields: Object.keys(columnIndex)
    });

  } catch (error) {
    console.error('Error procesando CSV:', error);
    res.status(500).json({ error: 'Error procesando el archivo CSV: ' + error.message });
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
    const { userIds, templateId, options = {} } = req.body;
    
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

    // Ejecutar envío masivo con la plantilla seleccionada
    const results = await sendBulkSurveyInvitations(users, { ...bulkOptions, templateId });

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
    
    // Número de WhatsApp configurado
    const ourNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+15558192172';

    // Filtrar solo mensajes de WhatsApp válidos de nuestra línea configurada
    const whatsappMessages = messages.filter(msg =>
      (msg.from.startsWith('whatsapp:') || msg.to.startsWith('whatsapp:')) &&
      // Filtrar mensajes con números válidos (no vacíos o malformados)
      msg.from !== '' && msg.to !== '' &&
      !msg.to.includes('+096369910') && // Filtrar este número específico inválido
      // IMPORTANTE: Solo mostrar mensajes de nuestra línea configurada
      (msg.from === ourNumber || msg.to === ourNumber)
    );

    console.log(`📱 Filtrando mensajes de la línea: ${ourNumber}`);
    console.log(`📊 Mensajes totales: ${messages.length}, Mensajes filtrados: ${whatsappMessages.length}`);

    // Agrupar mensajes por número de teléfono
    const conversations = {};

    for (const msg of whatsappMessages) {
      // Determinar el número del usuario (no nuestro número)
      const userNumber = msg.from === ourNumber ? msg.to : msg.from;
      
      // Validar que userNumber no esté vacío
      if (!userNumber || userNumber === '' || userNumber === 'whatsapp:') {
        console.warn('Mensaje con número de usuario inválido:', {
          sid: msg.sid,
          from: msg.from,
          to: msg.to,
          status: msg.status
        });
        continue; // Saltar este mensaje
      }
      
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

    // Manejar error de autenticación de Twilio
    if (error.status === 401 || error.code === 20003) {
      return res.status(401).json({
        error: 'Credenciales de Twilio no válidas',
        message: 'Las credenciales de TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en el archivo .env no son válidas. Por favor, configura las credenciales reales de tu cuenta de Twilio.',
        code: error.code
      });
    }

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

// ================================
// ENDPOINT PARA RE-PROCESAR RESPUESTAS EXISTENTES
// ================================

app.post('/api/responses/:id/reprocess', async (req, res) => {
  try {
    const { id } = req.params;
    const ResponseMapper = require('./response-mapper');

    // Obtener la respuesta existente
    const response = await db.getResponse(id);
    if (!response) {
      return res.status(404).json({ error: 'Respuesta no encontrada' });
    }

    // Verificar que tenga respuestas completas
    if (!response.all_responses) {
      return res.status(400).json({ error: 'Esta respuesta no tiene datos completos para re-procesar' });
    }

    console.log(`🔄 Re-procesando respuesta ${id} para área: ${response.area}`);

    // Re-mapear usando las respuestas completas
    const remappedData = ResponseMapper.mapResponses(response.all_responses, response.area);

    // Campos válidos en la base de datos (basado en la respuesta existente)
    const validFields = [
      'area', 'country', 'exit_date', 'exit_reason_category', 'exit_reason_detail',
      'experience_rating', 'full_name', 'identification', 'last_leader',
      'new_company_info', 'satisfaction_ratings', 'tenure', 'what_enjoyed',
      'what_to_improve', 'would_recommend', 'would_return', 'all_responses'
    ];

    // Filtrar solo campos válidos del mapeo
    const updateData = {};
    validFields.forEach(field => {
      if (remappedData[field] !== undefined) {
        updateData[field] = remappedData[field];
      }
    });

    // Mantener respuestas completas
    updateData.all_responses = response.all_responses;

    // Para debugging, vamos a actualizar campos específicos uno por uno
    console.log('Campos a actualizar:', Object.keys(updateData));

    // Actualizar campos específicos más importantes primero
    if (remappedData.experience_rating !== undefined) {
      await db.pool.query('UPDATE responses SET experience_rating = $1 WHERE id = $2',
        [remappedData.experience_rating, id]);
      console.log(`✅ experience_rating actualizado: ${remappedData.experience_rating}`);
    }

    if (remappedData.exit_reason_category !== undefined) {
      await db.pool.query('UPDATE responses SET exit_reason_category = $1 WHERE id = $2',
        [remappedData.exit_reason_category, id]);
      console.log(`✅ exit_reason_category actualizado: ${remappedData.exit_reason_category}`);
    }

    if (remappedData.exit_reason_detail !== undefined) {
      await db.pool.query('UPDATE responses SET exit_reason_detail = $1 WHERE id = $2',
        [remappedData.exit_reason_detail, id]);
      console.log(`✅ exit_reason_detail actualizado: ${remappedData.exit_reason_detail}`);
    }

    if (remappedData.would_recommend !== undefined) {
      await db.pool.query('UPDATE responses SET would_recommend = $1 WHERE id = $2',
        [remappedData.would_recommend, id]);
      console.log(`✅ would_recommend actualizado: ${remappedData.would_recommend}`);
    }

    if (remappedData.what_enjoyed !== undefined) {
      await db.pool.query('UPDATE responses SET what_enjoyed = $1 WHERE id = $2',
        [remappedData.what_enjoyed, id]);
      console.log(`✅ what_enjoyed actualizado: ${remappedData.what_enjoyed}`);
    }

    if (remappedData.what_to_improve !== undefined) {
      await db.pool.query('UPDATE responses SET what_to_improve = $1 WHERE id = $2',
        [remappedData.what_to_improve, id]);
      console.log(`✅ what_to_improve actualizado: ${remappedData.what_to_improve}`);
    }

    console.log(`✅ Respuesta ${id} re-procesada exitosamente`);

    res.json({
      success: true,
      message: `Respuesta ${id} re-procesada con mapeo mejorado`,
      originalArea: response.area,
      fieldsUpdated: Object.keys(remappedData).filter(key => remappedData[key] !== null).length
    });

  } catch (error) {
    console.error(`❌ Error re-procesando respuesta ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error re-procesando respuesta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ================================
// ENDPOINT PARA EXPORTACIÓN CSV DINÁMICA
// ================================

app.get('/api/export/csv', async (req, res) => {
  try {
    const ResponseMapper = require('./response-mapper');

    // Obtener todas las respuestas
    const responses = await db.getAllResponses();

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No hay datos para exportar' });
    }

    // Agrupar respuestas por área para optimizar la exportación
    const responsesByArea = {};
    responses.forEach(response => {
      const area = response.area || 'General';
      if (!responsesByArea[area]) {
        responsesByArea[area] = [];
      }
      responsesByArea[area].push(response);
    });

    // Generar CSV completo
    let csvContent = '';
    let isFirstArea = true;

    // Procesar cada área
    Object.keys(responsesByArea).forEach(area => {
      const areaResponses = responsesByArea[area];
      const headers = ResponseMapper.getCsvMapping(area);

      // Agregar headers solo para la primera área o si es necesario
      if (isFirstArea) {
        // Agregar columna de área al inicio para identificación
        headers.splice(3, 0, 'Tipo de Formulario');
        csvContent += headers.join(',') + '\n';
        isFirstArea = false;
      }

      // Agregar filas de datos
      areaResponses.forEach(response => {
        const row = ResponseMapper.toCsvRow(response, area);
        // Insertar tipo de formulario
        row.splice(3, 0, `${area} (${area === 'Sales' ? '29' : '17'} preguntas)`);

        // Escapar comillas en los valores
        const escapedRow = row.map(value => {
          const strValue = String(value || '');
          return strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue;
        });

        csvContent += escapedRow.join(',') + '\n';
      });
    });

    // Configurar headers de respuesta
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `entrevistas_retiro_dinamicas_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Agregar BOM para Excel UTF-8
    const bom = '\uFEFF';
    res.send(bom + csvContent);

    console.log(`📊 CSV dinámico exportado: ${responses.length} respuestas en ${Object.keys(responsesByArea).length} tipos de formulario`);

  } catch (error) {
    console.error('Error exportando CSV dinámico:', error);
    res.status(500).json({
      error: 'Error generando exportación CSV',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ================================
// EXPORTACIÓN A EXCEL (XLSX)
// ================================

app.get('/api/export/excel', async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { questionsGeneral, questionsSales } = require('./questions-config');

    // Obtener todas las respuestas
    const responses = await db.getAllResponses();

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No hay datos para exportar' });
    }

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Separar respuestas por área
    const salesResponses = responses.filter(r => r.area === 'Sales');
    const generalResponses = responses.filter(r => r.area !== 'Sales');

    // ========== HOJA DE VENTAS ==========
    if (salesResponses.length > 0) {
      const salesData = salesResponses.map(response => {
        const rowData = {
          'ID': response.id,
          'Nombre Completo': response.full_name || '',
          'Identificación': response.identification || '',
          'Fecha de Retiro': response.exit_date || '',
          'Tiempo en Siigo': response.time_at_siigo || '',
          'Área': response.area || '',
          'País': response.country || '',
          'Último Líder': response.last_leader || '',
          'Fecha de Respuesta': response.created_at ? new Date(response.created_at).toLocaleDateString('es-ES') : ''
        };

        // Agregar respuestas con títulos de preguntas
        if (response.all_responses) {
          let allResponses = response.all_responses;
          if (typeof allResponses === 'string') {
            try { allResponses = JSON.parse(allResponses); } catch (e) { allResponses = {}; }
          }

          // Agregar cada pregunta de Sales en orden
          questionsSales.forEach(q => {
            const key = `q${q.number}`;
            const title = q.question;
            rowData[title] = allResponses[key] || '';
          });
        }
        return rowData;
      });

      const salesSheet = XLSX.utils.json_to_sheet(salesData);

      // Ajustar anchos de columna
      const salesColWidths = Object.keys(salesData[0] || {}).map(key => ({
        wch: Math.min(Math.max(key.length, 15), 60)
      }));
      salesSheet['!cols'] = salesColWidths;

      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas');
    }

    // ========== HOJA GENERAL ==========
    if (generalResponses.length > 0) {
      const generalData = generalResponses.map(response => {
        const rowData = {
          'ID': response.id,
          'Nombre Completo': response.full_name || '',
          'Identificación': response.identification || '',
          'Fecha de Retiro': response.exit_date || '',
          'Tiempo en Siigo': response.time_at_siigo || '',
          'Área': response.area || '',
          'País': response.country || '',
          'Último Líder': response.last_leader || '',
          'Fecha de Respuesta': response.created_at ? new Date(response.created_at).toLocaleDateString('es-ES') : ''
        };

        // Agregar respuestas con títulos de preguntas
        if (response.all_responses) {
          let allResponses = response.all_responses;
          if (typeof allResponses === 'string') {
            try { allResponses = JSON.parse(allResponses); } catch (e) { allResponses = {}; }
          }

          // Agregar cada pregunta General en orden
          questionsGeneral.forEach(q => {
            const key = `q${q.number}`;
            const title = q.question;
            rowData[title] = allResponses[key] || '';
          });
        }
        return rowData;
      });

      const generalSheet = XLSX.utils.json_to_sheet(generalData);

      // Ajustar anchos de columna
      const generalColWidths = Object.keys(generalData[0] || {}).map(key => ({
        wch: Math.min(Math.max(key.length, 15), 60)
      }));
      generalSheet['!cols'] = generalColWidths;

      XLSX.utils.book_append_sheet(workbook, generalSheet, 'General');
    }

    // ========== HOJA CONSOLIDADA (TODAS) ==========
    const allData = responses.map(response => {
      const area = response.area || 'General';
      const questions = area === 'Sales' ? questionsSales : questionsGeneral;

      const rowData = {
        'ID': response.id,
        'Nombre Completo': response.full_name || '',
        'Identificación': response.identification || '',
        'Tipo Formulario': area === 'Sales' ? 'Ventas (27 preguntas)' : 'General (17 preguntas)',
        'Fecha de Retiro': response.exit_date || '',
        'Tiempo en Siigo': response.time_at_siigo || '',
        'Área': response.area || '',
        'País': response.country || '',
        'Último Líder': response.last_leader || '',
        'Fecha de Respuesta': response.created_at ? new Date(response.created_at).toLocaleDateString('es-ES') : ''
      };

      // Agregar respuestas
      if (response.all_responses) {
        let allResponses = response.all_responses;
        if (typeof allResponses === 'string') {
          try { allResponses = JSON.parse(allResponses); } catch (e) { allResponses = {}; }
        }

        questions.forEach(q => {
          const key = `q${q.number}`;
          const title = `P${q.number}. ${q.question}`;
          rowData[title] = allResponses[key] || '';
        });
      }
      return rowData;
    });

    const allSheet = XLSX.utils.json_to_sheet(allData);

    // Ajustar anchos de columna para hoja consolidada
    if (allData.length > 0) {
      const allColWidths = Object.keys(allData[0]).map(key => ({
        wch: Math.min(Math.max(key.length, 15), 60)
      }));
      allSheet['!cols'] = allColWidths;
    }

    XLSX.utils.book_append_sheet(workbook, allSheet, 'Todas las Respuestas');

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers de respuesta
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `entrevistas_retiro_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

    console.log(`📊 Excel exportado: ${responses.length} respuestas (${salesResponses.length} ventas, ${generalResponses.length} general)`);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    res.status(500).json({
      error: 'Error generando exportación Excel',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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