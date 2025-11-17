import { Incident, IncidentStatus, IncidentSeverity } from '../../domain/entities/incident.entity';
import { IncidentRepository } from '../../domain/repository/incident.repository';
import { prisma } from '../config/prisma.config';
import { Severity, IncidentStatus as PrismaIncidentStatus } from '../types/prisma-enums';

/**
 * Incident Repository - Prisma Implementation
 *
 * Implementación del repositorio de incidentes usando Prisma ORM
 */
export class IncidentRepositoryPrisma implements IncidentRepository {

    /**
     * Guarda un incidente en PostgreSQL
     */
    async save(incident: Incident): Promise<Incident> {
        const data = {
            id: incident.id,
            serviceId: incident.serviceId,
            serviceName: incident.serviceName,
            severity: this.mapSeverityToPrisma(incident.severity),
            status: this.mapStatusToPrisma(incident.status),
            description: incident.description,
            estimatedImpact: incident.estimatedImpact,
            affectedChecks: incident.affectedChecks,
            timeline: incident.timeline as any,
            metadata: incident.metadata as any,
            resolvedAt: incident.resolvedAt,
            closedAt: incident.closedAt,
            resolutionTimeMinutes: incident.resolutionTimeMinutes,
        };

        const saved = await prisma.incident.upsert({
            where: { id: incident.id },
            update: data,
            create: data,
        });

        return this.mapPrismaToDomain(saved);
    }

    /**
     * Actualiza un incidente existente
     */
    async update(incident: Incident): Promise<Incident> {
        const updated = await prisma.incident.update({
            where: { id: incident.id },
            data: {
                status: this.mapStatusToPrisma(incident.status),
                affectedChecks: incident.affectedChecks,
                timeline: incident.timeline as any,
                metadata: incident.metadata as any,
                resolvedAt: incident.resolvedAt,
                closedAt: incident.closedAt,
                resolutionTimeMinutes: incident.resolutionTimeMinutes,
            },
        });

        return this.mapPrismaToDomain(updated);
    }

    /**
     * Busca un incidente por ID
     */
    async findById(id: string): Promise<Incident | null> {
        const incident = await prisma.incident.findUnique({
            where: { id },
        });

        return incident ? this.mapPrismaToDomain(incident) : null;
    }

    /**
     * Busca incidentes por servicio
     */
    async findByServiceId(serviceId: string): Promise<Incident[]> {
        const incidents = await prisma.incident.findMany({
            where: { serviceId },
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map((i: any) => this.mapPrismaToDomain(i));
    }

    /**
     * Busca un incidente activo por servicio
     */
    async findActiveByService(serviceId: string): Promise<Incident | null> {
        const incident = await prisma.incident.findFirst({
            where: {
                serviceId,
                status: {
                    in: [
                        PrismaIncidentStatus.NEW,
                        PrismaIncidentStatus.INVESTIGATING,
                        PrismaIncidentStatus.IN_PROGRESS,
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return incident ? this.mapPrismaToDomain(incident) : null;
    }

    /**
     * Busca incidentes por estado
     */
    async findByStatus(status: IncidentStatus[]): Promise<Incident[]> {
        const incidents = await prisma.incident.findMany({
            where: {
                status: {
                    in: status.map(s => this.mapStatusToPrisma(s))
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map((i: any) => this.mapPrismaToDomain(i));
    }

    /**
     * Busca incidentes por severidad
     */
    async findBySeverity(severity: IncidentSeverity): Promise<Incident[]> {
        const incidents = await prisma.incident.findMany({
            where: { severity: this.mapSeverityToPrisma(severity) },
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map((i: any) => this.mapPrismaToDomain(i));
    }

    /**
     * Obtiene todos los incidentes
     */
    async getAll(): Promise<Incident[]> {
        const incidents = await prisma.incident.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map((i: any) => this.mapPrismaToDomain(i));
    }

    /**
     * Obtiene estadísticas de incidentes
     */
    async getStatistics(): Promise<any> {
        const [total, active, resolved, bySeverity, avgResolutionTime] = await Promise.all([
            // Total de incidentes
            prisma.incident.count(),

            // Incidentes activos
            prisma.incident.count({
                where: {
                    status: {
                        in: [
                            PrismaIncidentStatus.NEW,
                            PrismaIncidentStatus.INVESTIGATING,
                            PrismaIncidentStatus.IN_PROGRESS,
                        ],
                    },
                },
            }),

            // Incidentes resueltos
            prisma.incident.count({
                where: {
                    status: {
                        in: [PrismaIncidentStatus.RESOLVED, PrismaIncidentStatus.CLOSED],
                    },
                },
            }),

            // Por severidad
            prisma.incident.groupBy({
                by: ['severity'],
                _count: true,
            }),

            // Tiempo promedio de resolución
            prisma.incident.aggregate({
                where: {
                    resolutionTimeMinutes: { not: null },
                },
                _avg: {
                    resolutionTimeMinutes: true,
                },
            }),
        ]);

        const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        bySeverity.forEach((item: any) => {
            const severity = item.severity.toLowerCase() as keyof typeof severityCounts;
            severityCounts[severity] = item._count;
        });

        return {
            total,
            active,
            resolved,
            mttr: avgResolutionTime._avg.resolutionTimeMinutes || 0,
            bySeverity: severityCounts,
        };
    }

    /**
     * Elimina un incidente por ID
     */
    async deleteById(id: string): Promise<boolean> {
        try {
            await prisma.incident.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Busca incidentes por rango de fechas
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<Incident[]> {
        const incidents = await prisma.incident.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map((i: any) => this.mapPrismaToDomain(i));
    }

    // ============================================================
    // Métodos de mapeo
    // ============================================================

    private mapPrismaToDomain(prismaIncident: any): Incident {
        return {
            id: prismaIncident.id,
            serviceId: prismaIncident.serviceId,
            serviceName: prismaIncident.serviceName,
            severity: prismaIncident.severity.toLowerCase() as IncidentSeverity,
            status: this.mapPrismaStatusToDomain(prismaIncident.status),
            description: prismaIncident.description,
            estimatedImpact: prismaIncident.estimatedImpact,
            affectedChecks: prismaIncident.affectedChecks,
            timeline: prismaIncident.timeline,
            metadata: prismaIncident.metadata,
            createdAt: prismaIncident.createdAt,
            updatedAt: prismaIncident.updatedAt,
            resolvedAt: prismaIncident.resolvedAt,
            closedAt: prismaIncident.closedAt,
            resolutionTimeMinutes: prismaIncident.resolutionTimeMinutes,
        };
    }

    private mapSeverityToPrisma(severity: IncidentSeverity): Severity {
        const map: Record<IncidentSeverity, Severity> = {
            critical: Severity.CRITICAL,
            high: Severity.HIGH,
            medium: Severity.MEDIUM,
            low: Severity.LOW,
        };
        return map[severity];
    }

    private mapStatusToPrisma(status: IncidentStatus): PrismaIncidentStatus {
        const map: Record<IncidentStatus, PrismaIncidentStatus> = {
            new: PrismaIncidentStatus.NEW,
            investigating: PrismaIncidentStatus.INVESTIGATING,
            in_progress: PrismaIncidentStatus.IN_PROGRESS,
            resolved: PrismaIncidentStatus.RESOLVED,
            closed: PrismaIncidentStatus.CLOSED,
        };
        return map[status];
    }

    private mapPrismaStatusToDomain(status: PrismaIncidentStatus): IncidentStatus {
        return status.toLowerCase().replace('_', '-') as IncidentStatus;
    }
}
