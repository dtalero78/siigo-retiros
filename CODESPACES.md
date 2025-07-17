# 🚀 Guía para GitHub Codespaces

Esta guía te ayudará a probar la aplicación en GitHub Codespaces antes del deploy a Digital Ocean.

## 📋 Pasos para probar en Codespaces

### 1. 🔧 Configuración inicial

Primero, asegúrate de tener estos archivos en tu repositorio:

```
tu-repo/
├── .devcontainer/
│   └── devcontainer.json    # ← Este archivo es clave
├── package.json
├── server.js
├── database/
├── public/
└── scripts/
```

### 2. 🌐 Abrir en Codespaces

1. Ve a tu repositorio en GitHub
2. Clic en el botón verde **"<> Code"**
3. Selecciona la pestaña **"Codespaces"**
4. Clic en **"Create codespace on main"**

### 3. ⏳ Esperar la configuración automática

Codespaces hará automáticamente:
- ✅ Instalar Node.js 18
- ✅ Ejecutar `npm install`
- ✅ Ejecutar `npm run init-db`
- ✅ Configurar el puerto 3000

### 4. 🚀 Ejecutar la aplicación

Una vez que el codespace esté listo:

```bash
# Verificar que todo esté instalado
node --version
npm --version

# Ejecutar en modo desarrollo
npm run dev
```

### 5. 🌍 Acceder a la aplicación

- El puerto 3000 se abrirá automáticamente en el navegador
- Si no se abre automáticamente:
  1. Ve a la pestaña **"PORTS"** en la terminal
  2. Clic en el enlace del puerto 3000
  3. O usa el botón **"Open in Browser"**

## 🔗 URLs en Codespaces

Una vez ejecutándose, tendrás acceso a:

```
https://[CODESPACE-NAME]-3000.app.github.dev/           # Formulario principal
https://[CODESPACE-NAME]-3000.app.github.dev/admin      # Panel de administración
https://[CODESPACE-NAME]-3000.app.github.dev/api/questions  # API de preguntas
```

## 🧪 Cómo probar la aplicación

### 1. **Probar el formulario principal:**
- Ve a la URL principal
- Completa algunas respuestas de prueba
- Verifica que todas las preguntas funcionen
- Envía el formulario

### 2. **Probar el panel de administración:**
- Ve a `/admin`
- Verifica las estadísticas
- Mira la tabla de respuestas
- Prueba la vista detallada de una respuesta
- Prueba la exportación a CSV

### 3. **Probar la API:**
- Ve a `/api/questions` para ver las preguntas en JSON
- Ve a `/api/responses` para ver las respuestas

## 🛠️ Comandos útiles en Codespaces

```bash
# Ver logs en tiempo real
npm run dev

# Reiniciar la base de datos (si necesitas limpiar datos de prueba)
rm -rf data/responses.db
npm run init-db

# Verificar que la base de datos funcione
ls -la data/

# Ver el contenido de la base de datos (opcional)
sqlite3 data/responses.db ".tables"
sqlite3 data/responses.db "SELECT * FROM responses;"

# Instalar dependencias adicionales si es necesario
npm install

# Verificar puertos abiertos
netstat -tlnp | grep 3000
```

## 📊 Datos de prueba sugeridos

Para probar completamente, crea al menos 2-3 respuestas con:

### Respuesta 1 (Positiva):
- Nombre: Juan Pérez
- Área: Tech
- País: Colombia
- Calificación: 8-9
- Recomendaría: SÍ
- Regresaría: SÍ

### Respuesta 2 (Neutral):
- Nombre: María García
- Área: Marketing
- País: México
- Calificación: 5-6
- Recomendaría: NO
- Regresaría: SÍ

### Respuesta 3 (Negativa):
- Nombre: Carlos López
- Área: Sales
- País: Perú
- Calificación: 2-3
- Recomendaría: NO
- Regresaría: NO

## 🐛 Troubleshooting en Codespaces

### **La aplicación no inicia:**
```bash
# Verificar dependencias
npm install
npm run init-db
npm run dev
```

### **Puerto no disponible:**
```bash
# El puerto 3000 debería abrirse automáticamente
# Si no funciona, ir a la pestaña PORTS y hacer clic en el enlace
```

### **Base de datos no funciona:**
```bash
# Recrear base de datos
rm -rf data/
mkdir data
npm run init-db
```

### **Error de permisos:**
```bash
# En Codespaces esto no debería pasar, pero si ocurre:
sudo chown -R $(whoami) ./data
```

## ✅ Checklist de pruebas

Antes de pasar a Digital Ocean, verifica:

- [ ] El formulario carga correctamente
- [ ] Todas las preguntas se muestran (18 total)
- [ ] Las validaciones funcionan
- [ ] Se pueden enviar respuestas
- [ ] El panel admin muestra estadísticas
- [ ] Se pueden ver respuestas individuales
- [ ] La exportación CSV funciona
- [ ] El diseño se ve bien en móvil (usar DevTools)

## 🔄 Ciclo de desarrollo

1. **Hacer cambios** en el código
2. **Guardar** (auto-save está activado)
3. **La aplicación se reinicia automáticamente** (nodemon)
4. **Refrescar el navegador** para ver cambios

## 🎯 Próximo paso: Digital Ocean

Una vez que todo funcione perfectamente en Codespaces:

1. Hacer commit de cualquier cambio
2. Push al repositorio
3. Seguir la guía de DEPLOYMENT.md para Digital Ocean

## 💡 Tips adicionales

- **VS Code Extensions**: Ya están preconfiguradas las extensiones útiles
- **Terminal integrada**: Usa Ctrl+` para abrir/cerrar
- **Live reload**: Los cambios se reflejan automáticamente
- **Debugging**: Puedes usar VS Code debugger si necesitas

¡Disfruta probando tu aplicación en Codespaces! 🎉