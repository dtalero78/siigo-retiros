# Códigos de Error de Twilio WhatsApp

## Error 63049
Este error indica que el número de WhatsApp Business no está correctamente configurado o hay un problema con la plantilla.

### Posibles causas:
1. El número de WhatsApp Business no está completamente activado
2. La plantilla no está asociada correctamente con el número
3. Problema con la configuración del WhatsApp Sender en Twilio

## Error 63016
La plantilla no está aprobada o no existe para el número especificado.

## Error 63007
El usuario debe primero enviar un mensaje al número de WhatsApp.

## Error 63003
El número de destino no tiene WhatsApp activo.

## Solución para Error 63049:

1. **Verificar en Twilio Console:**
   - Ve a Messaging > Senders > WhatsApp senders
   - Verifica que el número esté "Connected"
   - Verifica que el Business Profile esté completo

2. **Verificar en Meta Business:**
   - Confirma que el número esté activo
   - Verifica que la plantilla esté aprobada para ese número específico

3. **Posible problema:**
   - El número +15558192172 parece ser un número de prueba/sandbox
   - Para producción, necesitas un número real aprobado por Meta