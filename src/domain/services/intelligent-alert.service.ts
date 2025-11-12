import {
    AlertRecord,
    AlertType,
    ServiceCooldownState,
    ServiceHealthState,
    ServiceAlertConfig,
    AlertPriority,
    AlertStatus,
    NotificationChannel,
} from '../interfaces/alert-system.interface';
import { CheckResult } from '../interfaces/service-monitor.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio de Alertas Inteligentes
 * Gestiona cooldown, reintentos, y tracking de estado de servicios
 */
export class IntelligentAlertService {
    private cooldownStates: Map<string, ServiceCooldownState> = new Map();
    private healthStates: Map<string, ServiceHealthState> = new Map();
    private alertHistory: Map<string, AlertRecord[]> = new Map();

    /**
     * Determina si se debe enviar una alerta basándose en el estado y configuración
     */
    shouldSendAlert(
        serviceId: string,
        checkResult: CheckResult,
        config?: ServiceAlertConfig
    ): { shouldSend: boolean; reason?: string; alertRecord?: AlertRecord } {
        // Verificar si las alertas están habilitadas
        if (config?.enabled === false) {
            return { shouldSend: false, reason: 'Alerts disabled for this service' };
        }

        // Actualizar estado de salud
        const healthState = this.updateHealthState(serviceId, checkResult);

        // Si el servicio está UP, verificar si debemos notificar recuperación
        if (checkResult.success) {
            return this.handleServiceRecovery(serviceId, healthState, checkResult, config);
        }

        // El servicio está DOWN o DEGRADED
        return this.handleServiceFailure(serviceId, healthState, checkResult, config);
    }

    /**
     * Actualiza el estado de salud de un servicio
     */
    private updateHealthState(serviceId: string, checkResult: CheckResult): ServiceHealthState {
        let state = this.healthStates.get(serviceId);

        if (!state) {
            state = {
                serviceId,
                currentStatus: checkResult.status,
                consecutiveFailures: checkResult.success ? 0 : 1,
                consecutiveSuccesses: checkResult.success ? 1 : 0,
                lastCheck: checkResult.timestamp,
                isRetrying: false,
                hasActiveEscalation: false,
            };
        } else {
            const previousStatus = state.currentStatus;
            state.previousStatus = previousStatus;
            state.currentStatus = checkResult.status;
            state.lastCheck = checkResult.timestamp;

            // Actualizar contadores
            if (checkResult.success) {
                state.consecutiveSuccesses++;
                state.consecutiveFailures = 0;

                // Si se recuperó de una caída, calcular duración
                if (previousStatus === 'down' && state.downtimeStarted) {
                    const downtimeMs = checkResult.timestamp.getTime() - state.downtimeStarted.getTime();
                    state.downtimeDurationMinutes = Math.floor(downtimeMs / 60000);
                    state.downtimeStarted = undefined;
                }
            } else {
                state.consecutiveFailures++;
                state.consecutiveSuccesses = 0;

                // Marcar inicio de caída
                if (!state.downtimeStarted) {
                    state.downtimeStarted = checkResult.timestamp;
                }
            }

            // Actualizar timestamp del cambio de estado
            if (previousStatus !== state.currentStatus) {
                state.lastStateChange = checkResult.timestamp;
            }
        }

        this.healthStates.set(serviceId, state);
        return state;
    }

    /**
     * Maneja la recuperación de un servicio
     */
    private handleServiceRecovery(
        serviceId: string,
        healthState: ServiceHealthState,
        checkResult: CheckResult,
        config?: ServiceAlertConfig
    ): { shouldSend: boolean; reason?: string; alertRecord?: AlertRecord } {
        // Verificar si cambió de down a up
        const wasDown = healthState.previousStatus === 'down';
        const isNowUp = healthState.currentStatus === 'up';

        if (wasDown && isNowUp && config?.notifyOnRecovery) {
            // Crear alerta de recuperación
            const alertRecord = this.createAlertRecord(
                serviceId,
                checkResult,
                'service_recovered',
                'medium',
                'sent'
            );

            // Limpiar cooldown y escalación
            this.cooldownStates.delete(serviceId);
            healthState.hasActiveEscalation = false;
            healthState.isRetrying = false;

            // Guardar alerta
            this.saveAlertRecord(alertRecord);

            return {
                shouldSend: true,
                alertRecord,
            };
        }

        return { shouldSend: false, reason: 'Service is up, no recovery alert needed' };
    }

