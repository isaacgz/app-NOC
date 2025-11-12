# 🔔 Fase 2: Sistema de Alertas Inteligentes

## 🎯 ¿Qué es Nuevo?

La Fase 2 agrega un sistema completo de alertas inteligentes que:

✅ **Evita Spam** - Cooldown configurable entre alertas
✅ **Reintentos Automáticos** - Verifica múltiples veces antes de alertar
✅ **Detecta Recuperaciones** - Notifica cuando los servicios se recuperan
✅ **Escalación Automática** - Alerta a niveles superiores si el problema persiste
✅ **Emails Informativos** - Reportes HTML detallados con métricas completas

---

## 🚀 Inicio Rápido

### 1. Configura Alertas en tu Servicio

Edita `config/services.json` y agrega la sección `alerts`:

```json
{
  "id": "mi-api",
  "name": "Mi API",
  "url": "https://api.miempresa.com/health",
  "interval": "*/30 * * * * *",
  "critical": true,

  "alerts": {
    "enabled": true,
    "notifyEmails": ["team@example.com"],
    "notifyOnRecovery": true,

    "cooldown": {
      "durationMinutes": 15,
      "maxAlertsInPeriod": 3
    },

    "retry": {
      "attempts": 3,
      "delayMs": 5000
    },

    "escalation": {
      "enabled": true,
      "afterMinutes": 10,
      "notifyTo": ["manager@example.com"]
    }
  }
}
```

### 2. Configura tus Emails

Asegúrate de tener configurado el `.env`:

```env
MAILER_SERVICE=gmail
MAILER_EMAIL=tu-email@gmail.com
MAILER_SECRET_KEY=tu-app-password
```

### 3. Inicia el Sistema

```bash
npm run dev
```

---

## ⚙️ Configuración de Alertas

### **enabled** (opcional)
- **Tipo:** `boolean`
- **Default:** `true`
- **Descripción:** Habilita o deshabilita alertas para este servicio

```json
"alerts": {
  "enabled": true
}
```

### **notifyEmails** (requerido si enabled=true)
- **Tipo:** `string[]`
- **Descripción:** Lista de emails que recibirán las alertas normales

```json
"notifyEmails": ["ops@example.com", "team@example.com"]
```

### **notifyOnRecovery** (opcional)
- **Tipo:** `boolean`
- **Default:** `false`
- **Descripción:** Envía email cuando el servicio se recupera

```json
"notifyOnRecovery": true
```

---

## 🛡️ Sistema de Cooldown

Evita el spam de notificaciones configurando un período de enfriamiento:

```json
"cooldown": {
  "durationMinutes": 15,
  "maxAlertsInPeriod": 3
}
```

### **durationMinutes** (requerido)
- **Rango:** `1-1440` (1 minuto a 24 horas)
- **Descripción:** Tiempo mínimo entre alertas
- **Ejemplo:** `15` = No enviar más de 1 alerta cada 15 minutos

### **maxAlertsInPeriod** (opcional)
- **Rango:** `1-100`
- **Descripción:** Máximo de alertas permitidas en el período
- **Ejemplo:** Si `durationMinutes: 60` y `maxAlertsInPeriod: 3`, enviará máximo 3 alertas por hora

### 📊 Casos de Uso

| Escenario | durationMinutes | maxAlertsInPeriod |
|-----------|-----------------|-------------------|
| Servicio crítico | 10 | 3 |
| Servicio normal | 15 | 2 |
| Servicio externo | 30 | 1 |
| No crítico | 60 | 1 |

---

## 🔄 Sistema de Reintentos

Verifica múltiples veces antes de considerar el servicio caído:

```json
"retry": {
  "attempts": 3,
  "delayMs": 5000
}
```

### **attempts** (requerido)
- **Rango:** `1-10`
- **Descripción:** Número de reintentos antes de marcar como down
- **Recomendado:**
  - Servicios críticos: `3-5`
  - Servicios normales: `2-3`
  - Servicios lentos: `5-10`

### **delayMs** (requerido)
- **Rango:** `1000-60000` (1 a 60 segundos)
- **Descripción:** Delay entre cada reintento
- **Recomendado:**
  - APIs rápidas: `3000-5000ms`
  - APIs normales: `5000-10000ms`
  - Servicios externos: `10000-30000ms`

