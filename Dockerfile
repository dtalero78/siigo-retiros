# Usar Node.js LTS como imagen base
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias (usar npm install en lugar de npm ci para resolver conflictos)
RUN npm install --only=production

# Copiar el código de la aplicación
COPY . .

# Forzar rebuild - cambiar este número para invalidar caché
ENV CACHE_BUST=1

# Crear directorios necesarios antes de cambiar de usuario
RUN mkdir -p data
RUN mkdir -p temp
RUN mkdir -p uploads

# Inicializar las bases de datos
RUN node scripts/init-all.js

# Crear usuarios no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001 -G nodejs

# Cambiar permisos de los directorios necesarios
RUN chown -R nextjs:nodejs /app/data
RUN chown -R nextjs:nodejs /app/temp
RUN chown -R nextjs:nodejs /app/uploads
RUN chmod 755 /app/data /app/temp /app/uploads

# Cambiar a usuario no-root
USER nextjs

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]