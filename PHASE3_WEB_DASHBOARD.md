# 📊 Fase 3: Dashboard Web en Tiempo Real

## 🎯 ¿Qué es Nuevo?

La Fase 3 agrega un **dashboard web profesional** que visualiza el estado de todos tus servicios en tiempo real:

✅ **Interfaz Web Moderna** - Dashboard responsive y profesional
✅ **Actualización en Tiempo Real** - Auto-refresh cada 5 segundos
✅ **Vista General** - Métricas clave del sistema completo
✅ **Detalle por Servicio** - Estado, uptime, response time, checks
✅ **API REST Completa** - Endpoints para integrar con otras herramientas
✅ **Sin Framework Pesado** - HTML/CSS/JS puro, carga rápida

---

## 🚀 Inicio Rápido

### 1. Inicia el Sistema

```bash
npm run dev
```

### 2. Abre el Dashboard

El dashboard estará disponible automáticamente en:

```
http://localhost:3000
```

### 3. ¡Listo!

El dashboard se actualizará automáticamente cada 5 segundos mostrando el estado actual de todos tus servicios.

---

## 📊 Características del Dashboard

### **Vista General (Overview)**

Muestra 4 métricas clave del sistema completo:

- **Total Services**: Número total de servicios monitoreados
- **Services Up**: Servicios operacionales
- **Average Uptime**: Porcentaje de disponibilidad promedio
- **Avg Response**: Tiempo de respuesta promedio

### **Lista de Servicios**

Cada servicio muestra:

- ✅ **Estado visual** con indicador de color (verde/amarillo/rojo)
- 📊 **Badge de estado** (UP/DOWN/DEGRADED)
- 📈 **Métricas principales**:
  - **Uptime**: Porcentaje de disponibilidad
  - **Response**: Tiempo de respuesta promedio
  - **Checks**: Total de chequeos realizados
  - **Failures**: Número de fallos
- ⏰ **Timestamp** del último chequeo

### **Código de Colores**

| Color | Estado | Descripción |
|-------|--------|-------------|
| 🟢 Verde | UP | Servicio operacional |
| 🔴 Rojo | DOWN | Servicio caído |
| 🟡 Amarillo | DEGRADED | Servicio degradado (lento) |

### **Auto-Refresh**

- ✅ Actualización automática cada 5 segundos
- ✅ Contador visual en la esquina inferior derecha
- ✅ Actualización suave sin parpadeos

---

## 🔌 API REST Endpoints

El dashboard expone una API REST completa que puedes usar para integraciones:

### **GET /api/health**

Health check del dashboard

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-12T22:00:00.000Z"
}
```

### **GET /api/overview**

Vista general del sistema

```json
{
  "success": true,
  "data": {
    "totalServices": 5,
    "servicesUp": 4,
    "servicesDown": 1,
    "servicesDegraded": 0,
    "averageUptime": 98.5,
    "averageResponseTime": 145,
    "totalChecks": 1250,
    "totalFailures": 18,
    "timestamp": "2025-11-12T22:00:00.000Z"
  }
}
```

### **GET /api/services**

Lista de todos los servicios con su estado

```json
{
  "success": true,
  "data": [
    {
      "id": "api-production",
      "name": "API Production",
      "status": "up",
      "uptime": 99.8,
      "totalChecks": 500,
      "successfulChecks": 499,
      "failedChecks": 1,
      "averageResponseTime": 95,
      "minResponseTime": 45,
      "maxResponseTime": 250,
      "lastCheck": "2025-11-12T22:00:00.000Z",
      "lastDowntime": null,
      "lastDowntimeDuration": null
    }
  ],
  "timestamp": "2025-11-12T22:00:00.000Z"
}
```

### **GET /api/services/:id**

Detalles de un servicio específico

```bash
curl http://localhost:3000/api/services/api-production
```

```json
{
  "success": true,
  "data": {
    "id": "api-production",
    "name": "API Production",
    "status": "up",
    "uptime": 99.8,
    "totalChecks": 500,
    "successfulChecks": 499,
    "failedChecks": 1,
    "averageResponseTime": 95,
    "minResponseTime": 45,
    "maxResponseTime": 250,
    "lastCheck": "2025-11-12T22:00:00.000Z"
  },
  "timestamp": "2025-11-12T22:00:00.000Z"
}
```

### **GET /api/services/:id/history**

Historial de checks de un servicio

```bash
curl "http://localhost:3000/api/services/api-production/history?limit=10"
```

```json
{
  "success": true,
  "data": [
    {
      "serviceId": "api-production",
      "serviceName": "API Production",
      "url": "https://api.example.com/health",
      "success": true,
      "status": "up",
      "responseTime": 95,
      "statusCode": 200,
      "timestamp": "2025-11-12T22:00:00.000Z",
      "message": "Service API Production is UP - 95ms (200)",
      "error": null
    }
  ],
  "timestamp": "2025-11-12T22:00:00.000Z"
}
```

### **GET /api/services/:id/stats**

Estadísticas detalladas de un servicio

```bash
curl http://localhost:3000/api/services/api-production/stats
```

```json
{
  "success": true,
  "data": {
    "service": {
      "id": "api-production",
      "name": "API Production",
      "status": "up"
    },
    "uptime": {
      "overall": 99.8,
      "recent": 100
    },
    "checks": {
      "total": 500,
      "successful": 499,
      "failed": 1
    },
    "responseTime": {
      "average": 95,
      "min": 45,
      "max": 250,
      "distribution": {
        "fast": 450,
        "normal": 48,
        "slow": 2,
        "verySlow": 0
      }
    },
    "lastCheck": "2025-11-12T22:00:00.000Z"
  },
  "timestamp": "2025-11-12T22:00:00.000Z"
}
```

---

## ⚙️ Configuración

### **Puerto del Dashboard**

Por defecto, el dashboard usa el puerto configurado en tu `.env`:

```env
PORT=3000
```

Si cambias el puerto, el dashboard se iniciará automáticamente en el nuevo puerto.

### **Cambiar Intervalo de Actualización**

Edita `/public/dashboard.js` y cambia la constante:

```javascript
const REFRESH_INTERVAL = 5000; // 5 segundos (5000ms)
```

Puedes configurarlo a:
- `3000` - Actualización cada 3 segundos
- `10000` - Actualización cada 10 segundos
- `30000` - Actualización cada 30 segundos

---

## 🎨 Personalización del Dashboard

### **Colores del Tema**

El dashboard usa un tema oscuro por defecto. Para cambiar colores, edita `/public/index.html` en la sección `<style>`:

```css
body {
    background: #0f172a;  /* Fondo principal */
    color: #e2e8f0;       /* Color de texto */
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
    background: #1e293b;  /* Fondo de tarjetas */
}
```

### **Logo Personalizado**

Agrega tu logo en el header editando `/public/index.html`:

```html
<div class="header">
    <img src="/logo.png" alt="Logo" style="height: 40px; margin-right: 1rem;">
    <h1>🔍 NOC Dashboard</h1>
    <p>Real-time Service Monitoring System</p>
