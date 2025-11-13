import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ServiceEntity } from './service.entity';

/**
 * Incident Entity - PostgreSQL
 *
 * Representa un incidente de servicio
 */
@Entity('incidents')
export class IncidentEntity {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id: string;

    @Column({ type: 'varchar', length: 255, name: 'service_id' })
    serviceId: string;

    @Column({ type: 'varchar', length: 255, name: 'service_name' })
    serviceName: string;

    @Column({ type: 'varchar', length: 50 })
    severity: 'critical' | 'high' | 'medium' | 'low';

    @Column({ type: 'varchar', length: 50 })
    status: 'new' | 'investigating' | 'in_progress' | 'resolved' | 'closed';

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text', nullable: true, name: 'estimated_impact' })
    estimatedImpact?: string;

    @Column({ type: 'int', default: 0, name: 'affected_checks' })
    affectedChecks: number;

    // Timeline de eventos
    @Column({ type: 'jsonb', default: '[]' })
    timeline: Array<{
        timestamp: Date;
        type: 'created' | 'status_change' | 'update' | 'resolved' | 'closed' | 'failed_check';
        message: string;
        metadata?: any;
    }>;

    // Metadata
    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        assignedTo?: string;
        tags?: string[];
        relatedIncidents?: string[];
        [key: string]: any;
    };

    // Relación con Service
    @ManyToOne(() => ServiceEntity, service => service.incidents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_id' })
    service?: ServiceEntity;

    // Timestamps
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
    resolvedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'closed_at' })
    closedAt?: Date;

    // Métricas
    @Column({ type: 'int', nullable: true, name: 'resolution_time_minutes' })
    resolutionTimeMinutes?: number;
}
