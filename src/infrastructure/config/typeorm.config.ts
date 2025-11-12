import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * TypeORM DataSource Configuration
 *
 * Configuración centralizada para PostgreSQL usando TypeORM
 */
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'noc_monitoring',

    // Entities
    entities: ['dist/infrastructure/entities/**/*.js'],

    // Auto-create schema (solo desarrollo)
    synchronize: process.env.NODE_ENV === 'development',

    // Logging
    logging: process.env.DB_LOGGING === 'true',

    // Migrations
    migrations: ['dist/infrastructure/migrations/**/*.js'],
    migrationsTableName: 'migrations',

    // Connection pool
    extra: {
        max: 10, // máximo de conexiones
        idleTimeoutMillis: 30000,
    },
});

/**
 * Inicializa la conexión a PostgreSQL
 */
export async function initializeDatabase(): Promise<DataSource> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ PostgreSQL connected successfully');
            console.log(`   Database: ${process.env.DB_NAME}`);
            console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        }
        return AppDataSource;
    } catch (error) {
        console.error('❌ Error connecting to PostgreSQL:', error);
        throw error;
    }
}

/**
 * Cierra la conexión a PostgreSQL
 */
export async function closeDatabase(): Promise<void> {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ PostgreSQL connection closed');
    }
}
