# Fase 4: Sistema Completo con Múltiples Canales y Análisis Avanzado

## Descripción General

La Fase 4 completa el sistema NOC con capacidades empresariales avanzadas:

- **Notificaciones Multi-Canal**: Slack, Discord, Telegram, Microsoft Teams y Webhooks personalizados
- **Detección de Patrones**: Análisis inteligente para predecir problemas antes de que ocurran
- **Análisis de Tendencias**: Identificación de degradación progresiva, fallos intermitentes y caídas recurrentes
- **Alertas Predictivas**: Notificaciones proactivas basadas en el comportamiento del servicio

## Tabla de Contenidos

1. [Configuración de Canales de Notificación](#configuración-de-canales-de-notificación)
2. [Detección de Patrones](#detección-de-patrones)
3. [Ejemplos de Configuración](#ejemplos-de-configuración)
4. [Guía de Integración](#guía-de-integración)
5. [Troubleshooting](#troubleshooting)

---

## Configuración de Canales de Notificación

### 1. Slack

#### Obtener Webhook URL

1. Ve a tu workspace de Slack
2. Accede a: https://api.slack.com/messaging/webhooks
3. Crea un "Incoming Webhook"
4. Selecciona el canal donde quieres recibir alertas
5. Copia la URL generada (formato: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`)

#### Configuración

```json
{
  "alerts": {
    "channels": {
      "slack": {
        "enabled": true,
        "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
        "username": "NOC Monitor",
        "iconEmoji": ":robot_face:"
      }
    }
  }
}
```

#### Ejemplo de Notificación

Las notificaciones de Slack incluyen:
- Estado del servicio con emojis de color
- URL del servicio
- Response time
- Prioridad
- Fallos consecutivos (si aplica)
- Tiempo de caída (si aplica)

---

### 2. Discord

#### Obtener Webhook URL

1. Abre Discord y ve a tu servidor
2. Ve a: Server Settings → Integrations → Webhooks
3. Crea un nuevo webhook
4. Selecciona el canal
5. Copia la URL (formato: `https://discord.com/api/webhooks/123456789/XXXXXXXXXXXX`)

#### Configuración

```json
{
  "alerts": {
    "channels": {
      "discord": {
        "enabled": true,
        "webhookUrl": "https://discord.com/api/webhooks/YOUR/WEBHOOK",
        "username": "NOC Monitor",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  }
}
```

#### Personalización

- `username`: Nombre que aparecerá en las notificaciones
- `avatarUrl`: URL de imagen para el avatar del bot

---

### 3. Telegram

#### Crear Bot y Obtener Credenciales

**Paso 1: Crear el Bot**
1. Abre Telegram y busca `@BotFather`
2. Envía el comando: `/newbot`
3. Sigue las instrucciones para darle nombre
4. Copia el **Token** generado (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Paso 2: Obtener Chat ID**
1. Busca `@userinfobot` en Telegram
2. Envía `/start`
3. Copia tu **Chat ID** (número de 9+ dígitos)

**Paso 3: Iniciar conversación con tu bot**
1. Busca tu bot por el nombre que le diste
2. Envía `/start` para activar la conversación

#### Configuración

```json
{
  "alerts": {
    "channels": {
      "telegram": {
        "enabled": true,
        "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
        "chatId": "123456789"
      }
    }
  }
}
```

#### Notas Importantes

- El `chatId` puede ser positivo (chat personal) o negativo (grupo)
- Para grupos: añade el bot al grupo y usa `@userinfobot` para obtener el ID del grupo
- Las notificaciones incluyen formato HTML con emojis

---

### 4. Microsoft Teams

#### Obtener Webhook URL

1. Abre Microsoft Teams
2. Ve al canal donde quieres recibir alertas
3. Click en "..." → Connectors → Incoming Webhook
4. Dale un nombre y copia la URL
5. Formato: `https://outlook.office.com/webhook/...`

#### Configuración

```json
{
  "alerts": {
    "channels": {
      "teams": {
        "enabled": true,
        "webhookUrl": "https://outlook.office.com/webhook/YOUR/WEBHOOK"
      }
    }
  }
}
```

#### Características

- Formato MessageCard compatible con Teams
- Colores según severidad
- Facts organizados en formato tabla

---

### 5. Webhook Personalizado

Para integrar con sistemas propios o servicios de terceros.

#### Configuración

```json
{
  "alerts": {
    "channels": {
      "webhook": {
        "enabled": true,
        "url": "https://your-api.com/noc-alerts",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_TOKEN",
          "Content-Type": "application/json"
        },
        "customPayload": true
      }
    }
  }
}
```

#### Payload Enviado

**Si `customPayload: true`** (payload completo):
```json
{
  "alert": { /* AlertRecord completo */ },
  "healthState": { /* ServiceHealthState */ },
  "isEscalation": false
}
```

**Si `customPayload: false`** (payload simplificado):
```json
{
  "service": "API Production",
  "status": "down",
  "url": "https://api.example.com",
  "responseTime": 5000,
  "message": "Service is down",
  "priority": "critical",
  "isEscalation": false,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Detección de Patrones

El sistema analiza el comportamiento de los servicios para detectar patrones que puedan indicar problemas futuros.

### Patrones Disponibles

#### 1. Progressive Degradation (Degradación Progresiva)

**¿Qué detecta?**
- Response time aumentando progresivamente
- Incremento del 50% o más en el tiempo de respuesta

**¿Cuándo se activa?**
- Compara los últimos 20 checks en dos ventanas de tiempo
- Si la segunda ventana tiene 50%+ más latencia que la primera

**Ejemplo:**
```
Primera mitad: 200ms promedio
Segunda mitad: 350ms promedio
Incremento: 75% → Patrón detectado
```

**Recomendaciones automáticas:**
- Check server resources (CPU, memory, disk)
- Review recent deployments or configuration changes
- Consider scaling resources if trend continues

---

#### 2. Intermittent Failures (Fallos Intermitentes)

**¿Qué detecta?**
- Fallos esporádicos que no son consecutivos
- Problemas de red o configuración inestable

**¿Cuándo se activa?**
- Al menos 3 fallos en los últimos 30 checks
- Fallos representan menos del 30% del total
- No hay más de 2 fallos consecutivos

**Ejemplo:**
```
Checks: ✓ ✓ ✗ ✓ ✓ ✗ ✓ ✓ ✓ ✗ ✓
Fallos: 3 de 11 (27%)
Max consecutivos: 1 → Patrón detectado
```

**Recomendaciones automáticas:**
- Check network stability
- Review load balancer configuration
- Investigate timeout settings
- Look for rate limiting issues

---

#### 3. Recurring Downtime (Caídas Recurrentes)

**¿Qué detecta?**
- Caídas que ocurren en horarios específicos
- Problemas relacionados con tareas programadas

**¿Cuándo se activa?**
- Al menos 3 fallos en la misma hora del día
- Tasa de fallos mayor al 50% en esa hora

**Ejemplo:**
```
Hora 02:00 AM: 5 fallos de 8 checks (62.5%)
→ Patrón detectado: Recurring downtime at 02:00
```

**Recomendaciones automáticas:**
- Check for scheduled jobs running at [hora]
- Review backup processes
- Investigate maintenance windows
- Check for cron jobs or batch processes

---

### Configuración de Detección de Patrones

```json
{
  "// DETECCIÓN DE PATRONES": {
    "enabled": true,
    "analysisIntervalMinutes": 5,
    "timeWindowMinutes": 30,
    "confidenceThreshold": 70,
    "enabledPatterns": [
      "progressive_degradation",
      "intermittent_failures",
      "recurring_downtime"
    ],
    "autoNotify": true
  }
}
```

#### Parámetros

- **enabled**: Habilita/deshabilita la detección de patrones
- **analysisIntervalMinutes**: Cada cuántos minutos analizar patrones
- **timeWindowMinutes**: Ventana de tiempo para el análisis (30 = últimos 30 minutos)
- **confidenceThreshold**: Nivel de confianza mínimo (0-100) para reportar
- **enabledPatterns**: Array de patrones a detectar
- **autoNotify**: Notificar automáticamente cuando se detecta un patrón

---

## Ejemplos de Configuración

### Ejemplo 1: Servicio Crítico con Todos los Canales

```json
{
  "id": "api-production-full",
  "name": "API Production (Full Features)",
  "url": "https://api.example.com/health",
  "interval": "*/30 * * * * *",
  "critical": true,
  "enabled": true,

  "healthCheck": {
    "method": "GET",
    "timeout": 3000,
    "expectedResponse": {
      "statusCode": 200,
      "bodyContains": "healthy",
      "maxResponseTime": 500
    }
  },

  "alerts": {
    "enabled": true,
    "notifyEmails": ["ops@example.com"],
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
    },

    "channels": {
      "slack": {
        "enabled": true,
        "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      "discord": {
        "enabled": true,
        "webhookUrl": "https://discord.com/api/webhooks/YOUR/WEBHOOK"
      },
      "telegram": {
        "enabled": true,
        "botToken": "YOUR_BOT_TOKEN",
        "chatId": "YOUR_CHAT_ID"
      }
    }
  }
}
```

---

### Ejemplo 2: Servicio con Solo Slack

```json
{
  "id": "api-slack-only",
  "name": "API (Slack Only)",
  "url": "https://api2.example.com/health",
  "interval": "*/45 * * * * *",
  "critical": false,
  "enabled": true,

  "alerts": {
    "enabled": true,
    "notifyOnRecovery": true,
    "retry": {
      "attempts": 2,
      "delayMs": 5000
    },
    "channels": {
      "slack": {
        "enabled": true,
        "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      }
    }
  }
}
```

---

### Ejemplo 3: Múltiples Canales con Escalación

```json
{
  "id": "multi-channel",
  "name": "Multi-Channel Service",
  "url": "https://multi.example.com/health",
  "interval": "*/20 * * * * *",
  "critical": true,
  "enabled": true,

  "alerts": {
    "enabled": true,
    "notifyEmails": ["ops@example.com"],
    "notifyOnRecovery": true,

    "cooldown": {
      "durationMinutes": 15
    },

    "escalation": {
      "enabled": true,
      "afterMinutes": 5,
      "notifyTo": ["manager@example.com", "cto@example.com"]
    },

    "channels": {
      "slack": {
        "enabled": true,
        "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      "discord": {
        "enabled": true,
        "webhookUrl": "https://discord.com/api/webhooks/YOUR/WEBHOOK"
      },
      "teams": {
        "enabled": true,
        "webhookUrl": "https://outlook.office.com/webhook/YOUR/WEBHOOK"
      }
    }
  }
}
```

---

## Guía de Integración

### Paso 1: Actualizar Configuración

Copia el archivo de ejemplo:
```bash
cp config/services-phase4.example.json config/services.json
```

### Paso 2: Configurar Canales

Edita `config/services.json` y añade tus webhooks/tokens para cada canal que quieras usar.

### Paso 3: Habilitar Detección de Patrones

Asegúrate de tener la sección de detección de patrones en el JSON:

```json
{
  "// DETECCIÓN DE PATRONES": {
    "enabled": true,
    "analysisIntervalMinutes": 5,
    "timeWindowMinutes": 30,
    "confidenceThreshold": 70,
    "enabledPatterns": [
      "progressive_degradation",
      "intermittent_failures",
      "recurring_downtime"
    ],
    "autoNotify": true
  }
}
```

### Paso 4: Verificar Instalación

Ejecuta el sistema:
```bash
npm start
```

Deberías ver en consola:
```
✅ Loaded 6 services from configuration
📊 Dashboard available at: http://localhost:3000
📡 API available at: http://localhost:3000/api
🔔 Multi-channel notifications enabled
🔍 Pattern detection enabled
```

### Paso 5: Probar Notificaciones

Para probar que los canales funcionan correctamente:

1. **Configura un servicio de prueba** con URL inválida
2. **Espera 1-2 minutos** para que se detecte la caída
3. **Verifica** que lleguen notificaciones en todos los canales configurados

---

## Troubleshooting

### Slack: Webhook no funciona

**Error**: `invalid_payload` o no llegan mensajes

**Solución**:
1. Verifica que la URL sea correcta (debe empezar con `https://hooks.slack.com/services/`)
2. Verifica que el webhook no haya sido revocado
3. Prueba manualmente con curl:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from NOC"}' \
  YOUR_WEBHOOK_URL
```

---

### Discord: 404 Not Found

**Error**: `Webhook not found`

**Solución**:
1. Verifica que el webhook no haya sido eliminado
2. Verifica que la URL sea correcta
3. Regenera el webhook en Discord si es necesario

---

### Telegram: Unauthorized

**Error**: `Unauthorized` o `Bad Request: chat not found`

**Solución**:
1. **Bot Token inválido**: Verifica el token con @BotFather
2. **Chat ID incorrecto**: Usa @userinfobot para obtenerlo nuevamente
3. **No iniciaste el bot**: Busca tu bot en Telegram y envía `/start`
4. **Para grupos**: Añade el bot al grupo primero

---

### Teams: BadRequest

**Error**: `Bad Request` o no se muestra el mensaje

**Solución**:
1. Verifica que el webhook esté activo en Teams
2. El webhook puede haber expirado (no se usa por 90 días)
3. Regenera el webhook en: Channel → Connectors → Incoming Webhook

---

### Pattern Detection: No se detectan patrones

**Posibles causas**:

1. **Pocos datos**: Se necesitan al menos 10 checks para empezar el análisis
2. **Tiempo insuficiente**: Espera al menos 30 minutos de operación
3. **Confidence threshold muy alto**: Reduce el `confidenceThreshold` a 50
4. **Patrón no habilitado**: Verifica el array `enabledPatterns`

**Verificación**:
```bash
# Ver logs del sistema
tail -f logs/noc-app.log | grep "Pattern detected"
```

---

### Webhook Personalizado: 401/403 Errors

**Solución**:
1. Verifica que el header `Authorization` sea correcto
2. Verifica que tu API acepte el formato del payload
3. Añade logs en tu endpoint para ver qué está recibiendo

---

## API de Patrones (Para Desarrolladores)

### Obtener Patrones Detectados

**Endpoint**: `GET /api/patterns`

**Response**:
```json
{
  "success": true,
  "patterns": [
    {
      "id": "uuid-v4",
      "type": "progressive_degradation",
      "severity": "high",
      "serviceId": "api-production",
      "serviceName": "API Production",
      "description": "Response time increasing progressively: from 200ms to 350ms (75% increase)",
      "detectedAt": "2025-01-15T10:30:00.000Z",
      "data": {
        "confidence": 85,
        "details": {
          "previousAverage": 200,
          "currentAverage": 350,
          "increasePercentage": 75
        }
      },
      "recommendations": [
        "Check server resources (CPU, memory, disk)",
        "Review recent deployments or configuration changes"
      ],
      "notified": true
    }
  ]
}
```

---

## Resumen de Características Fase 4

### Notificaciones Multi-Canal
- ✅ Slack con attachments personalizados
- ✅ Discord con embeds y colores
- ✅ Telegram con formato HTML
- ✅ Microsoft Teams con MessageCards
- ✅ Webhooks personalizados
- ✅ Soporte para múltiples canales simultáneos
- ✅ Emojis y colores según severidad

### Detección de Patrones
- ✅ Progressive Degradation (degradación progresiva)
- ✅ Intermittent Failures (fallos intermitentes)
- ✅ Recurring Downtime (caídas recurrentes)
- ✅ Análisis de tendencias con predicción
- ✅ Nivel de confianza configurable
- ✅ Recomendaciones automáticas
- ✅ Notificaciones proactivas

### Análisis Avanzado
- ✅ Ventanas de tiempo configurables
- ✅ Métricas de response time
- ✅ Detección de anomalías
- ✅ Historial de checks para análisis
- ✅ Cálculo de concern level
- ✅ Predicción de valores futuros

---

## Próximos Pasos

1. **Configurar canales**: Obtén los webhooks/tokens necesarios
2. **Personalizar alertas**: Ajusta cooldowns, reintentos y escalaciones
3. **Habilitar patrones**: Activa los patrones que necesites
4. **Monitorear dashboard**: Accede a http://localhost:3000
5. **Revisar logs**: Verifica que todo funcione correctamente

Para más información sobre fases anteriores:
- [Fase 1: Sistema Avanzado de Monitoreo](MONITORING_GUIDE.md)
- [Fase 2: Sistema de Alertas Inteligentes](PHASE2_INTELLIGENT_ALERTS.md)
- [Fase 3: Dashboard Web en Tiempo Real](PHASE3_WEB_DASHBOARD.md)

---

**Sistema NOC - Fase 4 Completa** 🎉
