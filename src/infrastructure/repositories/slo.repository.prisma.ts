import { SLO, SLOStatus, SLOWindow, SLIType } from '../../domain/entities/slo.entity';
import { SLORepository } from '../../domain/repository/slo.repository';
import { prisma } from '../config/prisma.config';
import { SLOWindow as PrismaSLOWindow, SLIType as PrismaSLIType, ViolationRisk } from '@prisma/client';

/**
 * SLO Repository - Prisma Implementation
 *
 * Implementación del repositorio de SLOs usando Prisma ORM
 */
export class SLORepositoryPrisma implements SLORepository {

    /**
     * Guarda un SLO en PostgreSQL
     */
    async save(slo: SLO): Promise<SLO> {
        const data = {
            id: slo.id,
            serviceId: slo.serviceId,
            name: slo.name,
            description: slo.description || null,
            target: slo.target,
            window: this.mapWindowToPrisma(slo.window),
            sliType: this.mapSLITypeToPrisma(slo.sliType),
            threshold: slo.threshold || null,
            enabled: slo.enabled,
        };

        const saved = await prisma.sLO.upsert({
            where: { id: slo.id },
            update: data,
            create: data,
        });

        return this.mapPrismaToDomain(saved);
    }

    /**
     * Actualiza un SLO existente
     */
    async update(slo: SLO): Promise<SLO> {
        const updated = await prisma.sLO.update({
            where: { id: slo.id },
            data: {
                name: slo.name,
                description: slo.description || null,
                target: slo.target,
                window: this.mapWindowToPrisma(slo.window),
                sliType: this.mapSLITypeToPrisma(slo.sliType),
                threshold: slo.threshold || null,
                enabled: slo.enabled,
            },
        });

        return this.mapPrismaToDomain(updated);
    }

    /**
     * Busca un SLO por ID
     */
    async findById(id: string): Promise<SLO | null> {
        const slo = await prisma.sLO.findUnique({
            where: { id },
        });

        return slo ? this.mapPrismaToDomain(slo) : null;
    }

    /**
     * Busca SLOs por servicio
     */
    async findByServiceId(serviceId: string): Promise<SLO[]> {
        const slos = await prisma.sLO.findMany({
            where: { serviceId },
            orderBy: { name: 'asc' },
        });

        return slos.map(s => this.mapPrismaToDomain(s));
    }

    /**
     * Busca SLOs habilitados
     */
    async findEnabled(): Promise<SLO[]> {
        const slos = await prisma.sLO.findMany({
            where: { enabled: true },
            orderBy: { name: 'asc' },
        });

        return slos.map(s => this.mapPrismaToDomain(s));
    }

    /**
     * Obtiene todos los SLOs
     */
    async getAll(): Promise<SLO[]> {
        const slos = await prisma.sLO.findMany({
            orderBy: { name: 'asc' },
        });

        return slos.map(s => this.mapPrismaToDomain(s));
    }