    /**
     * Maneja la falla de un servicio
     */
    private handleServiceFailure(
        serviceId: string,
        healthState: ServiceHealthState,
        checkResult: CheckResult,
        config?: ServiceAlertConfig
    ): { shouldSend: boolean; reason?: string; alertRecord?: AlertRecord } {
        // Verificar configuración de reintentos
        const retryConfig = config?.retry;
        if (retryConfig && healthState.consecutiveFailures <= retryConfig.attempts) {
            healthState.isRetrying = true;
            this.healthStates.set(serviceId, healthState);

            return {
                shouldSend: false,
                reason: `Retrying (${healthState.consecutiveFailures}/${retryConfig.attempts})`,
            };
        }

        // Ya pasamos los reintentos, verificar cooldown
        const cooldownCheck = this.checkCooldown(serviceId, config?.cooldown);
        if (!cooldownCheck.canSend) {
            // Crear registro pero marcado como suprimido
            const alertRecord = this.createAlertRecord(
                serviceId,
                checkResult,
                'service_down',
                this.determinePriority(checkResult, config),
                'suppressed'
            );

            alertRecord.metadata = {
                ...alertRecord.metadata,
                suppressedByCooldown: true,
                suppressionReason: cooldownCheck.reason,
                retryAttempts: healthState.consecutiveFailures,
            };

            this.saveAlertRecord(alertRecord);

            return {
                shouldSend: false,
                reason: cooldownCheck.reason,
                alertRecord,
            };
        }

        // Determinar tipo de alerta
        const alertType: AlertType = checkResult.status === 'degraded' ? 'service_degraded' : 'service_down';

        // Crear alerta
        const alertRecord = this.createAlertRecord(
            serviceId,
            checkResult,
            alertType,
            this.determinePriority(checkResult, config),
            'pending'
        );

        alertRecord.metadata = {
            ...alertRecord.metadata,
            retryAttempts: healthState.consecutiveFailures,
        };

        // Actualizar cooldown
        this.updateCooldownState(serviceId);

        // Guardar alerta
        this.saveAlertRecord(alertRecord);

        return {
            shouldSend: true,
            alertRecord,
        };
    }

    /**
     * Verifica si un servicio está en cooldown
     */
    private checkCooldown(
        serviceId: string,
        cooldownConfig?: { durationMinutes: number; maxAlertsInPeriod?: number }
    ): { canSend: boolean; reason?: string } {
        if (!cooldownConfig) {
            return { canSend: true };
        }

        const cooldownState = this.cooldownStates.get(serviceId);
        if (!cooldownState) {
            return { canSend: true };
        }

        const now = new Date();
        const minutesSinceLastAlert = (now.getTime() - cooldownState.lastAlertSent.getTime()) / 60000;

        // Verificar si está en período de cooldown
        if (minutesSinceLastAlert < cooldownConfig.durationMinutes) {
            // Verificar si hay límite de alertas en el período
            if (cooldownConfig.maxAlertsInPeriod) {
                const minutesSincePeriodStart = (now.getTime() - cooldownState.periodStarted.getTime()) / 60000;

                if (minutesSincePeriodStart < cooldownConfig.durationMinutes) {
                    if (cooldownState.alertsInCurrentPeriod >= cooldownConfig.maxAlertsInPeriod) {
                        return {
                            canSend: false,
                            reason: `Maximum ${cooldownConfig.maxAlertsInPeriod} alerts per ${cooldownConfig.durationMinutes} minutes reached`,
                        };
                    }
                }
            }

            return {
                canSend: false,
                reason: `Cooldown active (${Math.ceil(cooldownConfig.durationMinutes - minutesSinceLastAlert)} minutes remaining)`,
            };
        }

        return { canSend: true };
    }

    /**
     * Actualiza el estado de cooldown después de enviar una alerta
     */
    private updateCooldownState(serviceId: string): void {
        const now = new Date();
        const currentState = this.cooldownStates.get(serviceId);

        if (!currentState) {
            this.cooldownStates.set(serviceId, {
                serviceId,
                lastAlertSent: now,
                alertsInCurrentPeriod: 1,
                periodStarted: now,
                isInCooldown: true,
            });
        } else {
            currentState.lastAlertSent = now;
            currentState.alertsInCurrentPeriod++;
            currentState.isInCooldown = true;
            this.cooldownStates.set(serviceId, currentState);
        }
    }

