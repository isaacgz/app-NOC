# NOC Dashboard - Vue.js Frontend

Dashboard moderno en tiempo real para el sistema de monitoreo NOC, construido con Vue 3, TypeScript y Tailwind CSS.

## 🚀 Tech Stack

- **Vue 3** - Composition API + TypeScript
- **Vite** - Build tool y dev server ultrarrápido
- **Pinia** - State management
- **Vue Router** - Navegación SPA
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Heroicons** - Iconos SVG de alta calidad

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env y configurar la URL del backend
# VITE_API_URL=http://localhost:3000
```

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# El dashboard estará disponible en http://localhost:5173
```

El servidor de desarrollo tiene hot-reload automático. Los cambios se reflejan inmediatamente en el navegador.

## 🏗️ Build para Producción

```bash
# Compilar para producción
npm run build

# Preview del build
npm run preview
```

Los archivos compilados estarán en `./dist/`

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── assets/          # CSS, imágenes, etc.
│   │   └── main.css    # Estilos globales + Tailwind
│   │
│   ├── components/      # Componentes Vue reutilizables
│   │   ├── StatCard.vue         # Tarjeta de estadísticas
│   │   ├── StatusBadge.vue      # Badge de estado
│   │   ├── ServiceCard.vue      # Tarjeta de servicio
│   │   ├── IncidentTable.vue    # Tabla de incidentes
│   │   └── SLOCard.vue          # Tarjeta de SLO
│   │
│   ├── router/          # Configuración de Vue Router
│   │   └── index.ts    # Rutas y navegación
│   │
│   ├── services/        # API clients
│   │   ├── api.ts              # Axios client base
│   │   ├── serviceApi.ts       # API de servicios
│   │   ├── incidentApi.ts      # API de incidentes
│   │   └── sloApi.ts           # API de SLOs
│   │
│   ├── stores/          # Pinia stores
│   │   ├── serviceStore.ts     # State de servicios
│   │   ├── incidentStore.ts    # State de incidentes
│   │   └── sloStore.ts         # State de SLOs
│   │
│   ├── types/           # TypeScript types
│   │   └── index.ts    # Definiciones de tipos
│   │
│   ├── views/           # Vistas/Páginas principales
│   │   ├── DashboardView.vue        # Dashboard principal
│   │   ├── ServicesView.vue         # Lista de servicios
│   │   ├── ServiceDetailView.vue    # Detalle de servicio
│   │   ├── IncidentsView.vue        # Lista de incidentes
│   │   ├── IncidentDetailView.vue   # Detalle de incidente
│   │   ├── SLOsView.vue            # Lista de SLOs
│   │   └── SLODetailView.vue       # Detalle de SLO
│   │
│   ├── App.vue          # Componente raíz
│   └── main.ts          # Entry point
│
├── index.html           # HTML template
├── vite.config.ts       # Configuración de Vite
├── tailwind.config.js   # Configuración de Tailwind
├── postcss.config.js    # Configuración de PostCSS
├── tsconfig.json        # Configuración de TypeScript
└── package.json         # Dependencias y scripts
```

## 🎨 Características del Dashboard

### 📊 Dashboard Principal (`/`)
- Métricas globales del sistema
- Servicios activos/caídos
- Incidentes críticos destacados
- SLOs en riesgo
- Resumen de incidentes recientes
- Auto-refresh cada 30 segundos

### 🖥️ Servicios (`/services`)
- Lista de todos los servicios monitoreados
- Filtros: All, Up, Down, Degraded, Critical
- Métricas de uptime y response time
- Indicadores de incidentes activos
- Vista de detalle por servicio

### 🚨 Incidentes (`/incidents`)
- Gestión de incidentes
- Estadísticas: Total, Active, Resolved, MTTR
- Filtros por severidad y estado
- Timeline de eventos
- Tabla con búsqueda y paginación

### 🎯 SLOs (`/slos`)
- Monitoreo de Service Level Objectives
- Métricas de compliance
- Error budget tracking
- Burn rate monitoring
- Violation risk alerts
- Historial de status

## 🔄 State Management (Pinia)

### Service Store
```typescript
const serviceStore = useServiceStore();

// State
serviceStore.services          // Lista de servicios
serviceStore.metrics           // Métricas del sistema
serviceStore.loading          // Loading state

// Computed
serviceStore.servicesUp       // Servicios activos
serviceStore.servicesDown     // Servicios caídos
serviceStore.criticalServices // Servicios críticos

// Actions
await serviceStore.fetchServices()
await serviceStore.fetchOverview()
await serviceStore.createService(data)
await serviceStore.updateService(id, data)
```

### Incident Store
```typescript
const incidentStore = useIncidentStore();

