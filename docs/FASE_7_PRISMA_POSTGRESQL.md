# Fase 7: Prisma ORM + PostgreSQL Integration

## 📋 Resumen

La Fase 7 implementa **Prisma ORM** como capa de persistencia principal, reemplazando el almacenamiento en archivos JSON con una base de datos **PostgreSQL** robusta y escalable.

El sistema mantiene una **arquitectura híbrida** con tres capas de almacenamiento:
- **PostgreSQL (Prisma)**: Datos transaccionales (servicios, incidentes, SLOs, usuarios)
- **InfluxDB**: Métricas time-series (alta performance para análisis temporal)
- **Filesystem**: Fallback y logs del sistema

## ✨ Características Implementadas

### 1. **Prisma ORM Completo**

#### Schema Prisma (`prisma/schema.prisma`)
- ✅ **5 Modelos principales**:
  - `Service`: Servicios monitoreados con configuración completa
  - `Incident`: Incidentes con severidad, status y timeline
  - `SLO`: Service Level Objectives con métricas
  - `SLOStatusHistory`: Historial temporal de SLOs
  - `User`: Usuarios del sistema (preparado para auth)

- ✅ **6 Enums tipados**:
  - `Severity`: CRITICAL, HIGH, MEDIUM, LOW
  - `IncidentStatus`: NEW, INVESTIGATING, IN_PROGRESS, RESOLVED, CLOSED
  - `SLOWindow`: 1h, 24h, 7d, 30d, 90d
  - `SLIType`: AVAILABILITY, LATENCY, ERROR_RATE
  - `ViolationRisk`: NONE, LOW, MEDIUM, HIGH, CRITICAL
  - `UserRole`: ADMIN, OPERATOR, VIEWER

- ✅ **Características avanzadas**:
  - Campos JSONB para configuraciones complejas
  - Índices optimizados para queries frecuentes
  - Relaciones con CASCADE (Service → Incidents/SLOs)
  - Timestamps automáticos (createdAt, updatedAt)

### 2. **Repositorios Prisma**

#### IncidentRepositoryPrisma (`src/infrastructure/repositories/incident.repository.prisma.ts`)
```typescript
✅ save(incident): Upsert de incidentes
✅ update(incident): Actualización de incidentes
✅ findById(id): Búsqueda por ID
✅ findByServiceId(serviceId): Incidentes por servicio
✅ findActiveByService(serviceId): Incidente activo de un servicio
✅ findByStatus(status): Búsqueda por estado
✅ findBySeverity(severity): Búsqueda por severidad
✅ findAll(skip, take): Paginación
✅ getStatistics(): Estadísticas agregadas (total, activos, MTTR, por severidad)
✅ delete(id): Eliminación
```

**Características**:
- Mapeo bidireccional entre modelos Prisma y entidades de dominio
- Queries optimizadas con índices
- Agregaciones para estadísticas en tiempo real

#### SLORepositoryPrisma (`src/infrastructure/repositories/slo.repository.prisma.ts`)
```typescript
✅ save(slo): Upsert de SLOs
✅ update(slo): Actualización de SLOs
✅ findById(id): Búsqueda por ID
✅ findByServiceId(serviceId): SLOs por servicio
✅ findEnabled(): SLOs habilitados
✅ getAll(): Todos los SLOs
✅ deleteById(id): Eliminación
✅ saveStatus(status): Guardar status + actualizar cache
✅ getLatestStatus(sloId): Último status calculado
✅ getStatusHistory(sloId, limit): Historial temporal
```

**Características**:
- Cache de status actual en tabla SLO para queries rápidas
- Historial completo en tabla separada para análisis
- Mapeo de enums y tipos complejos

#### ServiceRepositoryPrisma (`src/infrastructure/repositories/service.repository.prisma.ts`)
```typescript
✅ save(service): Upsert de servicios
✅ update(service): Actualización
✅ findById(id): Búsqueda por ID
✅ findByEnabled(enabled): Por estado habilitado/deshabilitado
✅ findByCritical(critical): Servicios críticos
✅ findByTags(tags): Búsqueda por tags
✅ getAll(): Todos los servicios
✅ deleteById(id): Eliminación
✅ updateLastCheck(id, status, timestamp): Actualizar último chequeo
```

**Características**:
- Soporte para configuraciones JSONB (healthCheck, alertConfig)
- Búsqueda por arrays de tags
- Gestión dinámica de servicios desde dashboard

### 3. **Integración con Servidor**

#### Inicialización Condicional (`src/presentation/server.ts`)
```typescript
const dbEnabled = process.env.DB_ENABLED === 'true';

if (dbEnabled) {
    await PrismaService.connect();

    // Usar repositorios Prisma
    incidentRepository = new IncidentRepositoryPrisma();
    sloRepository = new SLORepositoryPrisma();
} else {
    // Fallback a filesystem
    incidentRepository = new IncidentRepositoryImpl();
    sloRepository = new SLORepositoryImpl();
}
```

