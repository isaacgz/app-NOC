# Fase 5: Gestión de Incidentes y SLOs

## 📋 Descripción General

La **Fase 5** implementa un sistema profesional de gestión de incidentes y monitoreo de SLOs (Service Level Objectives) para el sistema NOC. Estas funcionalidades permiten:

- **Gestión automática de incidentes** desde la detección hasta la resolución
- **Monitoreo de SLOs** con cálculo de error budgets y burn rates
- **API REST completa** para integración con sistemas externos
- **Tracking de métricas** de disponibilidad, latencia y tasas de error

---

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Gestión de Incidentes

#### Creación Automática de Incidentes
- Los incidentes se crean **automáticamente** cuando un servicio falla
- Solo se crea un incidente si se cumplen las condiciones de alerta
- Evita incidentes duplicados para el mismo servicio

#### Estados del Ciclo de Vida
```
NEW → INVESTIGATING → IN_PROGRESS → RESOLVED → CLOSED
```

#### Severidades
- `CRITICAL`: Servicios críticos caídos o problemas graves
- `HIGH`: Errores 5xx o fallos importantes
- `MEDIUM`: Otros errores de chequeo
- `LOW`: Degradación de performance

#### Timeline de Eventos
Cada incidente mantiene un historial completo:
- Creación del incidente
- Cambios de estado
- Checks fallidos adicionales
- Resolución y cierre

#### Auto-Resolución
Los incidentes se resuelven automáticamente cuando el servicio se recupera.

---

### 2. Sistema de SLOs (Service Level Objectives)

#### Tipos de SLIs Soportados

**1. Availability (Disponibilidad)**
- Mide el % de checks exitosos
- Ejemplo: "El servicio debe estar disponible 99.9% del tiempo"

**2. Latency (Latencia)**
- Mide el % de requests que cumplen un umbral de tiempo
- Ejemplo: "95% de requests deben completarse en < 200ms"

**3. Error Rate (Tasa de Error)**
- Mide el % de requests exitosos vs. fallidos
- Ejemplo: "99% de requests deben ser exitosos"

#### Ventanas Temporales
- `1h`: 1 hora
- `24h`: 24 horas (1 día)
- `7d`: 7 días (1 semana)
- `30d`: 30 días (1 mes)
- `90d`: 90 días (1 trimestre)

#### Cálculo de Error Budget
El **error budget** es el tiempo permitido de fallo sin violar el SLO:
- SLO de 99.9% en 30 días = 43.2 minutos de error budget
- SLO de 99% en 7 días = 100.8 minutos de error budget

```
Error Budget = (100% - Target%) × Total Time
```

#### Burn Rate
Indica la velocidad de consumo del error budget:
- `< 1`: Consumiendo más lento de lo esperado ✅
- `= 1`: Consumiendo al ritmo esperado ⚠️
- `> 1`: Consumiendo más rápido de lo esperado 🚨
- `> 5`: Riesgo crítico de violación 🔥

#### Niveles de Riesgo
- `none`: Error budget saludable
- `low`: Error budget por debajo del 50%
- `medium`: Error budget por debajo del 30%
- `high`: Error budget por debajo del 10%
- `critical`: SLO violado o error budget agotado

---

## 📁 Estructura del Proyecto

```
src/
├── domain/
│   ├── entities/
│   │   ├── incident.entity.ts           # Entidades de incidente
│   │   ├── slo.entity.ts                # Entidades de SLO
│   │   └── sli.entity.ts                # Entidades de SLI
│   ├── repository/
│   │   ├── incident.repository.ts       # Interfaz de repo de incidentes
│   │   └── slo.repository.ts            # Interfaz de repo de SLOs
│   ├── services/
│   │   ├── incident-manager.service.ts  # Lógica de gestión de incidentes
│   │   └── slo-calculator.service.ts    # Cálculo de SLOs
│   └── use-cases/
│       └── config/
│           └── load-slos-config.ts      # Carga de configuración de SLOs
│
├── infrastructure/
│   └── repositories/
│       ├── incident.repository.impl.ts  # Persistencia de incidentes (JSON)
│       └── slo.repository.impl.ts       # Persistencia de SLOs (JSON)
│
└── presentation/
    ├── dashboard/
    │   ├── incidents.controller.ts      # API REST de incidentes
    │   ├── slos.controller.ts           # API REST de SLOs
    │   └── dashboard.server.ts          # Servidor actualizado
    └── services/
        └── multi-service-monitor.ts     # Monitor integrado con incidentes
```

