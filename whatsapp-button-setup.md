# Configuración de Botones Interactivos en WhatsApp con Twilio

## 🎯 Objetivo
Reemplazar el link directo (variable {{2}}) con un botón interactivo CTA (Call To Action) que abra el formulario de encuesta.

## 📋 Tipos de Botones Soportados

### 1. **Botón CTA con URL** (Recomendado)
- Abre una URL directamente al presionarlo
- Texto del botón: máximo 20 caracteres
- URL: debe ser HTTPS
- Formato del link: `https://www.siigo.digital/?user={id}`

### 2. **Quick Reply Buttons**
- Para respuestas rápidas predefinidas
- No aplica para nuestro caso de abrir URLs

## 🚀 Implementación

### Servicio Principal
```javascript
// services/twilio-interactive.js
sendSurveyInvitationWithButton(user)
```

### Estructura del Mensaje con Botón
```javascript
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Mensaje principal sin el link"
    },
    "action": {
      "buttons": [{
        "type": "url",
        "text": "Iniciar Encuesta 📝",
        "url": "https://www.siigo.digital/?user=123"
      }]
    }
  }
}
```

## 📱 Cómo se Ve en WhatsApp

1. **Mensaje Principal**: El texto de la invitación
2. **Botón Azul**: "Iniciar Encuesta 📝" (clickeable)
3. **Al presionar**: Abre el navegador con el formulario

## 🧪 Pruebas

### Comando de Prueba
```bash
# Invitación con botón
node test-interactive-button.js 3001234567 survey

# Mensaje de disculpas con botón
node test-interactive-button.js 3001234567 apology

# Mensaje personalizado
node test-interactive-button.js 3001234567 custom
```

## ⚙️ Configuración de Plantillas con Botones

### En Twilio Console:

1. Ve a **Messaging > Content Editor**
2. Crea nueva plantilla WhatsApp
3. Selecciona tipo: **Marketing** o **Utility**
4. Agrega componente de **Botón CTA**

### Ejemplo de Plantilla:
```
HEADER: Encuesta de Salida Siigo

BODY:
Hola {{1}},

Como parte de nuestro proceso de mejora continua, nos gustaría conocer tu experiencia trabajando con nosotros.

La encuesta toma aproximadamente 5-10 minutos y tus respuestas serán confidenciales.

FOOTER: Equipo de RRHH - Siigo

BUTTON:
Tipo: URL
Texto: Iniciar Encuesta
URL: Dinámica (se pasa al enviar)
```

## 🔧 Variables de Entorno Necesarias

```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+15558192172
TWILIO_MESSAGING_SERVICE_SID=MGxxxxx (opcional)
```

## 📊 Ventajas del Botón vs Link

1. **Mayor tasa de clics**: Los botones son más visibles
2. **Mejor UX**: Acción clara y directa
3. **Profesionalismo**: Se ve más oficial
4. **Tracking**: Mejor seguimiento de interacciones
5. **No se pierde**: El botón permanece visible

## ⚠️ Limitaciones

1. **Plantillas**: Para usuarios nuevos, necesitas plantilla aprobada
2. **Texto del botón**: Máximo 20 caracteres
3. **URL**: Debe ser HTTPS
4. **Sesión de 24h**: Después necesitas plantilla

## 🔍 Códigos de Error Comunes

- `63007`: Usuario no ha iniciado conversación
- `63016`: Plantilla no aprobada
- `21608`: Número no tiene WhatsApp

## 📈 Métricas a Monitorear

- Tasa de apertura del mensaje
- Tasa de clic en el botón
- Conversión (encuestas completadas)
- Tiempo de respuesta

## 🛠️ Integración con el Sistema Actual

Para integrar en el endpoint actual de envío masivo:

```javascript
// En server.js - Endpoint de envío masivo
const { sendSurveyInvitationWithButton } = require('./services/twilio-interactive');

// Reemplazar el envío actual con:
const result = await sendSurveyInvitationWithButton({
  id: user.id,
  phone: user.phone,
  first_name: user.first_name
});
```