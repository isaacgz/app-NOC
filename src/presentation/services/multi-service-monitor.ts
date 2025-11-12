import { CronJob } from 'cron';
import { CronService } from '../cron/cron-service';
import { CheckServiceAdvanced } from '../../domain/use-cases/checks/check-service-advanced';
import { LogRepository } from '../../domain/repository/log.repository';
import {
    MonitoringConfig,
    ServiceConfig,
    CheckResult,
    ServiceStatistics,
} from '../../domain/interfaces/service-monitor.interface';
import { LoadServicesConfig } from '../../domain/use-cases/config/load-services-config';
import { IntelligentAlertService } from '../../domain/services/intelligent-alert.service';
import { SendAlertNotification } from '../../domain/use-cases/alerts/send-alert-notification';
import { EmailService } from '../email/email.service';

/**
 * Monitor de múltiples servicios con alertas inteligentes (Fase 2)
 * Gestiona el monitoreo de múltiples servicios concurrentemente con:
 * - Sistema de cooldown para evitar spam
 * - Reintentos automáticos antes de alertar
 * - Detección de recuperación de servicios
 * - Escalación automática de alertas
 */
export class MultiServiceMonitor {
    private jobs: Map<string, CronJob> = new Map();
    private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
    private serviceStats: Map<string, ServiceStatistics> = new Map();
    private checkHistory: Map<string, CheckResult[]> = new Map();
    private config!: MonitoringConfig;
    private alertService: IntelligentAlertService;
    private notificationService: SendAlertNotification;

    constructor(
        private readonly logRepository: LogRepository,
        private readonly emailService: EmailService,
        private readonly onServiceUp?: (result: CheckResult) => void,
        private readonly onServiceDown?: (result: CheckResult) => void
    ) {
        this.alertService = new IntelligentAlertService();
        this.notificationService = new SendAlertNotification(emailService);
    }

    /**
     * Inicia el monitoreo de servicios desde archivo de configuración
     */
    async startFromConfigFile(configPath: string): Promise<void> {
        console.log(`📋 Loading monitoring configuration from: ${configPath}`);

        try {
            // Cargar configuración
            this.config = LoadServicesConfig.loadFromFile(configPath);

            // Obtener servicios habilitados
            const enabledServices = LoadServicesConfig.getEnabledServices(this.config);

            console.log(`✅ Configuration loaded successfully`);
            console.log(`📊 Total services: ${this.config.services.length}`);
            console.log(`✓ Enabled services: ${enabledServices.length}`);

            // Iniciar monitoreo de cada servicio
            for (const service of enabledServices) {
                this.startServiceMonitor(service);
            }

            console.log(`\n🚀 Monitoring started for ${enabledServices.length} services\n`);

            // Mostrar resumen
            this.printMonitoringSummary();

        } catch (error) {
            console.error(`❌ Failed to start monitoring: ${error}`);
            throw error;
        }
    }

    /**
     * Inicia el monitoreo desde una configuración en memoria
     */
    async startFromConfig(config: MonitoringConfig): Promise<void> {
        this.config = config;
        const enabledServices = LoadServicesConfig.getEnabledServices(config);

        for (const service of enabledServices) {
            this.startServiceMonitor(service);
        }

        console.log(`🚀 Monitoring started for ${enabledServices.length} services`);
    }

    /**
     * Inicia el monitoreo de un servicio individual
     */
    private startServiceMonitor(service: ServiceConfig): void {
        // Inicializar estadísticas
        this.serviceStats.set(service.id, {
            serviceId: service.id,
            serviceName: service.name,
            uptime: 100,
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            lastStatus: 'unknown',
        });

        // Inicializar historial
        this.checkHistory.set(service.id, []);

        // Crear servicio de chequeo
        const checkService = new CheckServiceAdvanced(
            this.logRepository,
            (result) => this.handleSuccess(service, result),
            (result) => this.handleError(service, result)
        );

        // Crear trabajo CRON
        const job = CronService.createJob(
            service.interval,
            async () => {
                await this.executeCheck(service, checkService);
            }
        );

        this.jobs.set(service.id, job);

        const criticalFlag = service.critical ? '🔴 CRITICAL' : '🟢 NORMAL';
        console.log(`  ✓ ${service.name} (${service.id}) - ${service.interval} ${criticalFlag}`);
    }