---

## 🔧 Configuración

### 1. Configurar SLOs

Crear archivo `config/slos.json`:

```json
{
  "slos": [
    {
      "id": "slo-api-availability-30d",
      "serviceId": "api-production",
      "name": "API 99.9% Availability (30 days)",
      "description": "La API debe estar disponible 99.9% del tiempo",
      "target": 99.9,
      "window": "30d",
      "sliType": "availability",
      "enabled": true
    },
    {
      "id": "slo-api-latency-24h",
      "serviceId": "api-production",
      "name": "API < 500ms Response Time (24h)",
      "description": "95% de requests deben completarse en < 500ms",
      "target": 95,
      "window": "24h",
      "sliType": "latency",
      "threshold": 500,
      "enabled": true
    },
    {
      "id": "slo-api-errors-7d",
      "serviceId": "api-production",
      "name": "API 99% Success Rate (7 days)",
      "description": "99% de requests deben ser exitosos",
      "target": 99,
      "window": "7d",
      "sliType": "errorRate",
      "enabled": true
    }
  ]
}
```

### 2. Campos de Configuración de SLO

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único del SLO |
| `serviceId` | string | ID del servicio a monitorear (debe existir en services.json) |
| `name` | string | Nombre descriptivo del SLO |
| `description` | string | Descripción detallada |
| `target` | number | Objetivo (0-100%). Ej: 99.9 para 99.9% |
| `window` | string | Ventana temporal: `1h`, `24h`, `7d`, `30d`, `90d` |
| `sliType` | string | Tipo de SLI: `availability`, `latency`, `errorRate` |
| `threshold` | number | (Opcional) Umbral en ms para SLIs de latency |
| `enabled` | boolean | Si el SLO está activo |

---

## 🌐 API REST

### Endpoints de Incidentes

#### **GET** `/api/incidents`
Lista todos los incidentes.

**Query Parameters:**
- `status`: Filtrar por estado (ej: `new,investigating`)
- `severity`: Filtrar por severidad (ej: `critical`)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inc-123",
      "serviceId": "api-production",
      "serviceName": "Production API",
      "title": "Production API - Service Down",
      "description": "Service check failed: Connection timeout",
      "severity": "critical",
      "status": "new",
      "createdAt": "2025-11-12T10:30:00Z",
      "updatedAt": "2025-11-12T10:30:00Z",
      "affectedChecks": 1,
      "timeline": [...]
    }
  ],
  "count": 1
}
```

#### **GET** `/api/incidents/active`
Obtiene solo los incidentes activos (NEW, INVESTIGATING, IN_PROGRESS).

#### **GET** `/api/incidents/:id`
Obtiene un incidente específico por ID.

#### **GET** `/api/incidents/stats`
Obtiene estadísticas de incidentes.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "active": 3,
    "resolved": 40,
    "closed": 2,
    "bySeverity": {
      "critical": 5,
      "high": 15,
      "medium": 20,
      "low": 5
    },
    "averageResolutionTime": 25.5,
    "mttr": 25.5
  }
}
```

#### **GET** `/api/services/:serviceId/incidents`
Obtiene incidentes de un servicio específico.

#### **PATCH** `/api/incidents/:id/status`
Actualiza el estado de un incidente.

**Body:**
```json
{
  "status": "investigating",
  "notes": "Equipo de infraestructura investigando la causa",
  "assignedTo": "ops-team"
}
```

#### **POST** `/api/incidents`
Crea un incidente manualmente.

**Body:**
```json
{
  "serviceId": "api-production",
  "serviceName": "Production API",
  "severity": "high",
  "description": "Alta latencia detectada en endpoint /users",
  "estimatedImpact": "Afecta a ~1000 usuarios"
}
```

---

### Endpoints de SLOs