### 🎯 Ejemplo Real

```json
"retry": {
  "attempts": 3,
  "delayMs": 5000
}
```

**Comportamiento:**
1. ❌ Primer chequeo falla
2. ⏳ Espera 5 segundos
3. ❌ Segundo intento falla
4. ⏳ Espera 5 segundos
5. ❌ Tercer intento falla
6. 🚨 **AHORA** envía la alerta (si no está en cooldown)

**Beneficio:** Evita alertas por fallos temporales o glitches de red

---

## 🚨 Sistema de Escalación

Alerta automáticamente a niveles superiores si el problema persiste:

```json
"escalation": {
  "enabled": true,
  "afterMinutes": 10,
  "notifyTo": ["manager@example.com", "cto@example.com"]
}
```

### **enabled** (requerido)
- **Tipo:** `boolean`
- **Descripción:** Activa o desactiva escalación

### **afterMinutes** (requerido si enabled=true)
- **Rango:** `5-1440` (5 minutos a 24 horas)
- **Descripción:** Tiempo antes de escalar
- **Recomendado:**
  - Servicios críticos: `5-10 minutos`
  - Servicios normales: `15-30 minutos`
  - No críticos: `60+ minutos`

### **notifyTo** (requerido si enabled=true)
- **Tipo:** `string[]`
- **Descripción:** Emails adicionales para escalación (además de los normales)

### 📈 Flujo de Escalación

```
1. ❌ Servicio cae                    (t=0min)
2. 📧 Alerta al equipo               (t=0min)
3. ⏳ Servicio sigue caído            (t=1-9min)
4. 🚨 ESCALACIÓN a gerencia          (t=10min)
5. ✅ Servicio se recupera           (t=15min)
6. 📧 Notificación de recuperación   (t=15min)
```

---

## 📧 Notificaciones por Email

### Formato del Email

Los emails incluyen:

✅ **Estado del servicio** (DOWN, DEGRADED, RECOVERED)
✅ **URL monitoreada**
✅ **Tiempo de respuesta**
✅ **Código HTTP**
✅ **Mensaje de error detallado**
✅ **Número de fallos consecutivos**
✅ **Duración de la caída**
✅ **Intentos de reintento realizados**
✅ **Errores de validación**

### Asuntos de Email

| Tipo | Ejemplo |
|------|---------|
| Servicio caído | `🔴 NOC Alert: Mi API is DOWN` |
| Servicio degradado | `🟡 NOC Alert: Mi API is DEGRADED` |
| Recuperación | `🟢 NOC Alert: Mi API has RECOVERED` |
| Escalación | `🚨 ESCALATION NOC Alert: Mi API is DOWN` |

---

## 🎨 Ejemplos de Configuración

### Servicio Crítico Completo

```json
{
  "id": "api-payments",
  "name": "Payment API",
  "url": "https://payments.example.com/health",
  "interval": "*/15 * * * * *",
  "critical": true,

  "healthCheck": {
    "method": "GET",
    "timeout": 3000,
    "expectedResponse": {
      "statusCode": 200,
      "maxResponseTime": 500
    }
  },

  "alerts": {
    "enabled": true,
    "notifyEmails": ["payments-team@example.com"],
    "notifyOnRecovery": true,

    "cooldown": {
      "durationMinutes": 10,
      "maxAlertsInPeriod": 3
    },

    "retry": {
      "attempts": 3,
      "delayMs": 3000
    },

    "escalation": {
      "enabled": true,
      "afterMinutes": 5,
      "notifyTo": ["payments-lead@example.com", "cto@example.com"]
    }
  }
}
```

### Servicio Normal (Sin Escalación)

```json
{
  "id": "cdn-assets",
  "name": "CDN Assets",
  "url": "https://cdn.example.com/health",
  "interval": "0 */5 * * * *",
  "critical": false,

  "alerts": {
    "enabled": true,
    "notifyEmails": ["devops@example.com"],
    "notifyOnRecovery": false,

    "cooldown": {
      "durationMinutes": 30
    },

    "retry": {
      "attempts": 2,
      "delayMs": 5000
    },

    "escalation": {
      "enabled": false
    }
  }
}
```