</div>
```

---

## 📱 Responsive Design

El dashboard está optimizado para:

- ✅ **Desktop** (1920x1080 y superiores)
- ✅ **Laptop** (1366x768)
- ✅ **Tablet** (768x1024)
- ✅ **Mobile** (375x667 y superiores)

Se adapta automáticamente al tamaño de pantalla.

---

## 🔧 Integración con Otras Herramientas

### **Slack Bot**

Puedes crear un bot de Slack que consulte la API:

```javascript
const axios = require('axios');

async function getServiceStatus() {
    const response = await axios.get('http://localhost:3000/api/services');
    return response.data;
}
```

### **Grafana**

Puedes usar los endpoints de la API como data source para Grafana usando el plugin JSON.

### **Prometheus**

Exporta las métricas en formato Prometheus creando un endpoint adicional.

### **Webhooks**

Llama a la API desde webhooks para obtener estado actual:

```bash
curl http://localhost:3000/api/overview
```

---

## 🚀 Despliegue en Producción

### **Con PM2**

```bash
npm install -g pm2
npm run build
pm2 start dist/app.js --name noc-system
pm2 save
pm2 startup
```

### **Con Docker**

Crea un `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

Construye y ejecuta:

```bash
docker build -t noc-dashboard .
docker run -p 3000:3000 noc-dashboard
```

### **Con Nginx (Reverse Proxy)**

```nginx
server {
    listen 80;
    server_name noc.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Casos de Uso

### **Operaciones NOC**

- Monitor único para todo el equipo de operaciones
- Proyectar en TV para monitoreo visual constante
- Dashboard centralizado sin necesidad de acceso a logs

### **DevOps Teams**

- Vista rápida del estado de todos los servicios
- Detección inmediata de problemas
- Integración con pipelines CI/CD

### **Gerencia/Management**

- Vista ejecutiva del estado del sistema
- Métricas de uptime en tiempo real
- Reportes visuales sin conocimiento técnico

### **Clientes/Stakeholders**

- Status page público (configurando autenticación)
- Transparencia de uptime
- SLA tracking visual

---

## 🔒 Seguridad

### **Recomendaciones para Producción:**

1. **Agregar Autenticación**
   - Implementa JWT o Basic Auth
   - No expongas el dashboard sin autenticación

2. **HTTPS**
   - Usa certificados SSL/TLS
   - Configura con Let's Encrypt

3. **Rate Limiting**
   - Limita requests por IP
   - Previene abuso de la API

4. **Firewall**
   - Restringe acceso solo a IPs autorizadas
   - Usa VPN para acceso remoto

---

## 🎓 Próximos Pasos

Con la Fase 3 completada, puedes:

1. ✅ **Monitorear visualmente** todos tus servicios
2. ✅ **Recibir alertas inteligentes** por email
3. ✅ **Ver métricas en tiempo real** en el dashboard
4. ✅ **Integrar con otras herramientas** usando la API

### **Posibles Mejoras Futuras:**

- 📈 Gráficos históricos de uptime
- 🔔 Notificaciones push en el navegador
- 📱 Modo oscuro/claro configurable
- 🌍 Múltiples idiomas
- 📊 Exportar reportes en PDF
- 🔐 Sistema de autenticación integrado
- 📞 Integración con Slack/Discord/Telegram

---

**¡Dashboard en Tiempo Real Activo! 🎉**

El sistema NOC ahora está completo con monitoreo, alertas y visualización profesional.