    /**
     * Elimina un SLO
     */
    async deleteById(id: string): Promise<boolean> {
        try {
            // Eliminar historial de status primero
            await prisma.sLOStatusHistory.deleteMany({
                where: { sloId: id },
            });

            // Eliminar SLO
            await prisma.sLO.delete({
                where: { id },
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    // ============================================================
    // SLO Status methods
    // ============================================================

    /**
     * Guarda un registro de status en el historial
     */
    async saveStatus(status: SLOStatus): Promise<SLOStatus> {
        // Guardar en historial
        await prisma.sLOStatusHistory.create({
            data: {
                sloId: status.sloId,
                sloName: status.sloName,
                serviceId: status.serviceId,
                serviceName: status.serviceName,
                currentValue: status.currentValue,
                target: status.target,
                compliance: status.compliance,
                errorBudget: status.errorBudget,
                errorBudgetTotal: status.errorBudgetTotal,
                errorBudgetUsed: status.errorBudgetUsed,
                burnRate: status.burnRate,
                violationRisk: this.mapViolationRiskToPrisma(status.violationRisk),
                window: this.mapWindowToPrisma(status.window),
                sliType: this.mapSLITypeToPrisma(status.sliType),
                calculatedAt: status.calculatedAt,
            },
        });

        // Actualizar el status actual en el SLO (cache)
        await prisma.sLO.update({
            where: { id: status.sloId },
            data: {
                currentValue: status.currentValue,
                compliance: status.compliance,
                errorBudget: status.errorBudget,
                errorBudgetUsed: status.errorBudgetUsed,
                burnRate: status.burnRate,
                violationRisk: this.mapViolationRiskToPrisma(status.violationRisk),
                lastCalculatedAt: status.calculatedAt,
            },
        });

        return status;
    }

    /**
     * Obtiene el último status de un SLO
     */
    async getLatestStatus(sloId: string): Promise<SLOStatus | null> {
        const status = await prisma.sLOStatusHistory.findFirst({
            where: { sloId },
            orderBy: { calculatedAt: 'desc' },
        });

        return status ? this.mapPrismaStatusToDomain(status) : null;
    }

    /**
     * Obtiene el historial de status de un SLO
     */
    async getStatusHistory(sloId: string, limit: number = 100): Promise<SLOStatus[]> {
        const statuses = await prisma.sLOStatusHistory.findMany({
            where: { sloId },
            orderBy: { calculatedAt: 'desc' },
            take: limit,
        });

        return statuses.map(s => this.mapPrismaStatusToDomain(s));
    }

    // ============================================================
    // Métodos de mapeo
    // ============================================================

    private mapPrismaToDomain(prismaSLO: any): SLO {
        return {
            id: prismaSLO.id,
            serviceId: prismaSLO.serviceId,
            name: prismaSLO.name,
            description: prismaSLO.description || '',
            target: Number(prismaSLO.target),
            window: this.mapPrismaWindowToDomain(prismaSLO.window),
            sliType: this.mapPrismaSLITypeToDomain(prismaSLO.sliType),
            threshold: prismaSLO.threshold || undefined,
            enabled: prismaSLO.enabled,
            createdAt: prismaSLO.createdAt,
            updatedAt: prismaSLO.updatedAt,
        };
    }

    private mapPrismaStatusToDomain(prismaStatus: any): SLOStatus {
        return {
            sloId: prismaStatus.sloId,
            sloName: prismaStatus.sloName,
            serviceId: prismaStatus.serviceId,
            serviceName: prismaStatus.serviceName,
            currentValue: Number(prismaStatus.currentValue),
            target: Number(prismaStatus.target),
            compliance: prismaStatus.compliance,
            errorBudget: Number(prismaStatus.errorBudget),
            errorBudgetTotal: Number(prismaStatus.errorBudgetTotal),
            errorBudgetUsed: Number(prismaStatus.errorBudgetUsed),
            burnRate: Number(prismaStatus.burnRate),
            violationRisk: this.mapPrismaViolationRiskToDomain(prismaStatus.violationRisk),
            window: this.mapPrismaWindowToDomain(prismaStatus.window),
            sliType: this.mapPrismaSLITypeToDomain(prismaStatus.sliType),
            calculatedAt: prismaStatus.calculatedAt,
        };
    }

    private mapWindowToPrisma(window: SLOWindow): PrismaSLOWindow {
        const map: Record<SLOWindow, PrismaSLOWindow> = {
            '1h': PrismaSLOWindow.ONE_HOUR,
            '24h': PrismaSLOWindow.TWENTY_FOUR_HOURS,
            '7d': PrismaSLOWindow.SEVEN_DAYS,
            '30d': PrismaSLOWindow.THIRTY_DAYS,
            '90d': PrismaSLOWindow.NINETY_DAYS,
        };
        return map[window];
    }

    private mapPrismaWindowToDomain(window: PrismaSLOWindow): SLOWindow {
        const map: Record<PrismaSLOWindow, SLOWindow> = {
            ONE_HOUR: '1h',
            TWENTY_FOUR_HOURS: '24h',
            SEVEN_DAYS: '7d',
            THIRTY_DAYS: '30d',
            NINETY_DAYS: '90d',
        };
        return map[window];
    }

    private mapSLITypeToPrisma(sliType: SLIType): PrismaSLIType {
        const map: Record<SLIType, PrismaSLIType> = {
            availability: PrismaSLIType.AVAILABILITY,
            latency: PrismaSLIType.LATENCY,
            errorRate: PrismaSLIType.ERROR_RATE,
        };
        return map[sliType];
    }

    private mapPrismaSLITypeToDomain(sliType: PrismaSLIType): SLIType {
        const map: Record<PrismaSLIType, SLIType> = {
            AVAILABILITY: 'availability',
            LATENCY: 'latency',
            ERROR_RATE: 'errorRate',
        };
        return map[sliType];
    }

    private mapViolationRiskToPrisma(risk: 'none' | 'low' | 'medium' | 'high' | 'critical'): ViolationRisk {
        const map: Record<string, ViolationRisk> = {
            none: ViolationRisk.NONE,
            low: ViolationRisk.LOW,
            medium: ViolationRisk.MEDIUM,
            high: ViolationRisk.HIGH,
            critical: ViolationRisk.CRITICAL,
        };
        return map[risk];
    }

    private mapPrismaViolationRiskToDomain(risk: ViolationRisk): 'none' | 'low' | 'medium' | 'high' | 'critical' {
        const map: Record<ViolationRisk, 'none' | 'low' | 'medium' | 'high' | 'critical'> = {
            NONE: 'none',
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical',
        };
        return map[risk];
    }
}