    /**
     * Ejecuta un chequeo de servicio
     */
    private async executeCheck(
        service: ServiceConfig,
        checkService: CheckServiceAdvanced
    ): Promise<void> {
        try {
            await checkService.execute(
                service.id,
                service.name,
                service.url,
                service.healthCheck
            );
        } catch (error) {
            console.error(`Error checking service ${service.name}:`, error);
        }
    }

    /**
     * Maneja un chequeo exitoso
     */
    private async handleSuccess(service: ServiceConfig, result: CheckResult): Promise<void> {
        this.updateStatistics(service.id, result);

        // Callback del usuario
        this.onServiceUp?.(result);

        // Verificar si el servicio se recuperó (estaba caído y ahora está up)
        if (service.alerts?.enabled !== false) {
            const alertDecision = this.alertService.shouldSendAlert(
                service.id,
                result,
                service.alerts
            );

            if (alertDecision.shouldSend && alertDecision.alertRecord) {
                // Enviar notificación de recuperación
                await this.sendAlertNotification(
                    alertDecision.alertRecord,
                    service,
                    false
                );

                // Limpiar timer de escalación si existe
                this.clearEscalationTimer(service.id);
            }
        }

        // Log básico de éxito (solo si no es verbose)
        if (!this.config.global?.enableDetailedLogs) {
            console.log(`✅ ${result.serviceName} - ${result.responseTime}ms`);
        }
    }

    /**
     * Maneja un chequeo fallido
     */
    private async handleError(service: ServiceConfig, result: CheckResult): Promise<void> {
        this.updateStatistics(service.id, result);

        // Callback del usuario
        this.onServiceDown?.(result);

        // Sistema de alertas inteligentes
        if (service.alerts?.enabled !== false) {
            const alertDecision = this.alertService.shouldSendAlert(
                service.id,
                result,
                service.alerts
            );

            if (alertDecision.shouldSend && alertDecision.alertRecord) {
                // Enviar alerta
                await this.sendAlertNotification(
                    alertDecision.alertRecord,
                    service,
                    false
                );

                // Marcar como enviada
                this.alertService.markAlertAsSent(alertDecision.alertRecord.id, service.id);

                // Configurar escalación si está habilitada
                if (service.alerts?.escalation?.enabled) {
                    this.setupEscalationTimer(service, alertDecision.alertRecord);
                }
            } else if (!alertDecision.shouldSend) {
                // Log de supresión
                if (alertDecision.reason) {
                    console.log(`   ℹ️  Alert suppressed: ${alertDecision.reason}`);
                }
            }
        }

        // Log de error (siempre visible)
        const criticalFlag = service.critical ? '🔴 CRITICAL' : '⚠️';
        console.error(`${criticalFlag} ${result.serviceName} - ${result.message}`);

        // Si es crítico, mostrar más detalles
        if (service.critical) {
            console.error(`   URL: ${result.url}`);
            if (result.error) {
                console.error(`   Error: ${result.error}`);
            }
        }
    }