#### **GET** `/api/slos`
Lista todos los SLOs configurados.

**Query Parameters:**
- `enabled=true`: Mostrar solo SLOs habilitados

#### **GET** `/api/slos/:id`
Obtiene un SLO específico.

#### **GET** `/api/slos/status/all`
Calcula y obtiene el estado actual de todos los SLOs.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "slos": [
      {
        "sloId": "slo-api-availability-30d",
        "sloName": "API 99.9% Availability (30 days)",
        "serviceId": "api-production",
        "serviceName": "Production API",
        "currentValue": 99.87,
        "target": 99.9,
        "compliance": false,
        "errorBudget": 12.3,
        "errorBudgetTotal": 43.2,
        "errorBudgetUsed": 71.5,
        "burnRate": 1.8,
        "violationRisk": "medium",
        "calculatedAt": "2025-11-12T10:35:00Z",
        "window": "30d",
        "sliType": "availability"
      }
    ],
    "summary": {
      "totalSLOs": 3,
      "compliantSLOs": 2,
      "violatedSLOs": 1,
      "complianceRate": 66.67,
      "averageCompliance": 98.5,
      "averageErrorBudgetUsed": 45.3,
      "atRisk": 1
    }
  }
}
```

#### **GET** `/api/slos/:id/status`
Calcula el estado actual de un SLO específico.

#### **GET** `/api/slos/:id/history`
Obtiene el historial de estado de un SLO.

**Query Parameters:**
- `limit`: Número de registros a retornar (default: 100)

#### **POST** `/api/slos`
Crea un nuevo SLO.

**Body:**
```json
{
  "serviceId": "api-production",
  "name": "API Latency SLO",
  "description": "90% de requests < 300ms",
  "target": 90,
  "window": "24h",
  "sliType": "latency",
  "threshold": 300,
  "enabled": true
}
```

#### **PATCH** `/api/slos/:id`
Actualiza un SLO existente.

#### **DELETE** `/api/slos/:id`
Elimina un SLO.

---

## 🚀 Uso

### Iniciar el Sistema

```bash
npm run dev
```

El sistema iniciará con:
- ✅ Gestión de incidentes habilitada
- ✅ SLOs cargados desde `config/slos.json`
- ✅ Cálculo de SLOs cada 5 minutos
- ✅ API REST disponible en `http://localhost:3000/api`

### Logs del Sistema

```
🚀 NOC System Starting...

📋 Initializing Incident Management System (Phase 5)...
✅ Incident Management System initialized

🎯 Loading SLO configuration...
Loaded 4 SLOs from disk
✅ Loaded 4 SLOs

📋 Loading monitoring configuration from: /path/to/config/services.json
✅ Configuration loaded successfully
...

📊 Dashboard available at: http://localhost:3000
📡 API available at: http://localhost:3000/api
📊 API Endpoints:
   - GET  /api/incidents         - List all incidents
   - GET  /api/incidents/active  - Active incidents
   - GET  /api/slos/status/all   - SLO compliance status
   - GET  /api/services          - Services overview
```

### Cuando un Servicio Falla

```
🔴 CRITICAL Production API - Connection timeout
   📋 Incident created: inc-abc123 (critical)
```

### Cuando el Servicio se Recupera

```
✅ Production API - 245ms
   ✅ Incident inc-abc123 auto-resolved
```

### Alertas de SLO

```
🚨 SLO VIOLATION RISK: API 99.9% Availability (30 days) - Error budget: 5.2min
```

---

## 📊 Ejemplos de Uso de la API

### Obtener Incidentes Activos

```bash
curl http://localhost:3000/api/incidents/active
```

### Obtener Estado de Todos los SLOs

```bash
curl http://localhost:3000/api/slos/status/all
```

### Actualizar Estado de Incidente

```bash
curl -X PATCH http://localhost:3000/api/incidents/inc-123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "investigating",
    "notes": "Causa raíz identificada: sobrecarga de base de datos",
    "assignedTo": "ops-team"
  }'
```

### Crear SLO Personalizado

