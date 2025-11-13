import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ServiceEntity } from './service.entity';

/**
 * SLO Entity - PostgreSQL
 *
 * Representa un Service Level Objective
 */
@Entity('slos')
export class SLOEntity {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id!: string;

    @Column({ type: 'varchar', length: 255, name: 'service_id' })
    serviceId!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    target!: number;

    @Column({ type: 'varchar', length: 50 })
    window!: '1h' | '24h' | '7d' | '30d' | '90d';

    @Column({ type: 'varchar', length: 50, name: 'sli_type' })
    sliType!: 'availability' | 'latency' | 'errorRate';

    @Column({ type: 'int', nullable: true })
    threshold?: number;

    @Column({ type: 'boolean', default: true })
    enabled!: boolean;

    // Estado actual del SLO (cache)
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'current_value' })
    currentValue?: number;

    @Column({ type: 'boolean', nullable: true })
    compliance?: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'error_budget' })
    errorBudget?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'error_budget_used' })
    errorBudgetUsed?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'burn_rate' })
    burnRate?: number;

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'violation_risk' })
    violationRisk?: 'none' | 'low' | 'medium' | 'high' | 'critical';

    @Column({ type: 'timestamp', nullable: true, name: 'last_calculated_at' })
    lastCalculatedAt?: Date;

    // Configuración de alertas
    @Column({ type: 'jsonb', nullable: true, name: 'alert_config' })
    alertConfig?: {
        onViolation?: boolean;
        onRisk?: string[];
        notifyEmails?: string[];
    };

    // Relación con Service
    @ManyToOne(() => ServiceEntity, service => service.slos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_id' })
    service?: ServiceEntity;

    // Timestamps
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
