/**
 * Tipos e Interfaces para el Sistema de Monitoreo Avanzado
 * Fase 1: Configuración de servicios, medición de performance y health checks
 */

/**
 * Métodos HTTP soportados para health checks
 */
export type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Estado del servicio monitoreado
 */
export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown';

/**
 * Configuración de validación de respuesta esperada
 */
export interface ExpectedResponse {
    /** Código de estado HTTP esperado (por defecto 200) */
    statusCode?: number;

    /** Códigos de estado aceptables (alternativa a statusCode) */
    acceptedStatusCodes?: number[];

    /** Texto que debe contener el body de la respuesta */
    bodyContains?: string;

    /** Headers específicos que deben estar presentes */
    requiredHeaders?: string[];

    /** Tiempo máximo de respuesta en milisegundos (alerta si se excede) */
    maxResponseTime?: number;
}

/**
 * Configuración avanzada para health checks
 */
export interface HealthCheckConfig {
    /** Método HTTP a utilizar */
    method?: HttpMethod;

    /** Headers personalizados para el request */
    headers?: Record<string, string>;

    /** Body del request (para POST, PUT, etc.) */
    body?: any;

    /** Timeout del request en milisegundos */
    timeout?: number;

    /** Validaciones de la respuesta esperada */
    expectedResponse?: ExpectedResponse;

    /** Seguir redirects (por defecto true) */
    followRedirects?: boolean;
}

/**
 * Configuración de un servicio a monitorear
 */
export interface ServiceConfig {
    /** Identificador único del servicio */
    id: string;

    /** Nombre descriptivo del servicio */
    name: string;

    /** URL del servicio a monitorear */
    url: string;

    /** Intervalo de chequeo en formato CRON */
    interval: string;

    /** Indica si el servicio es crítico (alerta inmediata si falla) */
    critical?: boolean;

    /** Descripción del servicio */
    description?: string;

    /** Tags para categorizar el servicio */
    tags?: string[];

    /** Configuración avanzada de health check */
    healthCheck?: HealthCheckConfig;

    /** Configuración de alertas (Fase 2) */
    alerts?: {
        /** Habilitar alertas para este servicio */
        enabled?: boolean;

        /** Emails a notificar */
        notifyEmails?: string[];

        /** Notificar cuando se recupera */
        notifyOnRecovery?: boolean;

        /** Configuración de cooldown */
        cooldown?: {
            /** Duración del cooldown en minutos */
            durationMinutes: number;
            /** Máximo de alertas en el período */
            maxAlertsInPeriod?: number;
        };

        /** Configuración de reintentos */
        retry?: {
            /** Número de intentos antes de alertar */
            attempts: number;
            /** Delay entre reintentos en ms */
            delayMs: number;
        };

        /** Configuración de escalación */
        escalation?: {
            /** Habilitar escalación */
            enabled: boolean;
            /** Minutos antes de escalar */
            afterMinutes: number;
            /** Emails adicionales para escalación */
            notifyTo: string[];
        };

        /** Canales de notificación (Fase 4) */
        channels?: {
            slack?: {
                enabled: boolean;
                webhookUrl: string;
            };
            discord?: {
                enabled: boolean;
                webhookUrl: string;
            };
            telegram?: {
                enabled: boolean;
                botToken: string;
                chatId: string;
            };
            teams?: {
                enabled: boolean;
                webhookUrl: string;
            };
            webhook?: {
                enabled: boolean;
                url: string;
                method?: 'POST' | 'GET';
            };
        };
    };

    /** Servicio activo o pausado */
    enabled?: boolean;
}

/**
 * Resultado detallado de un chequeo de servicio
 */
export interface CheckResult {
    /** ID del servicio chequeado */
    serviceId: string;

    /** Nombre del servicio */
    serviceName: string;

    /** URL chequeada */
    url: string;

    /** Estado del resultado del chequeo */
    success: boolean;

    /** Estado del servicio */
    status: ServiceStatus;

    /** Tiempo de respuesta en milisegundos */
    responseTime: number;

    /** Código de estado HTTP recibido */
    statusCode?: number;

    /** Timestamp del chequeo */
    timestamp: Date;

    /** Mensaje descriptivo del resultado */
    message: string;

    /** Detalles del error si falló */
    error?: string;

    /** Información adicional del chequeo */
    metadata?: {
        /** Método HTTP utilizado */
        method: HttpMethod;

        /** Si la respuesta cumplió con las validaciones */
        validationPassed?: boolean;

        /** Detalles de validaciones que fallaron */
        validationErrors?: string[];

        /** Headers relevantes de la respuesta */
        responseHeaders?: Record<string, string>;
    };
}

/**
 * Configuración completa del sistema de monitoreo
 */
export interface MonitoringConfig {
    /** Lista de servicios a monitorear */
    services: ServiceConfig[];

    /** Configuración global */
    global?: {
        /** Timeout por defecto para todos los servicios (ms) */
        defaultTimeout?: number;

        /** Habilitar logs detallados */
        enableDetailedLogs?: boolean;

        /** Número de intentos antes de marcar como down */
        retryAttempts?: number;

        /** Delay entre reintentos en milisegundos */
        retryDelay?: number;
    };
}

/**
 * Estadísticas de un servicio monitoreado
 */
export interface ServiceStatistics {
    /** ID del servicio */
    serviceId: string;

    /** Nombre del servicio */
    serviceName: string;

    /** Porcentaje de disponibilidad */
    uptime: number;

    /** Total de chequeos realizados */
    totalChecks: number;

    /** Chequeos exitosos */
    successfulChecks: number;

    /** Chequeos fallidos */
    failedChecks: number;

    /** Tiempo promedio de respuesta en ms */
    averageResponseTime: number;

    /** Tiempo mínimo de respuesta en ms */
    minResponseTime: number;

    /** Tiempo máximo de respuesta en ms */
    maxResponseTime: number;

    /** Último estado conocido */
    lastStatus: ServiceStatus;

    /** Timestamp del último chequeo */
    lastCheck?: Date;

    /** Timestamp de la última caída */
    lastDowntime?: Date;

    /** Duración de la última caída en minutos */
    lastDowntimeDuration?: number;
}