```bash
curl -X POST http://localhost:3000/api/slos \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "api-production",
    "name": "Custom Latency SLO",
    "target": 95,
    "window": "7d",
    "sliType": "latency",
    "threshold": 400,
    "enabled": true
  }'
```

---

## 📈 Persistencia de Datos

### Ubicación de Datos

```
data/
├── incidents/
│   └── incidents.json           # Todos los incidentes
└── slos/
    ├── slos.json                # Configuración de SLOs
    └── slo-status.json          # Historial de estados
```

### Formato de Almacenamiento

**incidents.json:**
```json
[
  {
    "id": "inc-123",
    "serviceId": "api-production",
    "serviceName": "Production API",
    ...
  }
]
```

**slo-status.json:**
```json
{
  "slo-api-availability-30d": [
    {
      "sloId": "slo-api-availability-30d",
      "currentValue": 99.87,
      "target": 99.9,
      "compliance": false,
      "calculatedAt": "2025-11-12T10:00:00Z",
      ...
    }
  ]
}
```

---

## 🔍 Interpretación de Métricas

### Error Budget

**Ejemplo:** SLO de 99.9% en 30 días

| Uptime Actual | Error Budget Usado | Error Budget Restante | Estado |
|---------------|-------------------|----------------------|---------|
| 99.95% | 0% | 43.2 min | 🟢 Excelente |
| 99.92% | 50% | 21.6 min | 🟡 Aceptable |
| 99.88% | 120% | -8.64 min | 🔴 Violado |

### Burn Rate

**Ejemplo:** SLO de 99% en 7 días (error budget: 100.8 min)

| Errores Recientes | Burn Rate | Interpretación |
|-------------------|-----------|----------------|
| 0 fallos en 20 checks | 0 | ✅ Sin consumo |
| 1 fallo en 20 checks | 0.5 | ✅ Consumo bajo |
| 2 fallos en 20 checks | 1.0 | ⚠️ Consumo esperado |
| 5 fallos en 20 checks | 2.5 | 🚨 Consumo alto |
| 10 fallos en 20 checks | 5.0 | 🔥 Consumo crítico |

---

## 🎯 Mejores Prácticas

### Definición de SLOs

1. **Comienza conservador**: Es mejor empezar con un SLO de 95% y subirlo gradualmente
2. **Basado en datos**: Analiza el uptime histórico antes de definir el SLO
3. **Balanceo**: No todos los servicios necesitan 99.9%
   - Servicios críticos: 99.9% - 99.99%
   - Servicios importantes: 99% - 99.5%
   - Servicios internos: 95% - 98%

### Gestión de Error Budget

- **Budget saludable (> 50%)**: Momento para innovar y tomar riesgos calculados
- **Budget bajo (< 30%)**: Enfocar en estabilidad, posponer releases
- **Budget agotado**: Freeze de features, solo bug fixes críticos

### Gestión de Incidentes

1. **Triage rápido**: Actualizar estado a `INVESTIGATING` en < 5 minutos
2. **Comunicación**: Agregar notas frecuentes al timeline
3. **Post-mortem**: Documentar `rootCause` y `resolution` al cerrar
4. **Métricas**: Monitorear MTTR (Mean Time To Resolution)

---

## 🔜 Próximas Mejoras Recomendadas

- [ ] Dashboard UI para visualizar incidentes y SLOs
- [ ] Notificaciones push cuando SLOs están en riesgo
- [ ] Integración con sistemas de ticketing (Jira, Linear)
- [ ] Reportes automatizados de SLO compliance
- [ ] Gráficos de tendencias de error budget
- [ ] Alertas predictivas basadas en burn rate
- [ ] Soporte para SLOs multi-ventana (alertas rápidas + lentas)

---

## 📚 Referencias

- [Google SRE Book - SLO Chapter](https://sre.google/sre-book/service-level-objectives/)
- [The Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Error Budgets](https://sre.google/workbook/error-budget-policy/)

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar los logs del sistema
2. Verificar la configuración en `config/slos.json`
3. Comprobar que los `serviceId` coincidan entre archivos de configuración
4. Verificar que existe data histórica para calcular SLOs

---

**¡Sistema de Gestión de Incidentes y SLOs implementado exitosamente! 🎉**
