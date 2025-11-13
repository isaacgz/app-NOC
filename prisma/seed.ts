import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Script de seed para la base de datos
 *
 * Este script:
 * 1. Carga servicios desde config/services.json si existe
 * 2. Migra datos existentes de JSON a PostgreSQL
 * 3. Crea datos de ejemplo si no hay datos
 */
async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ============================================================
  // 1. Migrar Servicios
  // ============================================================
  await migrateServices();

  // ============================================================
  // 2. Migrar Incidentes
  // ============================================================
  await migrateIncidents();

  // ============================================================
  // 3. Migrar SLOs
  // ============================================================
  await migrateSLOs();

  // ============================================================
  // 4. Crear usuario admin por defecto
  // ============================================================
  await createDefaultUser();

  console.log('✅ Seed completado exitosamente');
}

/**
 * Migra servicios desde config/services.json a PostgreSQL
 */
async function migrateServices() {
  const servicesPath = path.join(__dirname, '../config/services.json');

  if (!fs.existsSync(servicesPath)) {
    console.log('⚠️  No se encontró config/services.json');
    console.log('📝 Creando servicios de ejemplo...');
    await createSampleServices();
    return;
  }

  try {
    const data = fs.readFileSync(servicesPath, 'utf-8');
    const config = JSON.parse(data);
    const services = config.services || [];

    console.log(`📦 Migrando ${services.length} servicios...`);

    for (const service of services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          description: service.description || null,
          url: service.url,
          interval: service.interval,
          critical: service.critical || false,
          enabled: service.enabled !== false,
          tags: service.tags || [],
          healthCheck: service.healthCheck || null,
          alertConfig: service.alerts || null,
        },
        create: {
          id: service.id,
          name: service.name,
          description: service.description || null,
          url: service.url,
          method: 'http',
          interval: service.interval,
          critical: service.critical || false,
          enabled: service.enabled !== false,
          tags: service.tags || [],
          healthCheck: service.healthCheck || null,
          alertConfig: service.alerts || null,
        },
      });
    }

    console.log(`✅ ${services.length} servicios migrados`);
  } catch (error) {
    console.error('❌ Error migrando servicios:', error);
  }
}

/**
 * Migra incidentes desde data/incidents/*.json a PostgreSQL
 */
