# 🚨 PROBLEMA IDENTIFICADO: Plantilla configurada como Marketing

## ❌ El Problema

Tu plantilla (HXd85118b65ad3e326a4b6a4531b578bf2) está configurada como **MARKETING** cuando debería ser **UTILITY**.

### Diferencias clave:

| Marketing | Utility |
|-----------|---------|
| Para promociones y publicidad | Para notificaciones transaccionales |
| Requiere opt-in explícito | Permitido para usuarios existentes |
| Más restricciones | Menos restricciones |
| Puede ser bloqueado fácilmente | Mayor tasa de entrega |
| **NO adecuado para encuestas de salida** | **✅ CORRECTO para encuestas de salida** |

## 🛠️ SOLUCIÓN: Crear Nueva Plantilla como UTILITY

### Paso 1: Ir a Twilio Console
1. Ve a: https://console.twilio.com
2. Navega a: **Messaging > Content Editor**
3. Click en **"Create new template"**

### Paso 2: Configurar la Nueva Plantilla

#### Configuración Principal:
- **Canal**: WhatsApp
- **Categoría**: **UTILITY** ⚠️ (¡MUY IMPORTANTE!)
- **Idioma**: Spanish (es)
- **Nombre**: exit_survey_invitation_utility

#### Contenido del Mensaje:

**Body:**
```
Hola {{1}},

Como parte de nuestro compromiso con la mejora continua en Siigo, te invitamos a completar tu formulario de retiro.

Tu opinión es muy valiosa para nosotros. La encuesta toma aproximadamente 5-10 minutos y tus respuestas serán tratadas de forma confidencial.

¡Gracias por tu tiempo y por haber sido parte del equipo Siigo!

Atentamente,
Equipo de Talento Humano
Siigo
```

#### Configuración del Botón:
- **Type**: Call to Action (CTA)
- **Action**: Visit Website
- **Button Text**: `Iniciar Encuesta`
- **URL**: `https://www.siigo.digital/?user={{2}}`

⚠️ **NOTA**: En algunas interfaces de Twilio:
- La URL base sería: `https://www.siigo.digital/?user=`
- Y la variable {{2}} se agregaría automáticamente al final

### Paso 3: Variables de la Plantilla
- **{{1}}**: Nombre del empleado (ej: "Daniel")
- **{{2}}**: ID del usuario en la base de datos (ej: "466")

### Paso 4: Enviar para Aprobación
1. Revisa todo esté correcto
2. **Asegúrate que diga UTILITY, no Marketing**
3. Click en **Submit for approval**
4. Espera 1-24 horas para aprobación

## 📊 Por qué UTILITY es Correcto

Las encuestas de salida son comunicaciones **transaccionales** porque:
- Son parte del proceso de offboarding
- Tienen un propósito operacional específico
- No son promocionales ni publicitarias
- Se envían a empleados/ex-empleados con relación existente

## 🚀 Mientras Esperas la Aprobación

### Alternativa Temporal:
Si tienes una plantilla UTILITY ya aprobada (sin botón), úsala temporalmente:

```javascript
// Usar plantilla UTILITY simple mientras se aprueba la nueva
const UTILITY_TEMPLATE_SID = 'HXxxxxx'; // Tu plantilla utility existente
```

## 📝 Checklist Final

- [ ] La nueva plantilla es categoría **UTILITY**
- [ ] El mensaje tiene tono profesional/transaccional
- [ ] Variables configuradas: {{1}} para nombre, {{2}} para ID
- [ ] Botón configurado con URL correcta
- [ ] Plantilla enviada para aprobación

## 💡 Importante

**NO uses plantillas de Marketing para:**
- Encuestas de empleados
- Comunicaciones de RRHH
- Notificaciones transaccionales
- Procesos internos de la empresa

Estos SIEMPRE deben ser **UTILITY**.