**Características**:
- ✅ **Inicialización automática** al arrancar
- ✅ **Fallback inteligente** si falla conexión
- ✅ **Health check** de PostgreSQL
- ✅ **Cleanup graceful** al detener (SIGTERM/SIGINT)
- ✅ **100% compatible** con implementación anterior

### 4. **Migraciones y Seed**

#### Migración Inicial (`prisma/migrations/00_init/migration.sql`)
```sql
✅ Creación de 6 enums
✅ Creación de 5 tablas con constraints
✅ 8 índices para optimización
✅ Foreign keys con CASCADE
✅ Campos JSONB para flexibilidad
```

#### Script de Seed (`prisma/seed.ts`)
```typescript
✅ Migración desde config/services.json → PostgreSQL
✅ Migración desde data/incidents/*.json → PostgreSQL
✅ Migración desde data/slos/slos.json → PostgreSQL
✅ Creación de servicios de ejemplo si no hay datos
✅ Creación de usuario admin por defecto
```

**Uso**:
```bash
npm run prisma:seed
```

### 5. **Configuración Docker**

#### docker-compose.yml
```yaml
✅ PostgreSQL 15 Alpine
✅ Healthcheck automático
✅ Volúmenes persistentes
✅ Variables de entorno configuradas
✅ DATABASE_URL para Prisma
✅ Dependencias correctas (backend espera a postgres)
```

## 🚀 Instalación y Uso

### 1. Configurar Variables de Entorno

```bash
# .env
DB_ENABLED=true
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/noc_monitoring?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=noc_monitoring
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_LOGGING=false
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Iniciar PostgreSQL

**Opción A: Docker Compose**
```bash
docker-compose up -d postgres
```

**Opción B: PostgreSQL Local**
```bash
# Asegúrate de tener PostgreSQL corriendo
# Crea la base de datos
createdb noc_monitoring
```

### 4. Ejecutar Migraciones

```bash
npm run prisma:migrate
```

O aplicar migración manual:
```bash
psql -U postgres -d noc_monitoring -f prisma/migrations/00_init/migration.sql
```

### 5. Ejecutar Seed (Opcional)

```bash
npm run prisma:seed
```

### 6. Generar Prisma Client

```bash
npm run prisma:generate
```

### 7. Iniciar Aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📊 Scripts NPM Disponibles

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:studio": "prisma studio",
  "prisma:seed": "ts-node prisma/seed.ts",
  "db:push": "prisma db push",
  "db:reset": "prisma migrate reset"
}
```

### Comandos Útiles

```bash
# Ver base de datos con UI
npm run prisma:studio

# Resetear base de datos
npm run db:reset

# Push cambios de schema sin migración
npm run db:push
```

## 🔄 Modo Híbrido

El sistema soporta **dos modos de operación**:

### Modo PostgreSQL (Recomendado)
```bash
DB_ENABLED=true
```
- ✅ Persistencia en PostgreSQL
- ✅ Queries optimizadas con índices
- ✅ Relaciones y constraints
- ✅ Transacciones ACID
- ✅ Escalabilidad

### Modo Filesystem (Fallback)
```bash
DB_ENABLED=false
```
- ✅ Persistencia en JSON
- ✅ No requiere base de datos
- ✅ Portabilidad
- ✅ Simplicidad

**El sistema cambia automáticamente** según la configuración.

## 📈 Arquitectura de Datos

```
┌─────────────────────────────────────────────────────┐
│                  NOC Application                     │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌──────────┐
│ PostgreSQL  │  │  InfluxDB   │  │ FileSystem│
│  (Prisma)   │  │ (Time-Series)│  │  (Logs)  │
└─────────────┘  └─────────────┘  └──────────┘
      │                 │                │
      ▼                 ▼                ▼
  Services         Metrics           Logs
  Incidents        Response Times    Errors
  SLOs            Availability %     Debug Info
  Users           Error Rates
```

## 🗂️ Estructura de Archivos

```
app-NOC/
├── prisma/
│   ├── schema.prisma                 # Schema de Prisma
│   ├── migrations/
│   │   └── 00_init/
│   │       └── migration.sql         # Migración inicial
│   └── seed.ts                       # Script de seed
│
├── src/
│   ├── domain/
│   │   └── repository/
│   │       ├── incident.repository.ts      # Interface
│   │       ├── slo.repository.ts          # Interface
│   │       └── service.repository.ts      # Interface (nuevo)
│   │
│   └── infrastructure/
│       ├── config/
│       │   └── prisma.config.ts           # Prisma singleton
│       │
│       └── repositories/
│           ├── incident.repository.prisma.ts   # Implementación Prisma
│           ├── slo.repository.prisma.ts       # Implementación Prisma
│           ├── service.repository.prisma.ts   # Implementación Prisma
│           ├── incident.repository.impl.ts    # Implementación JSON
│           └── slo.repository.impl.ts         # Implementación JSON
│
├── docker-compose.yml                # Stack completo (Postgres + InfluxDB + App)
└── .env.example                     # Variables de entorno
```