    /**
     * Actualiza las estadísticas de un servicio
     */
    private updateStatistics(serviceId: string, result: CheckResult): void {
        const stats = this.serviceStats.get(serviceId);
        if (!stats) return;

        // Actualizar contadores
        stats.totalChecks++;
        if (result.success) {
            stats.successfulChecks++;
        } else {
            stats.failedChecks++;
            stats.lastDowntime = result.timestamp;
        }

        // Actualizar uptime
        stats.uptime = (stats.successfulChecks / stats.totalChecks) * 100;

        // Actualizar tiempos de respuesta
        if (result.responseTime) {
            stats.minResponseTime = Math.min(stats.minResponseTime, result.responseTime);
            stats.maxResponseTime = Math.max(stats.maxResponseTime, result.responseTime);

            // Calcular promedio (media móvil simple)
            const total = stats.averageResponseTime * (stats.totalChecks - 1) + result.responseTime;
            stats.averageResponseTime = total / stats.totalChecks;
        }

        // Actualizar estado
        stats.lastStatus = result.status;
        stats.lastCheck = result.timestamp;

        // Guardar en historial (mantener últimos 100 checks)
        const history = this.checkHistory.get(serviceId) || [];
        history.push(result);
        if (history.length > 100) {
            history.shift();
        }
        this.checkHistory.set(serviceId, history);
    }

    /**
     * Detiene el monitoreo de todos los servicios
     */
    stopAll(): void {
        console.log('\n🛑 Stopping all monitors...');

        // Detener todos los jobs
        for (const [serviceId, job] of this.jobs.entries()) {
            job.stop();
            console.log(`  ✓ Stopped monitor for service: ${serviceId}`);
        }

        // Limpiar todos los timers de escalación
        for (const [serviceId, timer] of this.escalationTimers.entries()) {
            clearTimeout(timer);
            console.log(`  ✓ Cleared escalation timer for: ${serviceId}`);
        }

        this.jobs.clear();
        this.escalationTimers.clear();
        console.log('✅ All monitors stopped\n');
    }

    /**
     * Detiene el monitoreo de un servicio específico
     */
    stopService(serviceId: string): boolean {
        const job = this.jobs.get(serviceId);
        if (!job) {
            return false;
        }

        job.stop();
        this.jobs.delete(serviceId);
        console.log(`✓ Stopped monitor for service: ${serviceId}`);
        return true;
    }

    /**
     * Obtiene las estadísticas de todos los servicios
     */
    getAllStatistics(): ServiceStatistics[] {
        return Array.from(this.serviceStats.values());
    }

    /**
     * Obtiene las estadísticas de un servicio específico
     */
    getServiceStatistics(serviceId: string): ServiceStatistics | undefined {
        return this.serviceStats.get(serviceId);
    }

    /**
     * Obtiene el historial de checks de un servicio
     */
    getServiceHistory(serviceId: string, limit?: number): CheckResult[] {
        const history = this.checkHistory.get(serviceId) || [];
        return limit ? history.slice(-limit) : history;
    }

