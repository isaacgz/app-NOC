#!/bin/bash

# ============================================================
# InfluxDB Setup Script for NOC System
# ============================================================
# Este script configura InfluxDB 2.x para el sistema de monitoreo
# - Crea organización
# - Crea bucket
# - Genera token de autenticación
# ============================================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
INFLUX_ORG="${INFLUX_ORG:-noc-monitoring}"
INFLUX_BUCKET="${INFLUX_BUCKET:-service-metrics}"
INFLUX_URL="${INFLUX_URL:-http://localhost:8086}"
INFLUX_USERNAME="${INFLUX_USERNAME:-admin}"
INFLUX_PASSWORD="${INFLUX_PASSWORD:-admin123456}"
INFLUX_RETENTION="${INFLUX_RETENTION:-30d}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    🔧 InfluxDB Setup for NOC System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================
# 1. Verificar si InfluxDB está instalado
# ============================================================
echo -e "${YELLOW}📦 Checking InfluxDB installation...${NC}"

if ! command -v influx &> /dev/null; then
    echo -e "${RED}❌ InfluxDB CLI not found!${NC}"
    echo ""
    echo "Please install InfluxDB 2.x first:"
    echo ""
    echo "On macOS (Homebrew):"
    echo "  brew install influxdb"
    echo ""
    echo "On Ubuntu/Debian:"
    echo "  wget -q https://repos.influxdata.com/influxdata-archive_compat.key"
    echo "  echo '23a1c8836f0afc5ed24e0486339d7cc8f6790b83886c4c96995b88a061c5bb5d influxdata-archive_compat.key' | sha256sum -c"
    echo "  cat influxdata-archive_compat.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null"
    echo "  echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg] https://repos.influxdata.com/debian stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list"
    echo "  sudo apt-get update && sudo apt-get install influxdb2"
    echo ""
    echo "On Docker:"
    echo "  docker run -d -p 8086:8086 \\"
    echo "    -v \$PWD/influxdb-data:/var/lib/influxdb2 \\"
    echo "    --name influxdb influxdb:2.7"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ InfluxDB CLI found${NC}"

# ============================================================
# 2. Verificar si InfluxDB está corriendo
# ============================================================
echo -e "${YELLOW}🔍 Checking if InfluxDB is running...${NC}"

if ! curl -s ${INFLUX_URL}/ping > /dev/null 2>&1; then
    echo -e "${RED}❌ InfluxDB is not running at ${INFLUX_URL}${NC}"
    echo ""
    echo "Please start InfluxDB:"
    echo ""
    echo "On systemd:"
    echo "  sudo systemctl start influxdb"
    echo ""
    echo "On macOS (Homebrew):"
    echo "  brew services start influxdb"
    echo ""
    echo "On Docker:"
    echo "  docker start influxdb"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ InfluxDB is running${NC}"

# ============================================================
# 3. Setup inicial de InfluxDB (si es primera vez)
# ============================================================
echo -e "${YELLOW}🔧 Setting up InfluxDB...${NC}"

# Verificar si ya está inicializado
if curl -s ${INFLUX_URL}/api/v2/setup | grep -q '"allowed":false'; then
    echo -e "${BLUE}ℹ️  InfluxDB already initialized${NC}"
else
    echo -e "${YELLOW}📝 Performing initial setup...${NC}"

    # Setup inicial
    influx setup \
        --username ${INFLUX_USERNAME} \
        --password ${INFLUX_PASSWORD} \
        --org ${INFLUX_ORG} \
        --bucket ${INFLUX_BUCKET} \
        --retention ${INFLUX_RETENTION} \
        --force

    echo -e "${GREEN}✅ Initial setup completed${NC}"
fi

# ============================================================
# 4. Crear/Verificar organización
# ============================================================
echo -e "${YELLOW}🏢 Checking organization...${NC}"

ORG_EXISTS=$(influx org list --name ${INFLUX_ORG} 2>/dev/null | grep -c ${INFLUX_ORG} || echo "0")

