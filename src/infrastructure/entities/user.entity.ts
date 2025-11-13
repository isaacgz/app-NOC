import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * User Entity - PostgreSQL
 *
 * Representa un usuario del sistema (para futuro sistema de autenticación)
 */
@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, select: false })
    password!: string;

    @Column({ type: 'varchar', length: 50, default: 'viewer' })
    role!: 'admin' | 'operator' | 'viewer';

    @Column({ type: 'boolean', default: true })
    active!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    preferences?: {
        theme?: 'light' | 'dark';
        notifications?: {
            email?: boolean;
            push?: boolean;
        };
        [key: string]: any;
    };

    // Timestamps
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
    lastLoginAt?: Date;
}
