# Dashboard Guide - NOC System

## 🎨 Dashboard Actualizado con Incidentes y SLOs

El dashboard ahora incluye visualización completa de:
- **Incidentes activos** con gestión en tiempo real
- **Cumplimiento de SLOs** con métricas de error budget
- **Estadísticas de incidentes** históricas
- **Estado de servicios** (existente desde Fase 3)

---

## 🚀 Acceso al Dashboard

### Iniciar el Sistema

```bash
npm run dev
```

### Abrir Dashboard

```
http://localhost:3000
```

El dashboard se actualiza automáticamente cada **5 segundos**.

---

## 📊 Secciones del Dashboard

### 1. **Overview Cards** (Superior)

Cuatro tarjetas con métricas globales:

| Métrica | Descripción |
|---------|-------------|
| **Total Services** | Número de servicios monitoreados |
| **Services Up** | Servicios operacionales |
| **Average Uptime** | Confiabilidad del sistema |
| **Avg Response** | Performance promedio |

**Códigos de Color:**
- 🟢 Verde: Uptime >= 99%
- 🟡 Amarillo: Uptime >= 95%
- 🔴 Rojo: Uptime < 95%

---

### 2. **🚨 Active Incidents**

Muestra todos los incidentes activos ordenados por severidad.

#### Severidades

| Nivel | Color | Descripción |
|-------|-------|-------------|
| 🔴 **CRITICAL** | Rojo | Servicios críticos caídos |
| 🟠 **HIGH** | Naranja | Errores graves (5xx) |
| 🟡 **MEDIUM** | Amarillo | Errores moderados |
| 🔵 **LOW** | Azul | Degradación de performance |

#### Información Mostrada

- Nombre del servicio afectado
- Descripción del problema
- Tiempo transcurrido desde creación
- Número de checks fallidos
- Impacto estimado (si disponible)

#### Estado Vacío

Cuando no hay incidentes activos:
```
✅ No active incidents
All services are running smoothly
```

---

### 3. **📊 Incident Statistics**

Vista de métricas históricas en grid:

| Métrica | Descripción |
|---------|-------------|
| **Total Incidents** | Total de incidentes registrados |
| **Active** | Incidentes actuales sin resolver |
| **Resolved** | Incidentes ya resueltos |
| **MTTR** | Mean Time To Resolution (minutos) |
| **Critical** | Incidentes críticos (histórico) |
| **High** | Incidentes de alta severidad |
| **Medium** | Incidentes de severidad media |
| **Low** | Incidentes de baja severidad |

**MTTR (Mean Time To Resolution):**
- < 15 minutos: 🟢 Excelente
- 15-30 minutos: 🟡 Bueno
- > 30 minutos: 🔴 Requiere mejora

---

### 4. **🎯 SLO Compliance**

Visualización de objetivos de nivel de servicio.

#### Barra de Progreso

```
██████████████████░░ 99.87% / 99.9%
                    ↑        ↑
              Actual     Target
```

**Colores:**
- 🟢 **Verde**: Cumpliendo SLO (>= target)
- 🟡 **Amarillo**: Cerca del límite (target - 0.5%)
- 🔴 **Rojo**: Violando SLO (< target - 0.5%)

#### Badges de Cumplimiento

- ✅ **COMPLIANT**: SLO cumplido
- ❌ **VIOLATED**: SLO violado

#### Métricas Mostradas

| Métrica | Descripción | Ejemplo |
|---------|-------------|---------|
| **Target** | Objetivo del SLO | 99.9% |
| **Error Budget** | Tiempo restante de fallo permitido | 12.5 min |
| **Budget Used** | % del error budget consumido | 71.2% |
| **Burn Rate** | Velocidad de consumo del budget | 1.8x |
| **Risk Level** | Nivel de riesgo de violación | MEDIUM |
| **Window** | Ventana temporal del SLO | 30d |

#### Interpretación del Burn Rate

| Burn Rate | Significado | Color |
|-----------|-------------|-------|
| < 1.0x | ✅ Consumo bajo | Verde |
| 1.0-2.0x | ⚠️ Consumo normal | Azul |
| 2.0-3.0x | ⚠️ Consumo elevado | Amarillo |
| 3.0-5.0x | 🚨 Consumo alto | Naranja |
| > 5.0x | 🔥 Consumo crítico | Rojo |

#### Niveles de Riesgo

| Nivel | Descripción | Acción Recomendada |
|-------|-------------|-------------------|
| **NONE** | Error budget saludable | Continuar normal |
| **LOW** | Budget usado > 50% | Monitorear |
| **MEDIUM** | Budget usado > 70% | Reducir cambios |
| **HIGH** | Budget usado > 90% | Solo fixes críticos |
| **CRITICAL** | SLO violado o budget agotado | Freeze de features |