if [ "$ORG_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}📝 Creating organization: ${INFLUX_ORG}${NC}"
    influx org create --name ${INFLUX_ORG}
    echo -e "${GREEN}✅ Organization created${NC}"
else
    echo -e "${BLUE}ℹ️  Organization already exists${NC}"
fi

# ============================================================
# 5. Crear/Verificar bucket
# ============================================================
echo -e "${YELLOW}🪣 Checking bucket...${NC}"

BUCKET_EXISTS=$(influx bucket list --org ${INFLUX_ORG} --name ${INFLUX_BUCKET} 2>/dev/null | grep -c ${INFLUX_BUCKET} || echo "0")

if [ "$BUCKET_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}📝 Creating bucket: ${INFLUX_BUCKET}${NC}"
    influx bucket create \
        --name ${INFLUX_BUCKET} \
        --org ${INFLUX_ORG} \
        --retention ${INFLUX_RETENTION}
    echo -e "${GREEN}✅ Bucket created (retention: ${INFLUX_RETENTION})${NC}"
else
    echo -e "${BLUE}ℹ️  Bucket already exists${NC}"
fi

# ============================================================
# 6. Crear token de autenticación
# ============================================================
echo -e "${YELLOW}🔑 Creating authentication token...${NC}"

TOKEN=$(influx auth create \
    --org ${INFLUX_ORG} \
    --read-bucket ${INFLUX_BUCKET} \
    --write-bucket ${INFLUX_BUCKET} \
    --description "NOC System Token ($(date +%Y-%m-%d))" \
    --json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to create token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token created successfully${NC}"

# ============================================================
# 7. Generar archivo .env
# ============================================================
echo ""
echo -e "${YELLOW}📝 Generating .env configuration...${NC}"

ENV_FILE="../.env"

# Crear backup si existe
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    echo -e "${BLUE}ℹ️  Existing .env backed up${NC}"
fi

# Actualizar o crear .env
cat > "$ENV_FILE" <<EOF
# ============================================================
# NOC System - Environment Variables
# Generated: $(date)
# ============================================================

# ============================================================
# InfluxDB Configuration (FASE 6)
# ============================================================

# Habilitar InfluxDB
INFLUXDB_ENABLED=true

# URL del servidor InfluxDB
INFLUXDB_URL=${INFLUX_URL}

# Token de autenticación
INFLUXDB_TOKEN=${TOKEN}

# Organización en InfluxDB
INFLUXDB_ORG=${INFLUX_ORG}

# Bucket para métricas
INFLUXDB_BUCKET=${INFLUX_BUCKET}

# ============================================================
# Server Configuration
# ============================================================
PORT=3000
NODE_ENV=development

# ============================================================
# Email Configuration (Configure según necesites)
# ============================================================
# MAILER_SERVICE=gmail
# MAILER_EMAIL=your-email@gmail.com
# MAILER_SECRET_KEY=your-app-password
EOF

echo -e "${GREEN}✅ .env file created/updated${NC}"

# ============================================================
# 8. Resumen
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}    ✅ InfluxDB Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo -e "  URL:          ${INFLUX_URL}"
echo -e "  Organization: ${INFLUX_ORG}"
echo -e "  Bucket:       ${INFLUX_BUCKET}"
echo -e "  Retention:    ${INFLUX_RETENTION}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Token saved to .env file${NC}"
echo -e "${YELLOW}   Keep this file secure and don't commit it to git!${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Review the .env file"
echo -e "  2. Start your NOC system: ${BLUE}npm run dev${NC}"
echo -e "  3. Check InfluxDB UI: ${BLUE}${INFLUX_URL}${NC}"
echo ""
echo -e "${GREEN}To view metrics in InfluxDB:${NC}"
echo -e "  ${BLUE}influx query 'from(bucket:\"${INFLUX_BUCKET}\") |> range(start: -1h)'${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