    /**
     * Imprime un resumen del monitoreo
     */
    printMonitoringSummary(): void {
        const enabledServices = LoadServicesConfig.getEnabledServices(this.config);
        const criticalServices = LoadServicesConfig.getCriticalServices(this.config);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('           🔍 MONITORING CONFIGURATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        enabledServices.forEach(service => {
            const icon = service.critical ? '🔴' : '🟢';
            console.log(`${icon} ${service.name}`);
            console.log(`   ID: ${service.id}`);
            console.log(`   URL: ${service.url}`);
            console.log(`   Interval: ${service.interval}`);
            if (service.description) {
                console.log(`   Description: ${service.description}`);
            }
            if (service.tags && service.tags.length > 0) {
                console.log(`   Tags: ${service.tags.join(', ')}`);
            }
            console.log('');
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Total Services: ${enabledServices.length}`);
        console.log(`   Critical Services: ${criticalServices.length}`);
        console.log(`   Default Timeout: ${this.config.global?.defaultTimeout || 5000}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    /**
     * Imprime el estado actual de todos los servicios
     */
    printCurrentStatus(): void {
        const stats = this.getAllStatistics();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('             📊 CURRENT STATUS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const stat of stats) {
            const statusIcon = this.getStatusIcon(stat.lastStatus);
            const uptimeColor = stat.uptime >= 99 ? '✅' : stat.uptime >= 95 ? '⚠️' : '❌';

            console.log(`${statusIcon} ${stat.serviceName}`);
            console.log(`   Uptime: ${uptimeColor} ${stat.uptime.toFixed(2)}%`);
            console.log(`   Checks: ${stat.successfulChecks}/${stat.totalChecks}`);
            console.log(`   Avg Response: ${stat.averageResponseTime.toFixed(0)}ms`);
            if (stat.lastCheck) {
                console.log(`   Last Check: ${stat.lastCheck.toISOString()}`);
            }
            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    /**
     * Envía una notificación de alerta
     */
    private async sendAlertNotification(
        alertRecord: any,
        service: ServiceConfig,
        isEscalation: boolean
    ): Promise<void> {
        try {
            // Determinar destinatarios
            let recipients: string[] = [];

            if (isEscalation && service.alerts?.escalation?.notifyTo) {
                recipients = service.alerts.escalation.notifyTo;
            } else if (service.alerts?.notifyEmails) {
                recipients = service.alerts.notifyEmails;
            }

            if (recipients.length === 0) {
                console.log(`   ℹ️  No email recipients configured for ${service.name}`);
                return;
            }

            // Obtener estado de salud para información adicional
            const healthState = this.alertService.getHealthState(service.id);

            // Enviar notificación
            const result = await this.notificationService.execute(
                alertRecord,
                recipients,
                isEscalation,
                healthState
            );

            if (result.success) {
                const escalationLabel = isEscalation ? ' (ESCALATED)' : '';
                console.log(`   📧 Alert sent to ${recipients.join(', ')}${escalationLabel}`);
            } else {
                console.error(`   ❌ Failed to send alert: ${result.error}`);
            }
        } catch (error) {
            console.error(`   ❌ Error sending notification:`, error);
        }
    }

    /**
     * Configura un timer para escalación automática
     */
    private setupEscalationTimer(service: ServiceConfig, alertRecord: any): void {
        if (!service.alerts?.escalation?.enabled) return;

        // Limpiar timer existente si hay
        this.clearEscalationTimer(service.id);

        const escalationMinutes = service.alerts.escalation.afterMinutes;
        const escalationMs = escalationMinutes * 60 * 1000;

        console.log(`   ⏱️  Escalation timer set for ${escalationMinutes} minutes`);

        const timer = setTimeout(async () => {
            // Verificar si aún está caído
            const healthState = this.alertService.getHealthState(service.id);

            if (healthState && healthState.currentStatus === 'down') {
                console.log(`\n🚨 ESCALATING: ${service.name} has been down for ${escalationMinutes} minutes`);

                // Crear alerta de escalación
                const escalationCheck = this.alertService.checkEscalation(
                    service.id,
                    service.alerts?.escalation
                );

                if (escalationCheck.needsEscalation) {
                    // Enviar notificación de escalación
                    await this.sendAlertNotification(alertRecord, service, true);
                }
            } else {
                console.log(`   ℹ️  Service ${service.name} recovered before escalation`);
            }

            // Limpiar el timer
            this.escalationTimers.delete(service.id);
        }, escalationMs);

        this.escalationTimers.set(service.id, timer);
    }

    /**
     * Limpia el timer de escalación de un servicio
     */
    private clearEscalationTimer(serviceId: string): void {
        const timer = this.escalationTimers.get(serviceId);
        if (timer) {
            clearTimeout(timer);
            this.escalationTimers.delete(serviceId);
            console.log(`   ✓ Escalation timer cleared for service: ${serviceId}`);
        }
    }

    /**
     * Obtiene el icono de estado
     */
    private getStatusIcon(status: string): string {
        switch (status) {
            case 'up':
                return '🟢';
            case 'down':
                return '🔴';
            case 'degraded':
                return '🟡';
            default:
                return '⚪';
        }
    }
}
