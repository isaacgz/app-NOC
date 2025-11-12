import {
    AlertNotification,
    AlertRecord,
    NotificationResult,
    AlertType,
} from '../../interfaces/alert-system.interface';
import { ServiceHealthState } from '../../interfaces/alert-system.interface';
import { EmailService } from '../../../presentation/email/email.service';

/**
 * Caso de uso para enviar notificaciones de alertas
 */
export class SendAlertNotification {
    constructor(
        private readonly emailService: EmailService
    ) {}

    /**
     * Envía una notificación de alerta
     */
    async execute(
        alert: AlertRecord,
        recipients: string[],
        isEscalation: boolean = false,
        healthState?: ServiceHealthState
    ): Promise<NotificationResult> {
        try {
            const notification = this.buildNotification(alert, recipients, healthState, isEscalation);

            await this.sendEmail(notification);

            return {
                success: true,
                channel: 'email',
                alertId: alert.id,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                success: false,
                channel: 'email',
                alertId: alert.id,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Construye la notificación con toda la información
     */
    private buildNotification(
        alert: AlertRecord,
        recipients: string[],
        healthState: ServiceHealthState | undefined,
        isEscalation: boolean
    ): AlertNotification {
        const notification: AlertNotification = {
            alertId: alert.id,
            serviceId: alert.serviceId,
            serviceName: alert.serviceName,
            type: alert.type,
            priority: alert.priority,
            subject: this.buildSubject(alert, isEscalation),
            body: this.buildEmailBody(alert, isEscalation, healthState),
            recipients,
            channel: 'email',
            isEscalation,
            timestamp: new Date(),
            templateData: {
                url: alert.checkResult.url,
                responseTime: alert.checkResult.responseTime,
                statusCode: alert.checkResult.statusCode,
                errorMessage: alert.checkResult.error,
                consecutiveFailures: healthState?.consecutiveFailures,
                downtimeDuration: this.formatDuration(healthState?.downtimeDurationMinutes),
            },
        };

        return notification;
    }

    /**
     * Construye el asunto del email
     */
    private buildSubject(alert: AlertRecord, isEscalation: boolean): string {
        const prefix = isEscalation ? '🚨 ESCALATION' : this.getPriorityEmoji(alert.priority);
        const action = this.getActionText(alert.type);

        return `${prefix} NOC Alert: ${alert.serviceName} ${action}`;
    }

    /**
     * Construye el cuerpo del email en HTML
     */
    private buildEmailBody(
        alert: AlertRecord,
        isEscalation: boolean,
        healthState?: ServiceHealthState
    ): string {
        const { checkResult, metadata } = alert;
        const priorityColor = this.getPriorityColor(alert.priority);
        const statusIcon = this.getStatusIcon(alert.type);

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
        .alert-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${priorityColor}; border-radius: 4px; }
        .info-row { margin: 10px 0; padding: 8px; background: #fff; border-radius: 4px; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .error { color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { color: #388e3c; background: #e8f5e9; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-critical { background: #d32f2f; color: white; }
        .badge-high { background: #f57c00; color: white; }
        .badge-medium { background: #fbc02d; color: #333; }
        .badge-low { background: #388e3c; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusIcon} ${isEscalation ? 'ESCALATION: ' : ''}${alert.serviceName}</h1>
            <p style="margin: 5px 0 0 0;">${this.getActionText(alert.type)}</p>
        </div>

        <div class="content">`;

        // Mensaje de escalación
        if (isEscalation) {
            html += `
            <div class="error">
                <strong>⚠️ This is an escalated alert</strong><br>
                The service has been down for ${healthState?.downtimeDurationMinutes || 0} minutes without recovery.
            </div>`;
        }

        // Información principal
        html += `
            <div class="alert-box">
                <h3 style="margin-top: 0;">Alert Details</h3>

                <div class="info-row">
                    <span class="label">Service:</span>
                    <span class="value">${alert.serviceName}</span>
                    <span class="badge badge-${alert.priority}">${alert.priority.toUpperCase()}</span>
                </div>

                <div class="info-row">
                    <span class="label">URL:</span>
                    <span class="value">${checkResult.url}</span>
                </div>

                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="value">${checkResult.status.toUpperCase()}</span>
                </div>

                <div class="info-row">
                    <span class="label">Time:</span>
                    <span class="value">${alert.createdAt.toISOString()}</span>
                </div>`;

        // Información de error si existe
        if (checkResult.error) {
            html += `
                <div class="error">
                    <strong>Error Message:</strong><br>
                    ${checkResult.error}
                </div>`;
        }

        // Métricas
        html += `
            </div>

            <div class="alert-box">
                <h3 style="margin-top: 0;">Metrics</h3>`;

        if (checkResult.responseTime !== undefined) {
            html += `
                <div class="info-row">
                    <span class="label">Response Time:</span>
                    <span class="value">${checkResult.responseTime}ms</span>
                </div>`;
        }

        if (checkResult.statusCode !== undefined) {
            html += `
                <div class="info-row">
                    <span class="label">HTTP Status Code:</span>
                    <span class="value">${checkResult.statusCode}</span>
                </div>`;
        }

        if (healthState) {
            html += `
                <div class="info-row">
                    <span class="label">Consecutive Failures:</span>
                    <span class="value">${healthState.consecutiveFailures}</span>
                </div>`;

            if (healthState.downtimeStarted) {
                const downtime = Math.floor((Date.now() - healthState.downtimeStarted.getTime()) / 60000);
                html += `
                <div class="info-row">
                    <span class="label">Downtime Duration:</span>
                    <span class="value">${downtime} minutes</span>
                </div>`;
            }
        }

        if (metadata?.retryAttempts) {
            html += `
                <div class="info-row">
                    <span class="label">Retry Attempts:</span>
                    <span class="value">${metadata.retryAttempts}</span>
                </div>`;
        }

        html += `
            </div>`;

        // Validaciones fallidas si existen
        if (checkResult.metadata?.validationErrors && checkResult.metadata.validationErrors.length > 0) {
            html += `
            <div class="alert-box">
                <h3 style="margin-top: 0;">Validation Errors</h3>
                <ul>`;

            for (const error of checkResult.metadata.validationErrors) {
                html += `<li>${error}</li>`;
            }

            html += `
                </ul>
            </div>`;
        }

        // Mensaje de servicio recuperado
        if (alert.type === 'service_recovered' && healthState?.downtimeDurationMinutes) {
            html += `
            <div class="success">
                <strong>✅ Service Recovered</strong><br>
                The service was down for ${healthState.downtimeDurationMinutes} minutes and is now operational.
            </div>`;
        }

        html += `
        </div>

        <div class="footer">
            <p>NOC Monitoring System</p>
            <p>Alert ID: ${alert.id}</p>
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    /**
     * Envía el email
     */
    private async sendEmail(notification: AlertNotification): Promise<void> {
        const mailOptions = {
            to: notification.recipients,
            subject: notification.subject,
            htmlBody: notification.body,
            attachments: [], // Sin attachments para alertas
        };

        await this.emailService.sendEmail(mailOptions);
    }

    /**
     * Obtiene el emoji de prioridad
     */
    private getPriorityEmoji(priority: string): string {
        const emojis: Record<string, string> = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢',
        };
        return emojis[priority] || '⚪';
    }

    /**
     * Obtiene el color de prioridad
     */
    private getPriorityColor(priority: string): string {
        const colors: Record<string, string> = {
            critical: '#d32f2f',
            high: '#f57c00',
            medium: '#fbc02d',
            low: '#388e3c',
        };
        return colors[priority] || '#757575';
    }

    /**
     * Obtiene el icono de estado
     */
    private getStatusIcon(type: AlertType): string {
        const icons: Record<AlertType, string> = {
            service_down: '❌',
            service_recovered: '✅',
            service_degraded: '⚠️',
            service_timeout: '⏱️',
        };
        return icons[type] || '📊';
    }

    /**
     * Obtiene el texto de acción
     */
    private getActionText(type: AlertType): string {
        const texts: Record<AlertType, string> = {
            service_down: 'is DOWN',
            service_recovered: 'has RECOVERED',
            service_degraded: 'is DEGRADED',
            service_timeout: 'TIMEOUT',
        };
        return texts[type] || 'Status Change';
    }

    /**
     * Formatea duración
     */
    private formatDuration(minutes?: number): string {
        if (!minutes) return 'N/A';

        if (minutes < 60) {
            return `${minutes} minutes`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }

        return `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
}
