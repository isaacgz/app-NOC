import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IncidentEntity } from './incident.entity';
import { SLOEntity } from './slo.entity';

/**
 * Service Entity - PostgreSQL
 *
 * Representa un servicio monitoreado en el sistema
 */
@Entity('services')
export class ServiceEntity {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 1024 })
    url!: string;

    @Column({ type: 'varchar', length: 50, default: 'http' })
    method!: string;

    @Column({ type: 'varchar', length: 255, default: '*/30 * * * * *' })
    interval!: string;

    @Column({ type: 'boolean', default: false })
    critical!: boolean;

    @Column({ type: 'boolean', default: true })
    enabled!: boolean;

    @Column({ type: 'simple-array', nullable: true })
    tags?: string[];

    // Health check configuration
    @Column({ type: 'jsonb', nullable: true })
    healthCheck?: {
        expectedStatus?: number[];
        containsText?: string;
        jsonPath?: string;
        maxResponseTime?: number;
    };

    // Alert configuration
    @Column({ type: 'jsonb', nullable: true })
    alertConfig?: {
        enabled?: boolean;
        retries?: number;
        cooldownMinutes?: number;
        notifyEmails?: string[];
        escalation?: {
            enabled?: boolean;
            afterMinutes?: number;
            notifyTo?: string[];
        };
    };

    // Relaciones
    @OneToMany(() => IncidentEntity, incident => incident.service)
    incidents?: IncidentEntity[];

    @OneToMany(() => SLOEntity, slo => slo.service)
    slos?: SLOEntity[];

    // Timestamps
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'last_check_at' })
    lastCheckAt?: Date;

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'last_status' })
    lastStatus?: string;
}
