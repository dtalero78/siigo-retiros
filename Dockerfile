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

# Crear directorio para la base de datos
RUN mkdir -p data

# Inicializar la base de datos
RUN npm run init-db

# Exponer el puerto
EXPOSE 3000

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar permisos del directorio data
RUN chown -R nextjs:nodejs /app/data

# Cambiar a usuario no-root
USER nextjs

# Comando para iniciar la aplicación
CMD ["npm", "start"]