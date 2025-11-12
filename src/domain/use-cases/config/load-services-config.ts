import { MonitoringConfig, ServiceConfig } from "../../interfaces/service-monitor.interface";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio para cargar y validar configuración de servicios
 */
export class LoadServicesConfig {
    /**
     * Carga la configuración de servicios desde un archivo JSON
     */
    static loadFromFile(configPath: string): MonitoringConfig {
        try {
            // Verificar que el archivo existe
            if (!fs.existsSync(configPath)) {
                throw new Error(`Configuration file not found: ${configPath}`);
            }

            // Leer y parsear el archivo
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            const config: MonitoringConfig = JSON.parse(fileContent);

            // Validar la configuración
            this.validateConfig(config);

            // Aplicar valores por defecto
            return this.applyDefaults(config);

        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in configuration file: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Valida que la configuración tenga el formato correcto
     */
    private static validateConfig(config: MonitoringConfig): void {
        if (!config.services || !Array.isArray(config.services)) {
            throw new Error('Configuration must have a "services" array');
        }

        if (config.services.length === 0) {
            throw new Error('Configuration must have at least one service');
        }

        // Validar cada servicio
        config.services.forEach((service, index) => {
            this.validateService(service, index);
        });

        // Verificar IDs únicos
        const ids = config.services.map(s => s.id);
        const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        if (duplicates.length > 0) {
            throw new Error(`Duplicate service IDs found: ${duplicates.join(', ')}`);
        }
    }

    /**
     * Valida un servicio individual
     */
    private static validateService(service: ServiceConfig, index: number): void {
        const prefix = `Service at index ${index}`;

        if (!service.id) {
            throw new Error(`${prefix}: "id" is required`);
        }

        if (!service.name) {
            throw new Error(`${prefix}: "name" is required`);
        }

        if (!service.url) {
            throw new Error(`${prefix}: "url" is required`);
        }

        // Validar formato de URL
        try {
            new URL(service.url);
        } catch {
            throw new Error(`${prefix}: Invalid URL format: ${service.url}`);
        }

        if (!service.interval) {
            throw new Error(`${prefix}: "interval" is required`);
        }

        // Validar formato CRON (básico)
        const cronParts = service.interval.trim().split(/\s+/);
        if (cronParts.length < 5 || cronParts.length > 6) {
            throw new Error(
                `${prefix}: Invalid cron expression: ${service.interval}. ` +
                `Expected 5 or 6 parts (seconds are optional)`
            );
        }

        // Validar health check si existe
        if (service.healthCheck) {
            this.validateHealthCheck(service.healthCheck, prefix);
        }
    }

    /**
     * Valida la configuración de health check
     */
    private static validateHealthCheck(healthCheck: any, prefix: string): void {
        if (healthCheck.method) {
            const validMethods = ['GET', 'POST', 'HEAD', 'PUT', 'PATCH', 'DELETE'];
            if (!validMethods.includes(healthCheck.method)) {
                throw new Error(
                    `${prefix}: Invalid HTTP method: ${healthCheck.method}. ` +
                    `Valid methods: ${validMethods.join(', ')}`
                );
            }
        }

        if (healthCheck.timeout && (typeof healthCheck.timeout !== 'number' || healthCheck.timeout <= 0)) {
            throw new Error(`${prefix}: timeout must be a positive number`);
        }

        if (healthCheck.expectedResponse) {
            const { statusCode, acceptedStatusCodes, maxResponseTime } = healthCheck.expectedResponse;

            if (statusCode && (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599)) {
                throw new Error(`${prefix}: statusCode must be between 100 and 599`);
            }

            if (acceptedStatusCodes && !Array.isArray(acceptedStatusCodes)) {
                throw new Error(`${prefix}: acceptedStatusCodes must be an array`);
            }

            if (maxResponseTime && (typeof maxResponseTime !== 'number' || maxResponseTime <= 0)) {
                throw new Error(`${prefix}: maxResponseTime must be a positive number`);
            }
        }
    }

    /**
     * Aplica valores por defecto a la configuración
     */
    private static applyDefaults(config: MonitoringConfig): MonitoringConfig {
        const defaultGlobal = {
            defaultTimeout: 5000,
            enableDetailedLogs: false,
            retryAttempts: 1,
            retryDelay: 1000,
        };

        const global = {
            ...defaultGlobal,
            ...(config.global || {}),
        };

        const services = config.services.map(service => ({
            critical: false,
            enabled: true,
            tags: [],
            ...service,
            healthCheck: service.healthCheck ? {
                method: 'GET' as const,
                timeout: global.defaultTimeout,
                followRedirects: true,
                ...service.healthCheck,
            } : undefined,
        }));

        return {
            ...config,
            global,
            services,
        };
    }

    /**
     * Obtiene solo los servicios habilitados
     */
    static getEnabledServices(config: MonitoringConfig): ServiceConfig[] {
        return config.services.filter(service => service.enabled !== false);
    }

    /**
     * Obtiene servicios filtrados por tags
     */
    static getServicesByTags(config: MonitoringConfig, tags: string[]): ServiceConfig[] {
        return config.services.filter(service =>
            service.tags && service.tags.some(tag => tags.includes(tag))
        );
    }

    /**
     * Obtiene servicios críticos
     */
    static getCriticalServices(config: MonitoringConfig): ServiceConfig[] {
        return config.services.filter(service => service.critical === true);
    }

    /**
     * Genera una configuración de ejemplo
     */
    static generateExampleConfig(outputPath: string): void {
        const exampleConfig: MonitoringConfig = {
            global: {
                defaultTimeout: 5000,
                enableDetailedLogs: false,
                retryAttempts: 1,
                retryDelay: 1000,
            },
            services: [
                {
                    id: 'google',
                    name: 'Google',
                    url: 'https://google.com',
                    interval: '*/30 * * * * *',
                    critical: false,
                    description: 'Google homepage - Basic connectivity test',
                    tags: ['external', 'basic'],
                    enabled: true,
                },
                {
                    id: 'api-production',
                    name: 'API Production',
                    url: 'https://api.example.com/health',
                    interval: '*/10 * * * * *',
                    critical: true,
                    description: 'Production API health endpoint',
                    tags: ['internal', 'critical', 'api'],
                    enabled: true,
                    healthCheck: {
                        method: 'GET',
                        timeout: 3000,
                        expectedResponse: {
                            statusCode: 200,
                            bodyContains: 'ok',
                            maxResponseTime: 500,
                        },
                    },
                },
                {
                    id: 'database-api',
                    name: 'Database API',
                    url: 'https://db.example.com/ping',
                    interval: '*/20 * * * * *',
                    critical: true,
                    description: 'Database API connectivity check',
                    tags: ['internal', 'critical', 'database'],
                    enabled: true,
                    healthCheck: {
                        method: 'GET',
                        timeout: 5000,
                        expectedResponse: {
                            acceptedStatusCodes: [200, 201],
                            maxResponseTime: 1000,
                        },
                    },
                },
                {
                    id: 'cdn-assets',
                    name: 'CDN Assets',
                    url: 'https://cdn.example.com/health',
                    interval: '*/60 * * * * *',
                    critical: false,
                    description: 'CDN availability check',
                    tags: ['external', 'cdn'],
                    enabled: true,
                    healthCheck: {
                        method: 'HEAD',
                        timeout: 3000,
                    },
                },
            ],
        };

        const jsonContent = JSON.stringify(exampleConfig, null, 2);
        fs.writeFileSync(outputPath, jsonContent, 'utf-8');
        console.log(`Example configuration generated: ${outputPath}`);
    }
}