---

### 5. **📡 Services Status**

Lista detallada de todos los servicios (existente desde Fase 3).

---

## 🔄 Auto-Refresh

El dashboard se actualiza automáticamente cada **5 segundos**.

**Indicador de Refresh:** (Esquina inferior derecha)
```
🔄 Auto-refresh: 5s
```

Los datos actualizados incluyen:
- ✅ Estado de servicios
- ✅ Incidentes activos
- ✅ Estadísticas de incidentes
- ✅ Estado de SLOs
- ✅ Métricas globales

---

## 📱 Responsive Design

El dashboard es totalmente responsive:

### Desktop (> 768px)
- Grid de 4 columnas para overview
- Grid flexible para estadísticas
- Vista completa de todas las métricas

### Mobile (<= 768px)
- Grid de 1 columna para overview
- Grid de 2 columnas para estadísticas
- Optimización de tamaños de fuente

---

## 🎨 Paleta de Colores

### Fondo
- **Primary**: `#0f172a` (slate-900)
- **Secondary**: `#1e293b` (slate-800)
- **Border**: `#334155` (slate-700)

### Estado de Servicios
- **Up**: `#10b981` (green-500)
- **Down**: `#ef4444` (red-500)
- **Degraded**: `#f59e0b` (amber-500)

### Severidades
- **Critical**: `#dc2626` (red-600)
- **High**: `#f97316` (orange-500)
- **Medium**: `#f59e0b` (amber-500)
- **Low**: `#3b82f6` (blue-500)

---

## 🛠️ Personalización

### Cambiar Intervalo de Refresh

Editar `public/dashboard.js`:

```javascript
const REFRESH_INTERVAL = 10000; // 10 segundos
```

### Agregar Más Métricas

Los datos vienen de la API REST:

```javascript
// Incidentes activos
GET /api/incidents/active

// Estadísticas
GET /api/incidents/stats

// SLOs
GET /api/slos/status/all
```

---

## 📈 Ejemplos de Vista

### Sin Incidentes (Estado Normal)

```
🚨 Active Incidents
┌─────────────────────────────┐
│         ✅                  │
│  No active incidents        │
│  All services running       │
│       smoothly              │
└─────────────────────────────┘
```

### Con Incidente Crítico

```
🚨 Active Incidents
┌─────────────────────────────────────┐
│ 🔴 CRITICAL                        │
│ Production API - Service Down       │
│ Connection timeout after 5s         │
│ Created 15m ago • 8 failed checks  │
└─────────────────────────────────────┘
```

### SLO en Riesgo

```
🎯 SLO Compliance
┌──────────────────────────────────────┐
│ API Availability (30d)               │
│ ██████████████████░░ 99.87% / 99.9% │
│                                      │
│ Target: 99.9%    Error Budget: 5.2m │
│ Budget Used: 88% Burn Rate: 3.2x    │
│ Risk Level: 🔥 HIGH                 │
└──────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Dashboard no carga

1. Verificar que el servidor esté corriendo:
```bash
npm run dev
```

2. Verificar logs en consola del navegador (F12)

### Incidentes no aparecen

1. Verificar que `config/slos.json` existe
2. Verificar API: `curl http://localhost:3000/api/incidents/active`

### SLOs no aparecen

1. Verificar `config/slos.json` existe y es válido
2. Debe haber datos históricos para calcular SLOs
3. Verificar API: `curl http://localhost:3000/api/slos/status/all`

---

## 🔗 API REST Endpoints

Todos los endpoints disponibles:

```
GET  /api/overview              - Vista general del sistema
GET  /api/services              - Lista de servicios
GET  /api/services/:id          - Detalle de servicio
GET  /api/incidents             - Todos los incidentes
GET  /api/incidents/active      - Incidentes activos
GET  /api/incidents/stats       - Estadísticas
GET  /api/slos/status/all       - Estado de todos los SLOs
GET  /api/slos/:id/status       - Estado de SLO específico
```

---

## 🚀 Próximas Mejoras

Posibles mejoras futuras:
- [ ] Modal con detalles completos de incidentes
- [ ] Timeline visual de eventos de incidente
- [ ] Gráficos de tendencias de SLO (Chart.js)
- [ ] Filtros por servicio, severidad, etc.
- [ ] Exportación de reportes en PDF
- [ ] Notificaciones push del navegador
- [ ] Modo oscuro/claro configurable

---

**Dashboard completamente funcional con visualización profesional de incidentes y SLOs! 🎉**
