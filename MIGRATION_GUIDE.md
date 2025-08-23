# 🚀 Guía de Migración a PostgreSQL - Siigo Retiros

## 📋 Pasos para migrar de SQLite a PostgreSQL en DigitalOcean

### 1️⃣ **Crear la base de datos en DigitalOcean**

1. Ve a tu panel de DigitalOcean
2. Click en **"Create" → "Databases"**
3. Selecciona:
   - **Engine:** PostgreSQL
   - **Plan:** Development ($7-15/mes para empezar)
   - **Region:** La más cercana a tus usuarios
4. Click en **"Create Database Cluster"**
5. Espera 5 minutos a que se cree

### 2️⃣ **Obtener las credenciales**

1. En tu panel de DigitalOcean, ve a tu base de datos
2. Click en **"Connection Details"**
3. Copia la **Connection String** (URL completa)
   - Se verá algo así: `postgresql://doadmin:password@db-xxx.ondigitalocean.com:25060/defaultdb?sslmode=require`

### 3️⃣ **Hacer backup de tus datos actuales**

```bash
# Hacer backup de los datos actuales
node scripts/backup-databases.js
```

### 4️⃣ **Configurar las variables de entorno**

Edita tu archivo `.env`:

```env
# Cambiar tipo de base de datos
DATABASE_TYPE=postgres

# Agregar la URL de PostgreSQL (la que copiaste de DigitalOcean)
DATABASE_URL=postgresql://doadmin:xxxxx@db-postgresql-nyc1-xxxxx.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### 5️⃣ **Migrar los datos**

```bash
# Ejecutar el script de migración
node scripts/migrate-to-postgres.js
```

Este script:
- Conectará a ambas bases de datos
- Copiará todas las respuestas
- Copiará todos los usuarios
- Mantendrá los IDs y relaciones
- Mostrará el progreso en tiempo real

### 6️⃣ **Verificar la migración**

```bash
# Reiniciar el servidor con PostgreSQL
npm run restart

# Verificar en el navegador
# - Ve a http://localhost:3000/admin
# - Verifica que aparezcan todas las respuestas
# - Ve a http://localhost:3000/users
# - Verifica que aparezcan todos los usuarios
```

### 7️⃣ **Hacer deploy en DigitalOcean App Platform**

1. Ve a tu App en DigitalOcean
2. Settings → App-Level Environment Variables
3. Agrega:
   - `DATABASE_TYPE` = `postgres`
   - `DATABASE_URL` = (tu connection string)
4. Click en **"Deploy"**

## 🔄 **Rollback (si algo sale mal)**

Si necesitas volver a SQLite:

```bash
# En tu .env, cambia:
DATABASE_TYPE=sqlite

# Reinicia el servidor
npm run restart
```

Los datos de SQLite seguirán ahí intactos.

## 📊 **Comparación SQLite vs PostgreSQL**

| Característica | SQLite | PostgreSQL |
|---------------|--------|------------|
| Persistencia en App Platform | ❌ Se pierde en cada deploy | ✅ Persistente |
| Backups automáticos | ❌ Manual | ✅ Diarios automáticos |
| Concurrencia | ⚠️ Limitada | ✅ Excelente |
| Escalabilidad | ❌ No escalable | ✅ Muy escalable |
| Costo | ✅ Gratis | 💰 $7-15/mes inicial |

## 🆘 **Troubleshooting**

### Error: "Connection refused"
- Verifica que la URL de la base de datos sea correcta
- Asegúrate de que tu IP esté en la whitelist (DigitalOcean → Databases → Settings → Trusted Sources)

### Error: "SSL required"
- Asegúrate de que la URL tenga `?sslmode=require` al final

### Los datos no aparecen después de migrar
1. Verifica los logs del script de migración
2. Conecta directamente a PostgreSQL:
   ```bash
   psql YOUR_DATABASE_URL
   \dt  # Ver tablas
   SELECT COUNT(*) FROM responses;
   SELECT COUNT(*) FROM users;
   ```

## ✅ **Checklist de migración**

- [ ] Backup de datos SQLite creado
- [ ] Base de datos PostgreSQL creada en DigitalOcean
- [ ] Variables de entorno configuradas
- [ ] Script de migración ejecutado exitosamente
- [ ] Datos verificados en PostgreSQL
- [ ] App funcionando con PostgreSQL localmente
- [ ] Variables de entorno agregadas en App Platform
- [ ] Deploy exitoso en producción
- [ ] Verificación final en producción

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs: `npm run dev` y mira los mensajes de consola
2. Verifica la conexión: El script te dirá si se conecta correctamente
3. Revisa este archivo por si olvidaste algún paso

¡Buena suerte con la migración! 🚀