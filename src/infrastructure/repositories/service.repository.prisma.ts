import { ServiceConfig } from '../../domain/interfaces/service-monitor.interface';
import { ServiceRepository } from '../../domain/repository/service.repository';
import { prisma } from '../config/prisma.config';

/**
 * Service Repository - Prisma Implementation
 *
 * Implementación del repositorio de servicios usando Prisma ORM
 */
export class ServiceRepositoryPrisma implements ServiceRepository {

    /**
     * Guarda un servicio en PostgreSQL
     */
    async save(service: ServiceConfig): Promise<ServiceConfig> {
        const data = {
            id: service.id,
            name: service.name,
            description: service.description || null,
            url: service.url,
            method: 'http', // Default method for compatibility
            interval: service.interval,
            critical: service.critical || false,
            enabled: service.enabled !== false, // Default to true
            tags: service.tags || [],
            healthCheck: service.healthCheck ? (service.healthCheck as any) : null,
            alertConfig: service.alerts ? (service.alerts as any) : null,
        };

        const saved = await prisma.service.upsert({
            where: { id: service.id },
            update: data,
            create: data,
        });

        return this.mapPrismaToDomain(saved);
    }

    /**
     * Actualiza un servicio existente
     */
    async update(service: ServiceConfig): Promise<ServiceConfig> {
        const updated = await prisma.service.update({
            where: { id: service.id },
            data: {
                name: service.name,
                description: service.description || null,
                url: service.url,
                interval: service.interval,
                critical: service.critical || false,
                enabled: service.enabled !== false,
                tags: service.tags || [],
                healthCheck: service.healthCheck ? (service.healthCheck as any) : null,
                alertConfig: service.alerts ? (service.alerts as any) : null,
            },
        });

        return this.mapPrismaToDomain(updated);
    }

    /**
     * Busca un servicio por ID
     */
    async findById(id: string): Promise<ServiceConfig | null> {
        const service = await prisma.service.findUnique({
            where: { id },
        });

        return service ? this.mapPrismaToDomain(service) : null;
    }

    /**
     * Busca servicios por estado (habilitado/deshabilitado)
     */
    async findByEnabled(enabled: boolean): Promise<ServiceConfig[]> {
        const services = await prisma.service.findMany({
            where: { enabled },
            orderBy: { name: 'asc' },
        });

        return services.map((s: any) => this.mapPrismaToDomain(s));
    }

    /**
     * Busca servicios críticos
     */
    async findByCritical(critical: boolean): Promise<ServiceConfig[]> {
        const services = await prisma.service.findMany({
            where: { critical },
            orderBy: { name: 'asc' },
        });

        return services.map((s: any) => this.mapPrismaToDomain(s));
    }

    /**
     * Busca servicios por tags
     */
    async findByTags(tags: string[]): Promise<ServiceConfig[]> {
        const services = await prisma.service.findMany({
            where: {
                tags: {
                    hasSome: tags,
                },
            },
            orderBy: { name: 'asc' },
        });

        return services.map((s: any) => this.mapPrismaToDomain(s));
    }

    /**
     * Obtiene todos los servicios
     */
    async getAll(): Promise<ServiceConfig[]> {
        const services = await prisma.service.findMany({
            orderBy: { name: 'asc' },
        });

        return services.map((s: any) => this.mapPrismaToDomain(s));
    }

    /**
     * Elimina un servicio
     */
    async deleteById(id: string): Promise<boolean> {
        try {
            await prisma.service.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Actualiza el último chequeo de un servicio
     */
    async updateLastCheck(id: string, status: string, timestamp: Date): Promise<void> {
        await prisma.service.update({
            where: { id },
            data: {
                lastStatus: status,
                lastCheckAt: timestamp,
            },
        });
    }

    // ============================================================
    // Métodos de mapeo
    // ============================================================

    private mapPrismaToDomain(prismaService: any): ServiceConfig {
        const service: ServiceConfig = {
            id: prismaService.id,
            name: prismaService.name,
            url: prismaService.url,
            interval: prismaService.interval,
            critical: prismaService.critical,
            enabled: prismaService.enabled,
        };

        // Optional fields
        if (prismaService.description) {
            service.description = prismaService.description;
        }

        if (prismaService.tags && prismaService.tags.length > 0) {
            service.tags = prismaService.tags;
        }

        if (prismaService.healthCheck) {
            service.healthCheck = prismaService.healthCheck;
        }

        if (prismaService.alertConfig) {
            service.alerts = prismaService.alertConfig;
        }

        return service;
    }
}