// State
incidentStore.incidents       // Todos los incidentes
incidentStore.activeIncidents // Incidentes activos
incidentStore.statistics      // Estadísticas

// Computed
incidentStore.criticalIncidents
incidentStore.recentIncidents

// Actions
await incidentStore.fetchAllIncidents()
await incidentStore.updateIncidentStatus(id, status)
await incidentStore.resolveIncident(id, resolution)
```

### SLO Store
```typescript
const sloStore = useSLOStore();

// State
sloStore.slos                 // Lista de SLOs
sloStore.sloStatuses          // Status de SLOs

// Computed
sloStore.compliantSLOs        // SLOs en compliance
sloStore.violatingSLOs        // SLOs violados
sloStore.complianceRate       // Tasa de compliance

// Actions
await sloStore.fetchAllSLOs()
await sloStore.fetchAllStatuses()
await sloStore.fetchStatusHistory(sloId)
```

## 🎨 Componentes Reutilizables

### StatCard
Tarjeta de estadística con icono y cambio opcional.

```vue
<StatCard
  title="Total Services"
  :value="42"
  :icon="ServerIcon"
  color="blue"
  change="+5% from last week"
  changeType="positive"
/>
```

### StatusBadge
Badge de estado con color automático.

```vue
<StatusBadge status="up" />
<StatusBadge status="critical" />
<StatusBadge :status="incident.severity" />
```

### ServiceCard
Tarjeta de servicio con métricas.

```vue
<ServiceCard
  :service="service"
  @click="navigateToDetail(service.id)"
/>
```

### IncidentTable
Tabla de incidentes con acciones.

```vue
<IncidentTable
  :incidents="activeIncidents"
  @select="viewIncident($event)"
/>
```

### SLOCard
Tarjeta de SLO con progress bars.

```vue
<SLOCard :status="sloStatus" />
```

## 🌐 API Integration

El frontend se comunica con el backend a través de servicios API que usan Axios.

### Configuración Base
```typescript
// API base URL desde .env
VITE_API_URL=http://localhost:3000

// Auto-retry en errores de red
// Auto-refresh token (preparado para auth)
```

### Endpoints Disponibles

**Services:**
- `GET /api/overview` - Métricas del sistema
- `GET /api/services` - Lista de servicios
- `GET /api/services/:id` - Detalle de servicio
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio

**Incidents:**
- `GET /api/incidents` - Todos los incidentes
- `GET /api/incidents/active` - Incidentes activos
- `GET /api/incidents/:id` - Detalle de incidente
- `GET /api/incidents/stats` - Estadísticas
- `PATCH /api/incidents/:id/status` - Actualizar estado
- `POST /api/incidents/:id/resolve` - Resolver incidente

**SLOs:**
- `GET /api/slos` - Todos los SLOs
- `GET /api/slos/status/all` - Status de todos los SLOs
- `GET /api/slos/:id/status` - Status de un SLO
- `GET /api/slos/:id/history` - Historial de SLO
- `POST /api/slos` - Crear SLO
- `PUT /api/slos/:id` - Actualizar SLO

## 🎨 Personalización de Estilos

### Tailwind Configuration
Personaliza colores, fuentes y más en `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Tus colores personalizados
      },
    },
  },
}
```

### CSS Custom
Agrega estilos globales en `src/assets/main.css`.

## 🚀 Deploy

### Docker
El proyecto incluye configuración Docker en el `docker-compose.yml` raíz:

```bash
# Desde el directorio raíz del proyecto
docker-compose up -d
```

### Build Manual
```bash
# Build del frontend
npm run build

# Servir con nginx, apache, etc.
# Los archivos están en ./dist/
```

## 📝 Variables de Entorno

```bash
# .env
VITE_API_URL=http://localhost:3000  # URL del backend
VITE_DEV_MODE=true                  # Modo desarrollo
```

## 🔧 Troubleshooting

### El frontend no se conecta al backend
1. Verifica que el backend esté corriendo en el puerto 3000
2. Revisa `VITE_API_URL` en `.env`
3. Verifica CORS en el backend

### Errores de build
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de Vite
rm -rf node_modules/.vite
```

### Hot reload no funciona
```bash
# Reiniciar servidor de desarrollo
npm run dev
```

## 📚 Recursos

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vue Router Documentation](https://router.vuejs.org/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea un branch para tu feature (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'feat: agrega nueva feature'`)
4. Push al branch (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

**NOC Dashboard Frontend** - Built with ❤️ using Vue 3 + TypeScript + Tailwind CSS