async function migrateIncidents() {
  const incidentsDir = path.join(__dirname, '../data/incidents');

  if (!fs.existsSync(incidentsDir)) {
    console.log('⚠️  No se encontró directorio de incidentes');
    return;
  }

  try {
    const files = fs.readdirSync(incidentsDir).filter(f => f.endsWith('.json'));
    console.log(`📦 Migrando incidentes desde ${files.length} archivos...`);

    let totalIncidents = 0;

    for (const file of files) {
      const filePath = path.join(incidentsDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      const incidents = JSON.parse(data);

      for (const incident of incidents) {
        await prisma.incident.upsert({
          where: { id: incident.id },
          update: {
            serviceName: incident.serviceName,
            severity: incident.severity.toUpperCase(),
            status: incident.status.toUpperCase().replace('-', '_'),
            description: incident.description,
            estimatedImpact: incident.estimatedImpact || null,
            affectedChecks: incident.affectedChecks || 0,
            timeline: incident.timeline || [],
            metadata: incident.metadata || null,
            resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
            closedAt: incident.closedAt ? new Date(incident.closedAt) : null,
            resolutionTimeMinutes: incident.resolutionTimeMinutes || null,
            updatedAt: incident.updatedAt ? new Date(incident.updatedAt) : new Date(),
          },
          create: {
            id: incident.id,
            serviceId: incident.serviceId,
            serviceName: incident.serviceName,
            severity: incident.severity.toUpperCase(),
            status: incident.status.toUpperCase().replace('-', '_'),
            description: incident.description,
            estimatedImpact: incident.estimatedImpact || null,
            affectedChecks: incident.affectedChecks || 0,
            timeline: incident.timeline || [],
            metadata: incident.metadata || null,
            resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
            closedAt: incident.closedAt ? new Date(incident.closedAt) : null,
            resolutionTimeMinutes: incident.resolutionTimeMinutes || null,
            createdAt: incident.createdAt ? new Date(incident.createdAt) : new Date(),
          },
        });
        totalIncidents++;
      }
    }

    console.log(`✅ ${totalIncidents} incidentes migrados`);
  } catch (error) {
    console.error('❌ Error migrando incidentes:', error);
  }
}

/**
 * Migra SLOs desde data/slos/slos.json a PostgreSQL
 */
async function migrateSLOs() {
  const slosPath = path.join(__dirname, '../data/slos/slos.json');

  if (!fs.existsSync(slosPath)) {
    console.log('⚠️  No se encontró data/slos/slos.json');
    return;
  }

  try {
    const data = fs.readFileSync(slosPath, 'utf-8');
    const slos = JSON.parse(data);

    console.log(`📦 Migrando ${slos.length} SLOs...`);

    for (const slo of slos) {
      await prisma.sLO.upsert({
        where: { id: slo.id },
        update: {
          name: slo.name,
          description: slo.description || null,
          target: slo.target,
          window: mapSLOWindow(slo.window),
          sliType: mapSLIType(slo.sliType),
          threshold: slo.threshold || null,
          enabled: slo.enabled !== false,
          updatedAt: slo.updatedAt ? new Date(slo.updatedAt) : new Date(),
        },
        create: {
          id: slo.id,
          serviceId: slo.serviceId,
          name: slo.name,
          description: slo.description || null,
          target: slo.target,
          window: mapSLOWindow(slo.window),
          sliType: mapSLIType(slo.sliType),
          threshold: slo.threshold || null,
          enabled: slo.enabled !== false,
          createdAt: slo.createdAt ? new Date(slo.createdAt) : new Date(),
        },
      });
    }

    console.log(`✅ ${slos.length} SLOs migrados`);
  } catch (error) {
    console.error('❌ Error migrando SLOs:', error);
  }
}

/**
 * Crea un usuario admin por defecto
 */
async function createDefaultUser() {
  try {
    await prisma.user.upsert({
      where: { email: 'admin@noc.local' },
      update: {},
      create: {
        email: 'admin@noc.local',
        name: 'Administrator',
        password: '$2a$10$PLACEHOLDER_HASH', // Cambiar en producción
        role: 'ADMIN',
        active: true,
      },
    });

    console.log('✅ Usuario admin creado');
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  }
}

/**
 * Crea servicios de ejemplo
 */
async function createSampleServices() {
  const sampleServices = [
    {
      id: 'google',
      name: 'Google',
      description: 'Google Search Engine',
      url: 'https://www.google.com',
      interval: '*/30 * * * * *',
      critical: false,
      enabled: true,
      tags: ['web', 'search'],
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'GitHub Platform',
      url: 'https://github.com',
      interval: '*/60 * * * * *',
      critical: true,
      enabled: true,
      tags: ['web', 'development'],
    },
  ];

  for (const service of sampleServices) {
    await prisma.service.create({
      data: {
        ...service,
        method: 'http',
      },
    });
  }

  console.log(`✅ ${sampleServices.length} servicios de ejemplo creados`);
}

/**
 * Helper: Mapea SLOWindow a formato Prisma
 */
function mapSLOWindow(window: string): string {
  const map: Record<string, string> = {
    '1h': 'ONE_HOUR',
    '24h': 'TWENTY_FOUR_HOURS',
    '7d': 'SEVEN_DAYS',
    '30d': 'THIRTY_DAYS',
    '90d': 'NINETY_DAYS',
  };
  return map[window] || 'TWENTY_FOUR_HOURS';
}

/**
 * Helper: Mapea SLIType a formato Prisma
 */
function mapSLIType(sliType: string): string {
  const map: Record<string, string> = {
    'availability': 'AVAILABILITY',
    'latency': 'LATENCY',
    'errorRate': 'ERROR_RATE',
  };
  return map[sliType] || 'AVAILABILITY';
}

// Ejecutar seed
main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