## 🔍 Ejemplos de Uso

### Guardar un Servicio

```typescript
import { ServiceRepositoryPrisma } from './infrastructure/repositories/service.repository.prisma';

const serviceRepo = new ServiceRepositoryPrisma();

await serviceRepo.save({
  id: 'api-gateway',
  name: 'API Gateway',
  url: 'https://api.example.com/health',
  interval: '*/30 * * * * *',
  critical: true,
  enabled: true,
  tags: ['api', 'critical'],
  healthCheck: {
    expectedStatus: [200, 201],
    maxResponseTime: 2000
  }
});
```

### Obtener Incidentes Activos

```typescript
import { IncidentRepositoryPrisma } from './infrastructure/repositories/incident.repository.prisma';

const incidentRepo = new IncidentRepositoryPrisma();

const activeIncidents = await incidentRepo.findByStatus('in_progress');
console.log(`Incidentes activos: ${activeIncidents.length}`);
```

### Calcular SLO con Historial

```typescript
import { SLORepositoryPrisma } from './infrastructure/repositories/slo.repository.prisma';

const sloRepo = new SLORepositoryPrisma();

// Guardar status
await sloRepo.saveStatus({
  sloId: 'api-availability-99',
  sloName: 'API Availability 99.9%',
  serviceId: 'api-gateway',
  serviceName: 'API Gateway',
  currentValue: 99.95,
  target: 99.9,
  compliance: true,
  errorBudget: 43.2,
  errorBudgetTotal: 43.2,
  errorBudgetUsed: 0,
  burnRate: 0,
  violationRisk: 'none',
  window: '30d',
  sliType: 'availability',
  calculatedAt: new Date()
});

// Obtener historial
const history = await sloRepo.getStatusHistory('api-availability-99', 100);
```

### Obtener Estadísticas de Incidentes

```typescript
const stats = await incidentRepo.getStatistics();

console.log(`Total incidentes: ${stats.total}`);
console.log(`Activos: ${stats.active}`);
console.log(`Resueltos: ${stats.resolved}`);
console.log(`MTTR: ${stats.mttr} minutos`);
console.log(`Por severidad:`, stats.bySeverity);
// {
//   critical: 5,
//   high: 12,
//   medium: 23,
//   low: 8
// }
```

## 🎯 Ventajas de Prisma ORM

1. **Type Safety**: Tipos generados automáticamente
2. **Migrations**: Control de versiones del schema
3. **Query Builder**: API intuitiva y type-safe
4. **Relaciones**: Fácil navegación entre entidades
5. **Performance**: Queries optimizadas
6. **Prisma Studio**: UI para explorar datos
7. **Multi-DB**: Soporte para PostgreSQL, MySQL, SQLite, etc.

## 🔧 Troubleshooting

### Error: Cannot connect to PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: Prisma Client not generated

```bash
# Generar Prisma Client
npm run prisma:generate
```

### Error: Migration failed

```bash
# Ver estado de migraciones
npx prisma migrate status

# Resetear y re-migrar
npm run db:reset
npm run prisma:migrate
```

### Limpiar y Empezar de Cero

```bash
# 1. Detener servicios
docker-compose down -v

# 2. Eliminar datos
rm -rf data/

# 3. Iniciar PostgreSQL
docker-compose up -d postgres

# 4. Ejecutar migraciones
npm run prisma:migrate

# 5. Ejecutar seed
npm run prisma:seed

# 6. Iniciar aplicación
npm run dev
```

## 📚 Referencias

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript](https://www.typescriptlang.org/docs/)

## 🚦 Estado del Proyecto

### ✅ Completado

- [x] Instalación de Prisma
- [x] Schema de Prisma con todos los modelos
- [x] Configuración de Prisma Client (singleton)
- [x] IncidentRepositoryPrisma completo
- [x] SLORepositoryPrisma completo
- [x] ServiceRepositoryPrisma completo
- [x] Integración con server.ts
- [x] Migración SQL inicial
- [x] Script de seed
- [x] Docker Compose actualizado
- [x] Documentación completa

### 🚧 Pendiente

- [ ] Frontend Vue.js completo
- [ ] Endpoints REST para CRUD de servicios
- [ ] Autenticación de usuarios
- [ ] Tests unitarios para repositorios
- [ ] Tests de integración con PostgreSQL

## 📝 Próximos Pasos

1. **Completar Frontend Vue.js**: Dashboard interactivo con Vue 3 + Vite
2. **Endpoints REST**: API completa para gestión de servicios, incidentes y SLOs
3. **Autenticación**: Sistema de login con JWT
4. **WebSockets**: Notificaciones en tiempo real
5. **Tests**: Cobertura completa de repositorios

---

**Fase 7 - Prisma ORM Integration** ✅ **COMPLETADA**

Sistema de persistencia PostgreSQL totalmente funcional con Prisma ORM, arquitectura híbrida, y compatibilidad completa con la implementación anterior.
