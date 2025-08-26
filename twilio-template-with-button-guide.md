# 📋 Guía: Crear Plantilla de WhatsApp con Botón en Twilio

## Paso 1: Configuración del Botón en Twilio Console

### En la sección que muestras en tu pantalla:

1. **Type of action**: Selecciona `Visit Website`

2. **Button Text**: Escribe `Iniciar Encuesta` o `Completar Encuesta`
   - Máximo 20 caracteres
   - Evita emojis en el botón (pueden no ser soportados)

3. **Website URL**: 
   - Pon la URL base: `https://www.siigo.digital/?user=`
   - NO incluyas el ID aquí, se agregará dinámicamente
   - Twilio permite agregar UNA variable al final de la URL

4. Click en **Add button**

## Paso 2: Contenido de la Plantilla

### Header (Opcional)
```
Encuesta de Salida - Siigo
```

### Body
```
Hola {{1}},

Esperamos que te encuentres bien. Como parte de nuestro proceso de mejora continua en Siigo, nos gustaría conocer tu experiencia trabajando con nosotros.

Tu opinión es muy valiosa para nosotros. La encuesta toma aproximadamente 5-10 minutos y tus respuestas serán tratadas de forma confidencial.

¡Gracias por tu tiempo y por haber sido parte del equipo Siigo!

Atentamente,
Equipo de Recursos Humanos
```

### Footer (Opcional)
```
Siigo - Mejorando continuamente
```

## Paso 3: Variables de la Plantilla

- **{{1}}**: Nombre del empleado (first_name)
- **Variable del botón**: ID del usuario (se agrega al final de la URL)

## Paso 4: Categoría de la Plantilla

Selecciona **UTILITY** porque:
- Es una encuesta transaccional post-empleo
- No es marketing promocional
- Tiene un propósito específico de recolección de feedback

## Paso 5: Enviar para Aprobación

1. Revisa que todo esté correcto
2. Click en **Submit for approval**
3. Espera 1-24 horas para aprobación de WhatsApp

## Paso 6: Obtener el Content SID

Una vez aprobada, obtendrás un Content SID como: `HXb1234567890abcdef`

## 📝 Notas Importantes

### URL Dinámica
- La URL base debe terminar SIN el parámetro
- Twilio agregará automáticamente el parámetro al final
- Ejemplo: 
  - URL base: `https://www.siigo.digital/?user=`
  - Twilio agrega: `123` (el ID)
  - URL final: `https://www.siigo.digital/?user=123`

### Limitaciones
- Solo UNA variable puede agregarse a la URL del botón
- El texto del botón NO puede tener variables
- La URL debe ser HTTPS

## Ejemplo de Plantilla Completa

```
╔════════════════════════════════════════╗
║      Encuesta de Salida - Siigo       ║
╠════════════════════════════════════════╣
║                                        ║
║ Hola Daniel,                          ║
║                                        ║
║ Esperamos que te encuentres bien.     ║
║ Como parte de nuestro proceso de      ║
║ mejora continua en Siigo, nos         ║
║ gustaría conocer tu experiencia       ║
║ trabajando con nosotros.              ║
║                                        ║
║ Tu opinión es muy valiosa para        ║
║ nosotros. La encuesta toma            ║
║ aproximadamente 5-10 minutos y tus    ║
║ respuestas serán tratadas de forma    ║
║ confidencial.                         ║
║                                        ║
║ ¡Gracias por tu tiempo y por haber   ║
║ sido parte del equipo Siigo!          ║
║                                        ║
║ Atentamente,                          ║
║ Equipo de Recursos Humanos            ║
║                                        ║
║ ┌──────────────────────────────────┐ ║
║ │     🔗 Iniciar Encuesta          │ ║
║ └──────────────────────────────────┘ ║
║                                        ║
║ Siigo - Mejorando continuamente        ║
╚════════════════════════════════════════╝
```

## Alternativa: Plantilla para Reenvío/Disculpas

Si necesitas una plantilla para los casos de reenvío:

### Body
```
Hola {{1}}, disculpas por contactarte nuevamente 🙏

Lamentamos informarte que por un error técnico se perdió tu respuesta anterior de la entrevista de retiro.

Sabemos que ya dedicaste tu tiempo a completarla y entendemos si esto es incómodo.

¿Nos ayudarías completando nuevamente la encuesta? No toma más de 5 minutos.

Realmente valoramos tu feedback para seguir mejorando como organización.
```

### Button Text
```
Retomar Encuesta
```