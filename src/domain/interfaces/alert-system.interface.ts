/**
 * Interfaces para el Sistema de Alertas Inteligentes - Fase 2
 * Incluye cooldown, reintentos, escalación y notificaciones
 */

import { CheckResult } from "./service-monitor.interface";

/**
 * Tipo de alerta
 */
export type AlertType = 'service_down' | 'service_recovered' | 'service_degraded' | 'service_timeout';

/**
 * Nivel de prioridad de la alerta
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Canal de notificación
 */
export type NotificationChannel = 'email' | 'console' | 'log';

/**
 * Estado de una alerta
 */
export type AlertStatus = 'pending' | 'sent' | 'suppressed' | 'escalated';

/**
 * Configuración de cooldown para evitar spam
 */
export interface CooldownConfig {
    /** Duración del cooldown en minutos */
    durationMinutes: number;

    /** Máximo de alertas permitidas en el período de cooldown */
    maxAlertsInPeriod?: number;
}

/**
 * Configuración de reintentos
 */
export interface RetryConfig {
    /** Número de reintentos antes de alertar */
    attempts: number;

    /** Delay entre reintentos en milisegundos */
    delayMs: number;

    /** Incremento del delay en cada reintento (backoff exponencial) */
    backoffMultiplier?: number;
}

/**
 * Configuración de escalación de alertas
 */
export interface EscalationConfig {
    /** Habilitar escalación */
    enabled: boolean;

    /** Tiempo en minutos antes de escalar */
    afterMinutes: number;

    /** Emails adicionales para escalación */
    notifyTo: string[];

    /** Mensaje personalizado de escalación */
    escalationMessage?: string;
}

/**
 * Configuración de alertas para un servicio
 */
export interface ServiceAlertConfig {
    /** Habilitar alertas para este servicio */
    enabled?: boolean;

    /** Configuración de cooldown */
    cooldown?: CooldownConfig;

    /** Configuración de reintentos */
    retry?: RetryConfig;

    /** Configuración de escalación */
    escalation?: EscalationConfig;

    /** Canales de notificación habilitados */
    channels?: NotificationChannel[] | any; // any para soportar la estructura de Fase 4

    /** Emails a notificar cuando el servicio falla */
    notifyEmails?: string[];

    /** Enviar notificación cuando el servicio se recupera */
    notifyOnRecovery?: boolean;

    /** Enviar notificación solo en horario laboral */
    onlyBusinessHours?: boolean;
}

/**
 * Registro de una alerta
 */
export interface AlertRecord {
    /** ID único de la alerta */
    id: string;

    /** ID del servicio relacionado */
    serviceId: string;

    /** Nombre del servicio */
    serviceName: string;

    /** Tipo de alerta */
    type: AlertType;

    /** Prioridad de la alerta */
    priority: AlertPriority;

    /** Estado de la alerta */
    status: AlertStatus;

    /** Timestamp de creación */
    createdAt: Date;

    /** Timestamp de envío (si fue enviada) */
    sentAt?: Date;

    /** Resultado del chequeo que generó la alerta */
    checkResult: CheckResult;

    /** Información adicional */
    metadata?: {
        /** Número de intentos realizados */
        retryAttempts?: number;

        /** Si fue escalada */
        escalated?: boolean;

        /** Timestamp de escalación */
        escalatedAt?: Date;

        /** Si fue suprimida por cooldown */
        suppressedByCooldown?: boolean;

        /** Razón de supresión */
        suppressionReason?: string;
    };
}

/**
 * Estado de cooldown para un servicio
 */
export interface ServiceCooldownState {
    /** ID del servicio */
    serviceId: string;

    /** Timestamp de la última alerta enviada */
    lastAlertSent: Date;

    /** Número de alertas enviadas en el período actual */
    alertsInCurrentPeriod: number;

    /** Timestamp del inicio del período actual */
    periodStarted: Date;

    /** Si el servicio está en cooldown activo */
    isInCooldown: boolean;
}

/**
 * Estado de un servicio para tracking
 */
export interface ServiceHealthState {
    /** ID del servicio */
    serviceId: string;

    /** Estado actual */
    currentStatus: 'up' | 'down' | 'degraded' | 'unknown';

    /** Estado anterior */
    previousStatus?: 'up' | 'down' | 'degraded' | 'unknown';

    /** Timestamp del último cambio de estado */
    lastStateChange?: Date;

    /** Número de fallos consecutivos */
    consecutiveFailures: number;

    /** Número de éxitos consecutivos */
    consecutiveSuccesses: number;

    /** Timestamp del último chequeo */
    lastCheck: Date;

    /** Si el servicio está siendo reintentado */
    isRetrying: boolean;

    /** Timestamp del inicio de la caída */
    downtimeStarted?: Date;

    /** Duración de la caída actual en minutos */
    downtimeDurationMinutes?: number;

    /** Si hay una escalación activa */
    hasActiveEscalation: boolean;
}

/**
 * Notificación a enviar
 */
export interface AlertNotification {
    /** ID de la alerta relacionada */
    alertId: string;

    /** ID del servicio */
    serviceId: string;

    /** Nombre del servicio */
    serviceName: string;

    /** Tipo de notificación */
    type: AlertType;

    /** Prioridad */
    priority: AlertPriority;

    /** Asunto del email */
    subject: string;

    /** Cuerpo del mensaje */
    body: string;

    /** Destinatarios */
    recipients: string[];

    /** Canal de envío */
    channel: NotificationChannel;

    /** Si es una escalación */
    isEscalation?: boolean;

    /** Timestamp de creación */
    timestamp: Date;

    /** Datos adicionales para el template */
    templateData?: {
        url: string;
        responseTime?: number;
        statusCode?: number;
        errorMessage?: string;
        consecutiveFailures?: number;
        downtimeDuration?: string;
        checkHistory?: CheckResult[];
    };
}

/**
 * Resultado de un intento de envío de notificación
 */
export interface NotificationResult {
    /** Si fue exitoso */
    success: boolean;

    /** Canal utilizado */
    channel: NotificationChannel;

    /** ID de la alerta */
    alertId: string;

    /** Timestamp del envío */
    sentAt: Date;

    /** Mensaje de error si falló */
    error?: string;
}

/**
 * Estadísticas del sistema de alertas
 */
export interface AlertStatistics {
    /** Total de alertas generadas */
    totalAlerts: number;

    /** Alertas enviadas */
    sentAlerts: number;

    /** Alertas suprimidas por cooldown */
    suppressedAlerts: number;

    /** Alertas escaladas */
    escalatedAlerts: number;

    /** Alertas por tipo */
    alertsByType: Record<AlertType, number>;

    /** Alertas por prioridad */
    alertsByPriority: Record<AlertPriority, number>;

    /** Servicios con alertas activas */
    servicesWithActiveAlerts: number;

    /** Tiempo promedio de recuperación en minutos */
    averageRecoveryTimeMinutes: number;
}