    /**
     * Determina la prioridad de una alerta
     */
    private determinePriority(checkResult: CheckResult, config?: ServiceAlertConfig): AlertPriority {
        // Si es un servicio crítico definido en otra config (pasaría por metadata)
        if ((checkResult as any).critical === true) {
            return 'critical';
        }

        // Basado en el estado
        if (checkResult.status === 'down') {
            return 'high';
        }

        if (checkResult.status === 'degraded') {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Crea un registro de alerta
     */
    private createAlertRecord(
        serviceId: string,
        checkResult: CheckResult,
        type: AlertType,
        priority: AlertPriority,
        status: AlertStatus
    ): AlertRecord {
        return {
            id: uuidv4(),
            serviceId,
            serviceName: checkResult.serviceName,
            type,
            priority,
            status,
            createdAt: new Date(),
            checkResult,
            metadata: {},
        };
    }

    /**
     * Guarda un registro de alerta en el historial
     */
    private saveAlertRecord(alert: AlertRecord): void {
        const history = this.alertHistory.get(alert.serviceId) || [];
        history.push(alert);

        // Mantener solo los últimos 100 registros
        if (history.length > 100) {
            history.shift();
        }

        this.alertHistory.set(alert.serviceId, history);
    }

    /**
     * Marca una alerta como enviada
     */
    markAlertAsSent(alertId: string, serviceId: string): void {
        const history = this.alertHistory.get(serviceId);
        if (!history) return;

        const alert = history.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'sent';
            alert.sentAt = new Date();
        }
    }

    /**
     * Verifica si un servicio necesita escalación
     */
    checkEscalation(
        serviceId: string,
        config?: { enabled: boolean; afterMinutes: number }
    ): { needsEscalation: boolean; downtimeMinutes?: number } {
        if (!config || !config.enabled) {
            return { needsEscalation: false };
        }

        const healthState = this.healthStates.get(serviceId);
        if (!healthState || healthState.currentStatus !== 'down' || !healthState.downtimeStarted) {
            return { needsEscalation: false };
        }

        // Ya fue escalado
        if (healthState.hasActiveEscalation) {
            return { needsEscalation: false };
        }

        const now = new Date();
        const downtimeMinutes = (now.getTime() - healthState.downtimeStarted.getTime()) / 60000;

        if (downtimeMinutes >= config.afterMinutes) {
            healthState.hasActiveEscalation = true;
            this.healthStates.set(serviceId, healthState);

            return {
                needsEscalation: true,
                downtimeMinutes: Math.floor(downtimeMinutes),
            };
        }

        return { needsEscalation: false };
    }

    /**
     * Obtiene el estado de salud de un servicio
     */
    getHealthState(serviceId: string): ServiceHealthState | undefined {
        return this.healthStates.get(serviceId);
    }

    /**
     * Obtiene el historial de alertas de un servicio
     */
    getAlertHistory(serviceId: string, limit?: number): AlertRecord[] {
        const history = this.alertHistory.get(serviceId) || [];
        return limit ? history.slice(-limit) : history;
    }

    /**
     * Obtiene todas las alertas activas (no resueltas)
     */
    getActiveAlerts(): AlertRecord[] {
        const allAlerts: AlertRecord[] = [];

        for (const history of this.alertHistory.values()) {
            for (const alert of history) {
                const healthState = this.healthStates.get(alert.serviceId);
                if (healthState && healthState.currentStatus === 'down') {
                    allAlerts.push(alert);
                }
            }
        }

        return allAlerts;
    }

    /**
     * Limpia estados antiguos (mantenimiento)
     */
    cleanup(olderThanHours: number = 24): void {
        const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

        // Limpiar cooldowns antiguos
        for (const [serviceId, state] of this.cooldownStates.entries()) {
            if (state.lastAlertSent.getTime() < cutoffTime) {
                this.cooldownStates.delete(serviceId);
            }
        }

        // Limpiar historial antiguo
        for (const [serviceId, history] of this.alertHistory.entries()) {
            const filtered = history.filter(alert => alert.createdAt.getTime() >= cutoffTime);
            if (filtered.length === 0) {
                this.alertHistory.delete(serviceId);
            } else {
                this.alertHistory.set(serviceId, filtered);
            }
        }
    }
}
