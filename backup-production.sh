#!/bin/bash

# Script para hacer backup de datos de producción
# Este script debe ejecutarse ANTES de hacer push para preservar los datos actuales

echo "🔄 Iniciando backup de datos de producción..."

# Crear directorio de backups con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_$TIMESTAMP"
mkdir -p $BACKUP_DIR

echo "📁 Creando directorio de backup: $BACKUP_DIR"

# Función para descargar datos via curl
download_data() {
    local url=$1
    local output_file=$2
    echo "  ⬇️  Descargando $output_file..."
    curl -s "$url" -o "$BACKUP_DIR/$output_file"
    if [ $? -eq 0 ]; then
        echo "  ✅ $output_file descargado exitosamente"
    else
        echo "  ❌ Error descargando $output_file"
    fi
}

# URLs de producción
PROD_URL="https://www.siigo.digital"

echo ""
echo "📥 Descargando datos de producción desde $PROD_URL"
echo ""

# Descargar respuestas
download_data "$PROD_URL/api/export/responses" "responses_production.csv"

# Descargar usuarios
download_data "$PROD_URL/api/export/users" "users_production.csv"

# Descargar datos JSON para respaldo completo
echo ""
echo "📊 Descargando datos JSON completos..."
curl -s "$PROD_URL/api/responses" -o "$BACKUP_DIR/responses_complete.json"
echo "  ✅ Datos JSON descargados"

# Contar registros
echo ""
echo "📈 Resumen del backup:"
echo "-------------------"
if [ -f "$BACKUP_DIR/responses_production.csv" ]; then
    RESPONSE_COUNT=$(wc -l < "$BACKUP_DIR/responses_production.csv")
    echo "  • Respuestas: $((RESPONSE_COUNT - 1)) registros"
fi

if [ -f "$BACKUP_DIR/users_production.csv" ]; then
    USER_COUNT=$(wc -l < "$BACKUP_DIR/users_production.csv")
    echo "  • Usuarios: $((USER_COUNT - 1)) registros"
fi

echo ""
echo "✅ Backup completado en: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANTE: Guarda este backup antes de hacer push"
echo "📌 Para restaurar estos datos después, usa: npm run restore-backup $BACKUP_DIR"