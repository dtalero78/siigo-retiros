# Instrucciones para Iniciar Conversación WhatsApp

## Para probar el envío de mensajes sin plantilla:

### 1. Desde el teléfono del destinatario:
- Abre WhatsApp
- Agrega el número: **+1 555 819 2172**
- Envía cualquier mensaje (ej: "Hola", "Test", etc.)

### 2. Esto activa una "sesión de 24 horas"
Durante este período puedes:
- Enviar mensajes de texto libre (sin plantilla)
- Enviar múltiples mensajes
- No hay restricciones de contenido

### 3. Para verificar que la sesión está activa:
Ejecuta:
```bash
node send-test-whatsapp.js 573153369631
```

## Para envío masivo (sin interacción previa):

**DEBES crear plantillas aprobadas en Meta Business:**

1. Ve a https://business.facebook.com
2. Selecciona tu WhatsApp Business Account
3. Ve a "Plantillas de mensaje"
4. Crea una plantilla tipo:

```
Nombre: encuesta_salida
Categoría: UTILITY
Idioma: es

Contenido:
Hola {{1}},

Como parte de nuestro proceso de mejora continua en Siigo Cultura, nos gustaría conocer tu experiencia trabajando con nosotros.

Te invitamos a completar nuestra encuesta de salida:
{{2}}

Tu opinión es confidencial y muy valiosa.

Gracias,
Equipo de Talento Humano
```

5. Espera aprobación (24-48 horas)
6. La plantilla aparecerá en Twilio automáticamente

## Estado actual:
- ✅ Número WhatsApp Business aprobado: +15558192172
- ✅ Nombre verificado: Siigo Cultura
- ❌ Plantillas: No hay plantillas aprobadas para este número
- ⏳ Solución: Crear plantillas en Meta Business