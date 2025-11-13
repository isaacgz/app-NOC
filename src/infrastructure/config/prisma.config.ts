import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Prisma Client Singleton
 *
 * Configuración centralizada para Prisma ORM
 */
class PrismaService {
    private static instance: PrismaClient | null = null;

    /**
     * Obtiene la instancia única de Prisma Client
     */
    static getInstance(): PrismaClient {
        if (!this.instance) {
            this.instance = new PrismaClient({
                log: process.env.DB_LOGGING === 'true'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
            });
        }
        return this.instance;
    }

    /**
     * Conecta a la base de datos
     */
    static async connect(): Promise<void> {
        try {
            const prisma = this.getInstance();
            await prisma.$connect();
            console.log('✅ PostgreSQL connected successfully (Prisma)');
            console.log(`   Database: ${process.env.DB_NAME}`);
        } catch (error) {
            console.error('❌ Error connecting to PostgreSQL:', error);
            throw error;
        }
    }

    /**
     * Desconecta de la base de datos
     */
    static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.$disconnect();
            this.instance = null;
            console.log('✅ PostgreSQL connection closed (Prisma)');
        }
    }

    /**
     * Health check de la conexión
     */
    static async healthCheck(): Promise<boolean> {
        try {
            const prisma = this.getInstance();
            await prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            console.error('PostgreSQL health check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const prisma = PrismaService.getInstance();
export { PrismaService };