### Servicio Externo (Cooldown Largo)

```json
{
  "id": "third-party-api",
  "name": "Third Party API",
  "url": "https://api.external.com/status",
  "interval": "0 */10 * * * *",
  "critical": false,

  "alerts": {
    "enabled": true,
    "notifyEmails": ["monitoring@example.com"],
    "notifyOnRecovery": true,

    "cooldown": {
      "durationMinutes": 60,
      "maxAlertsInPeriod": 2
    },

    "retry": {
      "attempts": 5,
      "delayMs": 10000
    }
  }
}
```

### Sin Alertas (Solo Logs)

```json
{
  "id": "local-service",
  "name": "Local Service",
  "url": "http://localhost:3000/health",
  "interval": "*/30 * * * * *",

  "alerts": {
    "enabled": false
  }
}
```

---

## 📊 Logs del Sistema

### Logs en Consola

El sistema muestra información en tiempo real:

```
✅ Mi API - 95ms
⚠️ Database API - Service Database API is DEGRADED: Response time exceeds maximum
   ℹ️  Alert suppressed: Cooldown active (8 minutes remaining)

🔴 CRITICAL Payment API - Service Payment API is DOWN: Request timeout
   URL: https://payments.example.com/health
   Error: Request timeout
   📧 Alert sent to payments-team@example.com
   ⏱️  Escalation timer set for 5 minutes

🚨 ESCALATING: Payment API has been down for 5 minutes
   📧 Alert sent to payments-lead@example.com, cto@example.com (ESCALATED)

✅ Payment API - 87ms
   ✓ Escalation timer cleared for service: api-payments
```

### Logs en Archivos

Los logs incluyen ahora información de alertas:

```json
{
  "level": "high",
  "message": "Service Payment API is DOWN: Request timeout",
  "origin": "check-service-advanced.ts",
  "createdAt": "2025-11-12T22:00:00.000Z",
  "responseTime": 5003,
  "serviceId": "api-payments",
  "serviceName": "Payment API",
  "url": "https://payments.example.com/health"
}
```

---

## 🔧 Troubleshooting

### No recibo emails

1. **Verifica configuración de email** en `.env`
2. **Verifica que alerts.enabled = true**
3. **Verifica que notifyEmails tenga valores**
4. **Revisa logs** de errores de envío de email

### Recibo demasiados emails

1. **Aumenta `cooldown.durationMinutes`**
2. **Configura `maxAlertsInPeriod`**
3. **Aumenta `retry.attempts`**

### Las alertas se demoran mucho

1. **Reduce `retry.attempts`**
2. **Reduce `retry.delayMs`**
3. **Reduce `cooldown.durationMinutes`**

### No recibo alertas de escalación

1. **Verifica `escalation.enabled = true`**
2. **Verifica `escalation.notifyTo` tenga emails**
3. **Espera el tiempo configurado en `afterMinutes`**

---

## 🎓 Mejores Prácticas

### 1. Servicios Críticos
```json
"retry": {"attempts": 3, "delayMs": 3000},
"cooldown": {"durationMinutes": 10, "maxAlertsInPeriod": 3},
"escalation": {"enabled": true, "afterMinutes": 5-10}
```

### 2. Servicios Normales
```json
"retry": {"attempts": 2, "delayMs": 5000},
"cooldown": {"durationMinutes": 15},
"escalation": {"enabled": false}
```

### 3. Servicios Externos
```json
"retry": {"attempts": 5, "delayMs": 10000},
"cooldown": {"durationMinutes": 30-60},
"escalation": {"enabled": false}
```

### 4. Desarrollo/Testing
```json
"retry": {"attempts": 1, "delayMs": 1000},
"cooldown": {"durationMinutes": 1},
"notifyOnRecovery": true
```

---

## 🚀 Próxima Fase

**Fase 3: Dashboard Web** te permitirá:
- Ver estado en tiempo real de todos los servicios
- Gráficos interactivos de uptime
- Historial de alertas
- Métricas detalladas de performance

---

**¡Sistema de Alertas Inteligentes Activo! 🎉**
