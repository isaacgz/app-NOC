# 🔍 Guía de Monitoreo de Servicios - NOC System

## 📖 Tabla de Contenidos

- [Introducción](#introducción)
- [Inicio Rápido](#inicio-rápido)
- [Configuración de Servicios](#configuración-de-servicios)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Health Checks Avanzados](#health-checks-avanzados)
- [Interpretando los Resultados](#interpretando-los-resultados)
- [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Introducción

El sistema NOC (Network Operations Center) ahora incluye un sistema de monitoreo avanzado que te permite:

✅ **Monitorear múltiples servicios** simultáneamente
✅ **Medir tiempos de respuesta** en tiempo real
✅ **Validar contenido** de las respuestas
✅ **Detectar degradación** antes de caídas completas
✅ **Configurar alertas** para servicios críticos
✅ **Generar estadísticas** automáticas de disponibilidad

---

## 🚀 Inicio Rápido

### 1. Configura tus Servicios

Edita el archivo `config/services.json`:

```json
{
  "services": [
    {
      "id": "mi-api",
      "name": "Mi API",
      "url": "https://api.miempresa.com/health",
      "interval": "*/30 * * * * *",
      "critical": true,
      "enabled": true
    }
  ]
}
```

### 2. Inicia el Sistema

```bash
npm run dev
```

### 3. Observa los Resultados

El sistema automáticamente:
- ✅ Comenzará a monitorear tus servicios
- 📊 Mostrará estadísticas cada 60 segundos
- 💾 Guardará logs en `logs/`
- 🔔 Alertará cuando detecte problemas

---

## ⚙️ Configuración de Servicios

### Estructura Básica

```json
{
  "global": {
    "defaultTimeout": 5000,
    "enableDetailedLogs": false,
    "retryAttempts": 1,
    "retryDelay": 1000
  },
  "services": [
    {
      "id": "servicio-unico",
      "name": "Nombre Descriptivo",
      "url": "https://ejemplo.com",
      "interval": "*/30 * * * * *",
      "critical": false,
      "description": "Descripción opcional",
      "tags": ["tag1", "tag2"],
      "enabled": true,
      "healthCheck": {
        "method": "GET",
        "timeout": 3000,
        "expectedResponse": {
          "statusCode": 200,
          "maxResponseTime": 500
        }
      }
    }
  ]
}
```

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único del servicio |
| `name` | string | Nombre descriptivo para logs |
| `url` | string | URL completa a monitorear |
| `interval` | string | Intervalo en formato CRON |

### Campos Opcionales

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `critical` | boolean | `false` | Si es crítico, alertas son más visibles |
| `description` | string | - | Descripción del servicio |
| `tags` | string[] | `[]` | Tags para categorizar |
| `enabled` | boolean | `true` | Si está habilitado el monitoreo |
| `healthCheck` | object | - | Configuración avanzada de chequeo |

---

## 📅 Intervalos CRON

El campo `interval` usa formato CRON con 6 partes:

```
segundos minutos horas día-mes mes día-semana
```

### Ejemplos Comunes

| Descripción | Intervalo |
|-------------|-----------|
| Cada 5 segundos | `*/5 * * * * *` |
| Cada 30 segundos | `*/30 * * * * *` |
| Cada minuto | `0 * * * * *` |
| Cada 5 minutos | `0 */5 * * * *` |
| Cada 15 minutos | `0 */15 * * * *` |
| Cada hora | `0 0 * * * *` |
| Cada día a las 9 AM | `0 0 9 * * *` |

---

## 🔍 Health Checks Avanzados

### Configuración Básica

```json
{
  "healthCheck": {
    "method": "GET",
    "timeout": 3000
  }
}
```

### Validación de Código de Estado

```json
{
  "healthCheck": {
    "expectedResponse": {
      "statusCode": 200
    }
  }
}
```

### Múltiples Códigos Aceptables

```json
{
  "healthCheck": {
    "expectedResponse": {
      "acceptedStatusCodes": [200, 201, 204]
    }
  }
}
```

### Validación de Contenido

```json
{
  "healthCheck": {
    "expectedResponse": {
      "statusCode": 200,
      "bodyContains": "ok"
    }
  }
}
```

### Validación de Performance

```json
{
  "healthCheck": {
    "timeout": 5000,
    "expectedResponse": {
      "maxResponseTime": 500
    }
  }
}
```

**Nota:** Si el tiempo de respuesta excede `maxResponseTime`, el servicio se marca como "degradado" pero no como caído.

### Request POST con Autenticación

```json
{
  "healthCheck": {
    "method": "POST",
    "headers": {
      "Authorization": "Bearer TOKEN_AQUI",
      "Content-Type": "application/json"
    },
    "body": {
      "action": "health-check"
    },
    "expectedResponse": {
      "statusCode": 200,
      "bodyContains": "healthy"
    }
  }
}
```

### Chequeo Ligero (HEAD)

```json
{
  "healthCheck": {
    "method": "HEAD",
    "timeout": 2000
  }
}
```

**Ventaja:** No descarga el contenido, solo verifica que el servidor responda.

---

## 📊 Ejemplos de Uso

### Ejemplo 1: API de Producción (Crítica)

```json
{
  "id": "api-produccion",
  "name": "API Principal de Producción",
  "url": "https://api.miempresa.com/health",
  "interval": "*/10 * * * * *",
  "critical": true,
  "description": "API principal que usan los clientes",
  "tags": ["produccion", "critico", "api"],
  "enabled": true,
  "healthCheck": {
    "method": "GET",
    "timeout": 3000,
    "expectedResponse": {
      "statusCode": 200,
      "bodyContains": "ok",
      "maxResponseTime": 500
    }
  }
}
```

### Ejemplo 2: Base de Datos

```json
{
  "id": "postgres-db",
  "name": "PostgreSQL Database",
  "url": "https://db.miempresa.com/ping",
  "interval": "*/20 * * * * *",
  "critical": true,
  "description": "Base de datos principal",
  "tags": ["database", "critico"],
  "enabled": true,
  "healthCheck": {
    "method": "GET",
    "timeout": 5000,
    "expectedResponse": {
      "acceptedStatusCodes": [200, 204],
      "maxResponseTime": 1000
    }
  }
}
```

### Ejemplo 3: Servicio Externo

```json
{
  "id": "servicio-pago",
  "name": "Pasarela de Pagos",
  "url": "https://api.pasarela.com/status",
  "interval": "*/60 * * * * *",
  "critical": false,
  "description": "Servicio de procesamiento de pagos",
  "tags": ["externo", "pagos"],
  "enabled": true,
  "healthCheck": {
    "method": "GET",
    "timeout": 10000,
    "headers": {
      "API-Key": "tu-api-key-aqui"
    },
    "expectedResponse": {
      "statusCode": 200
    }
  }
}
```

### Ejemplo 4: Múltiples Ambientes

```json
{
  "services": [
    {
      "id": "api-dev",
      "name": "API Desarrollo",
      "url": "http://localhost:3000/health",
      "interval": "*/5 * * * * *",
      "critical": false,
      "tags": ["desarrollo", "local"],
      "enabled": true
    },
    {
      "id": "api-staging",
      "name": "API Staging",
      "url": "https://staging.api.com/health",
      "interval": "*/30 * * * * *",
      "critical": false,
      "tags": ["staging"],
      "enabled": true
    },
    {
      "id": "api-prod",
      "name": "API Producción",
      "url": "https://api.miempresa.com/health",
      "interval": "*/10 * * * * *",
      "critical": true,
      "tags": ["produccion", "critico"],
      "enabled": true
    }
  ]
}
```

---

## 📈 Interpretando los Resultados

### Consola

#### Inicio del Sistema

```
🚀 NOC System Starting...

📋 Loading monitoring configuration from: /path/to/config/services.json
✅ Configuration loaded successfully
📊 Total services: 3
✓ Enabled services: 3

  ✓ Google (google) - */30 * * * * * 🟢 NORMAL
  ✓ GitHub (github) - */45 * * * * * 🟢 NORMAL
  ✓ API Production (api-production) - */10 * * * * * 🔴 CRITICAL
```

#### Chequeos Exitosos

```
✅ Google - 145ms
✅ GitHub - 234ms
✅ API Production - 89ms
```

#### Chequeos Fallidos

```
⚠️ GitHub - Service GitHub validation failed: Expected status 200, got 503
🔴 CRITICAL API Production - Service API Production is DOWN: Request timeout
   URL: https://api.production.com/health
   Error: Request timeout
```

#### Estado Periódico (cada 60 segundos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             📊 CURRENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 Google
   Uptime: ✅ 100.00%
   Checks: 24/24
   Avg Response: 152ms
   Last Check: 2025-11-12T10:30:45.123Z

🟢 GitHub
   Uptime: ✅ 98.50%
   Checks: 197/200
   Avg Response: 245ms
   Last Check: 2025-11-12T10:30:50.456Z

🟢 API Production
   Uptime: ✅ 99.80%
   Checks: 499/500
   Avg Response: 95ms
   Last Check: 2025-11-12T10:30:55.789Z
```

### Archivos de Log

Los logs se guardan en:

```
logs/
├── logs-all.log      # Todos los eventos
├── logs-medium.log   # Servicios degradados
└── logs-high.log     # Servicios caídos (CRÍTICO)
```

#### Formato de Log

```json
{
  "level": "low",
  "message": "Service Google is UP - 145ms (200)",
  "origin": "check-service-advanced.ts",
  "createdAt": "2025-11-12T10:30:00.000Z",
  "responseTime": 145,
  "statusCode": 200,
  "serviceId": "google",
  "serviceName": "Google",
  "url": "https://google.com"
}
```

### Niveles de Severidad

| Nivel | Descripción | Color |
|-------|-------------|-------|
| `low` | Servicio funcionando correctamente | 🟢 Verde |
| `medium` | Servicio degradado (lento pero funcional) | 🟡 Amarillo |
| `high` | Servicio caído o con errores críticos | 🔴 Rojo |

---

## 🔧 Solución de Problemas

### Error: Configuration file not found

```
❌ Failed to start monitoring system: Configuration file not found: /path/to/config/services.json
```

**Solución:**
1. Verifica que existe `config/services.json`
2. O copia `config/services.example.json` a `config/services.json`

```bash
cp config/services.example.json config/services.json
```

### Error: Invalid JSON in configuration file

```
❌ Failed to start monitoring system: Invalid JSON in configuration file: Unexpected token
```

**Solución:**
1. Verifica que tu JSON esté bien formado
2. Usa un validador JSON online: https://jsonlint.com/
3. Revisa:
   - Comillas dobles (`"`) no simples (`'`)
   - Comas correctas entre elementos
   - No comas al final del último elemento

### Error: Invalid cron expression

```
Service at index 0: Invalid cron expression: */5. Expected 5 or 6 parts
```

**Solución:**
- Asegúrate de usar el formato completo de CRON
- Ejemplo correcto: `*/5 * * * * *` (6 partes)
- Ejemplo incorrecto: `*/5` (incompleto)

### Servicio siempre marca como "down" pero está funcionando

**Posibles causas:**

1. **Timeout muy corto**
   ```json
   "timeout": 1000  // Muy corto, intenta 5000
   ```

2. **Validación incorrecta**
   ```json
   "expectedResponse": {
     "bodyContains": "OK"  // Verifica el texto exacto
   }
   ```

3. **URL incorrecta**
   - Verifica la URL en tu navegador primero
   - Usa `curl` para probar: `curl -v https://tu-url.com`

### Servicios no se están monitoreando

**Verifica:**

1. **enabled = true**
   ```json
   "enabled": true
   ```

2. **Intervalo CRON válido**
   ```json
   "interval": "*/30 * * * * *"  // Debe tener 6 partes
   ```

3. **No hay errores de sintaxis en el JSON**

---

## 📝 Tips y Mejores Prácticas

### 1. Intervalos Recomendados

| Tipo de Servicio | Intervalo Sugerido |
|------------------|-------------------|
| APIs Críticas | `*/10 * * * * *` (cada 10 seg) |
| APIs Normales | `*/30 * * * * *` (cada 30 seg) |
| Servicios Externos | `*/60 * * * * *` (cada 60 seg) |
| Bases de Datos | `*/20 * * * * *` (cada 20 seg) |
| CDNs | `0 */5 * * * *` (cada 5 min) |

### 2. Timeouts Recomendados

```json
{
  "timeout": 3000,  // 3 segundos para APIs rápidas
  "timeout": 5000,  // 5 segundos para APIs normales
  "timeout": 10000  // 10 segundos para servicios externos
}
```

### 3. Usa Tags para Organizar

```json
{
  "tags": ["produccion", "critico", "api", "interna"]
}
```

Esto te permitirá filtrar y agrupar servicios en el futuro.

### 4. Configura maxResponseTime

```json
{
  "expectedResponse": {
    "maxResponseTime": 500
  }
}
```

Esto te alertará cuando el servicio esté degradándose antes de caerse completamente.

### 5. Marca Servicios Críticos

```json
{
  "critical": true
}
```

Los servicios críticos tienen alertas más visibles y prioritarias.

---

## 🎓 Próximos Pasos

Una vez que domines la Fase 1, estarán disponibles:

**Fase 2 - Alertas Inteligentes:**
- Sistema de cooldown (evita spam de emails)
- Reintentos automáticos
- Escalación de alertas

**Fase 3 - Dashboard Web:**
- Visualización en tiempo real
- Gráficos de uptime
- Historial interactivo

**Fase 4 - Análisis Avanzado:**
- Detección de patrones
- Alertas predictivas
- Múltiples canales de notificación

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa esta guía
2. Verifica los logs en `logs/logs-high.log`
3. Usa `config/services.example.json` como referencia
4. Valida tu JSON en https://jsonlint.com/

---

## 📄 Licencia

Este sistema es parte del proyecto NOC (Network Operations Center).

---

**¡Feliz Monitoreo! 🚀**
