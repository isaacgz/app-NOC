# 📊 Guía de Reportes Empresariales - NOC System

## Descripción General

El sistema de reportes empresariales ha sido mejorado significativamente para proporcionar reportes profesionales de nivel empresarial con múltiples formatos y niveles de detalle.

## 🎯 Características Principales

### 1. **Tres Niveles de Reportes**

#### **Ejecutivo** (`executive`)
- Enfocado en KPIs y métricas de alto nivel
- Ideal para directivos y management
- Contenido: Disponibilidad del sistema, total de eventos, eventos críticos
- Formato: Dashboard visual con métricas clave

#### **Técnico** (`technical`)
- Análisis detallado con información completa
- Ideal para equipos de desarrollo y DevOps
- Contenido: Todos los eventos, stack traces, análisis por origen
- Formato: Tablas detalladas con logs completos

#### **Operaciones** (`operations`)
- Métricas operacionales y estado del sistema
- Ideal para equipos de soporte y operaciones
- Contenido: Estado del sistema, eventos críticos, métricas de rendimiento
- Formato: Dashboard operacional con alertas

### 2. **Formatos de Exportación**

- **HTML Email**: Reporte embebido en el correo con diseño responsive
- **PDF**: Documento PDF profesional con branding corporativo
- **Excel**: Hojas de cálculo con múltiples pestañas y análisis detallado
- **Logs adjuntos**: Archivos .log originales del sistema

### 3. **Estadísticas Avanzadas**

El sistema calcula automáticamente:
- Total de eventos por severidad (Low, Medium, High)
- Porcentajes de distribución
- Uptime y disponibilidad del sistema
- Componente más activo
- Tendencias temporales
- Tasa de éxito de chequeos

### 4. **Visualización de Datos**

- Gráficos de pastel para distribución por severidad
- Gráficos de barras para comparativas
- Indicadores de progreso visuales
- Código de colores por severidad

## ⚙️ Configuración

### Variables de Entorno

Edita tu archivo `.env` con las siguientes configuraciones:

```env
# Configuración de Email
MAILER_SERVICE=gmail
MAILER_EMAIL=tu-email@gmail.com
MAILER_SECRET_KEY=tu-app-password

# Configuración de Reportes Empresariales
REPORT_LEVEL=operations           # executive, technical, operations
REPORT_INCLUDE_PDF=true           # Generar PDF adjunto
REPORT_INCLUDE_EXCEL=true         # Generar Excel adjunto
COMPANY_NAME=Mi Empresa SA        # Nombre de tu empresa
REPORT_PERIOD=Últimas 24 horas    # Descripción del período
```

### Niveles de Reporte Disponibles

- `executive`: Reporte ejecutivo (KPIs y resumen)
- `technical`: Reporte técnico (análisis detallado)
- `operations`: Reporte operacional (estado del sistema)

## 💻 Uso Programático

### Ejemplo 1: Usar Configuración de Variables de Entorno

```typescript
import { EmailService } from './presentation/email/email.service';
import { SendEnterpriseReport } from './domain/use-cases/email/send-enterprise-report';
import { LogRepositoryImpl } from './infrastructure/repositories/log.repository.impl';
import { FileSystemDatasource } from './infrastructure/datasources/file-system.datasource';

// Configurar dependencias
const logRepository = new LogRepositoryImpl(
    new FileSystemDatasource()
);

const emailService = new EmailService();
const sendEnterpriseReport = new SendEnterpriseReport(
    emailService,
    logRepository
);

// Enviar reporte usando configuración de .env
await sendEnterpriseReport.execute('destinatario@empresa.com');
```

### Ejemplo 2: Configuración Personalizada

```typescript
import { ReportLevel } from './presentation/email/report-template.generator';

// Enviar reporte ejecutivo con PDF y Excel
await sendEnterpriseReport.executeWithOptions({
    to: 'ceo@empresa.com',
    reportLevel: ReportLevel.EXECUTIVE,
    includePDF: true,
    includeExcel: true,
    companyName: 'Acme Corporation',
    reportPeriod: 'Semana del 12-18 Nov 2025'
});
```

### Ejemplo 3: Múltiples Destinatarios

```typescript
// Enviar a múltiples destinatarios
await sendEnterpriseReport.execute([
    'operaciones@empresa.com',
    'soporte@empresa.com',
    'manager@empresa.com'
]);
```

### Ejemplo 4: Diferentes Reportes para Diferentes Audiencias

```typescript
import { ReportLevel } from './presentation/email/report-template.generator';

// Reporte ejecutivo para management
await sendEnterpriseReport.executeWithOptions({
    to: 'ceo@empresa.com',
    reportLevel: ReportLevel.EXECUTIVE,
    includePDF: true,
    companyName: 'Mi Empresa',
    reportPeriod: 'Reporte Mensual - Noviembre 2025'
});

// Reporte técnico para DevOps
await sendEnterpriseReport.executeWithOptions({
    to: 'devops@empresa.com',
    reportLevel: ReportLevel.TECHNICAL,
    includePDF: true,
    includeExcel: true,
    companyName: 'Mi Empresa',
    reportPeriod: 'Análisis Diario'
});

// Reporte operacional para soporte
await sendEnterpriseReport.executeWithOptions({
    to: 'soporte@empresa.com',
    reportLevel: ReportLevel.OPERATIONS,
    companyName: 'Mi Empresa',
    reportPeriod: 'Últimas 24 horas'
});
```

## 📋 Estructura de Reportes

### Reporte Ejecutivo Incluye:
- ✅ KPI de disponibilidad del sistema
- ✅ Total de eventos
- ✅ Eventos críticos destacados
- ✅ Distribución por severidad
- ✅ Estado general del sistema

### Reporte Técnico Incluye:
- ✅ Métricas completas del sistema
- ✅ Top 10 eventos críticos con detalles
- ✅ Últimos 20 eventos de todos los niveles
- ✅ Tabla de distribución por severidad
- ✅ Análisis por origen/componente
- ✅ Detalles de chequeos exitosos/fallidos

### Reporte de Operaciones Incluye:
- ✅ Dashboard operacional con métricas clave
- ✅ Estado del sistema (OK/Atención)
- ✅ Resumen detallado por severidad
- ✅ Eventos críticos recientes
- ✅ Información temporal (primer/último evento)
- ✅ Componente más activo

## 📄 Formatos de Salida

### HTML Email
- Diseño responsive para móviles y desktop
- Código de colores por severidad
- Tablas profesionales con bordes
- Footer corporativo automático

### PDF
- Diseño profesional con fuentes Helvetica
- Gráficos de progreso visuales
- Código de colores consistente
- Múltiples páginas organizadas
- Tablas formateadas
- Headers y footers corporativos

### Excel
- **Hoja 1**: Resumen ejecutivo con KPIs
- **Hoja 2**: Todos los eventos con filtros
- **Hoja 3**: Eventos críticos destacados
- **Hoja 4**: Análisis por origen y severidad
- Código de colores en celdas
- Headers con formato profesional
- Filtros automáticos habilitados

## 🔧 Integración con Cron Jobs

```typescript
import { CronJob } from 'cron';

// Enviar reporte diario a las 8 AM
const dailyReport = new CronJob('0 8 * * *', async () => {
    console.log('Enviando reporte diario...');
    await sendEnterpriseReport.execute('equipo@empresa.com');
});

// Enviar reporte ejecutivo semanal los lunes a las 9 AM
const weeklyExecutiveReport = new CronJob('0 9 * * 1', async () => {
    console.log('Enviando reporte ejecutivo semanal...');
    await sendEnterpriseReport.executeWithOptions({
        to: 'management@empresa.com',
        reportLevel: ReportLevel.EXECUTIVE,
        includePDF: true,
        companyName: 'Mi Empresa',
        reportPeriod: 'Reporte Semanal'
    });
});

dailyReport.start();
weeklyExecutiveReport.start();
```

## 🎨 Personalización

### Cambiar Nombre de la Empresa
```env
COMPANY_NAME=Tu Empresa SA
```

### Cambiar Período de Reporte
```env
REPORT_PERIOD=Reporte Mensual - Noviembre 2025
```

### Activar/Desactivar Formatos
```env
REPORT_INCLUDE_PDF=true    # true para incluir PDF
REPORT_INCLUDE_EXCEL=true  # true para incluir Excel
```

## 🔐 Seguridad

- Los archivos temporales (PDF/Excel) se eliminan automáticamente después del envío
- Los logs originales se mantienen en el servidor
- Las credenciales de email se manejan mediante variables de entorno
- No se exponen datos sensibles en los reportes

## 🚀 Ventajas del Sistema

1. **Profesionalismo**: Reportes de nivel empresarial con diseño corporativo
2. **Flexibilidad**: Múltiples niveles y formatos según la audiencia
3. **Automatización**: Fácil integración con cron jobs
4. **Escalabilidad**: Arquitectura limpia y modular
5. **Análisis**: Estadísticas avanzadas y métricas calculadas automáticamente
6. **Visual**: Gráficos y código de colores para mejor comprensión
7. **Exportable**: PDF y Excel para presentaciones y análisis offline

## 📞 Soporte

Para más información sobre la implementación, consulta los archivos:
- `/src/presentation/email/email.service.ts` - Servicio de email
- `/src/presentation/email/report-template.generator.ts` - Generador de templates
- `/src/domain/services/log-statistics.service.ts` - Servicio de estadísticas
- `/src/presentation/reports/pdf-report.service.ts` - Generador de PDFs
- `/src/presentation/reports/excel-report.service.ts` - Generador de Excel

## 🎯 Próximos Pasos

1. Configura tu archivo `.env` con tus credenciales
2. Elige el nivel de reporte deseado
3. Activa PDF/Excel según necesites
4. Ejecuta tu primera prueba
5. Configura cron jobs para envíos automáticos
6. Personaliza el nombre de tu empresa y períodos

¡Listo! Ahora tienes un sistema de reportes empresariales completo y profesional.
