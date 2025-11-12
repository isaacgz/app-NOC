import { LogEntity, LogSeverityLevel } from '../../domain/entities/log.entity';
import { LogStatistics, ServiceMetrics } from '../../domain/services/log-statistics.service';

export enum ReportLevel {
    EXECUTIVE = 'executive',
    TECHNICAL = 'technical',
    OPERATIONS = 'operations',
}

export interface ReportData {
    statistics: LogStatistics;
    serviceMetrics: ServiceMetrics;
    companyName?: string;
    reportDate: Date;
    reportPeriod: string;
}

export class ReportTemplateGenerator {

    /**
     * Genera template HTML según el nivel de reporte
     */
    static generateReport(data: ReportData, level: ReportLevel): string {
        switch (level) {
            case ReportLevel.EXECUTIVE:
                return this.generateExecutiveReport(data);
            case ReportLevel.TECHNICAL:
                return this.generateTechnicalReport(data);
            case ReportLevel.OPERATIONS:
                return this.generateOperationsReport(data);
            default:
                return this.generateOperationsReport(data);
        }
    }

    /**
     * Reporte Ejecutivo - Solo KPIs y resumen de alto nivel
     */
    private static generateExecutiveReport(data: ReportData): string {
        const { statistics, serviceMetrics, companyName = 'NOC System', reportDate, reportPeriod } = data;

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Ejecutivo - ${companyName}</title>
    <style>
        ${this.getCommonStyles()}
        .executive-kpi {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
        }
        .executive-kpi h2 {
            font-size: 48px;
            margin: 10px 0;
            font-weight: 700;
        }
        .executive-kpi p {
            font-size: 16px;
            opacity: 0.9;
            margin: 5px 0;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-good { background-color: #10b981; }
        .status-warning { background-color: #f59e0b; }
        .status-critical { background-color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        ${this.getHeader(companyName, 'Reporte Ejecutivo')}

        <div class="section">
            <h2>Resumen Ejecutivo</h2>
            <p style="color: #6b7280; font-size: 14px;">Período: ${reportPeriod} | Generado: ${this.formatDate(reportDate)}</p>
        </div>

        <div class="metrics-grid">
            <div class="executive-kpi">
                <h2>${serviceMetrics.uptime}%</h2>
                <p>Disponibilidad del Sistema</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    <span class="status-indicator ${this.getUptimeStatus(serviceMetrics.uptime)}"></span>
                    ${this.getUptimeLabel(serviceMetrics.uptime)}
                </p>
            </div>

            <div class="executive-kpi" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h2>${statistics.totalLogs}</h2>
                <p>Total de Eventos</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    ${statistics.timeRange || 'N/A'}
                </p>
            </div>

            <div class="executive-kpi" style="background: ${statistics.highCount > 0 ? 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)' : 'linear-gradient(135deg, #51cf66 0%, #2b8a3e 100%)'};">
                <h2>${statistics.highCount}</h2>
                <p>Eventos Críticos</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    ${statistics.highPercentage}% del total
                </p>
            </div>
        </div>

        <div class="section">
            <h3>Distribución de Eventos</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                <div style="margin: 10px 0;">
                    <span style="color: #10b981; font-weight: 600;">✓ Informativos:</span>
                    <span style="float: right; font-weight: 700;">${statistics.lowCount} (${statistics.lowPercentage}%)</span>
                </div>
                <div style="margin: 10px 0;">
                    <span style="color: #f59e0b; font-weight: 600;">⚠ Advertencias:</span>
                    <span style="float: right; font-weight: 700;">${statistics.mediumCount} (${statistics.mediumPercentage}%)</span>
                </div>
                <div style="margin: 10px 0;">
                    <span style="color: #ef4444; font-weight: 600;">✖ Críticos:</span>
                    <span style="float: right; font-weight: 700;">${statistics.highCount} (${statistics.highPercentage}%)</span>
                </div>
            </div>
        </div>

        ${statistics.highCount > 0 ? `
        <div class="section">
            <h3>⚠️ Eventos Críticos Recientes</h3>
            <div class="alert alert-error">
                Se detectaron ${statistics.highCount} eventos críticos que requieren atención inmediata.
            </div>
            <ul style="list-style: none; padding: 0;">
                ${statistics.criticalEvents.slice(0, 5).map(log => `
                    <li style="padding: 10px; margin: 5px 0; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                        <strong>${this.formatDate(log.createdAt)}</strong>: ${log.message}
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${this.getFooter(companyName)}
    </div>
</body>
</html>`;
    }

    /**
     * Reporte Técnico - Detalles completos con análisis
     */
    private static generateTechnicalReport(data: ReportData): string {
        const { statistics, serviceMetrics, companyName = 'NOC System', reportDate, reportPeriod } = data;

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Técnico - ${companyName}</title>
    <style>
        ${this.getCommonStyles()}
        .metric-card-small {
            flex: 1;
            min-width: 200px;
        }
        .log-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 13px;
        }
        .log-table th {
            background: #1f2937;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .log-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .log-table tr:hover {
            background: #f9fafb;
        }
        .badge-low { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-medium { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-high { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        ${this.getHeader(companyName, 'Reporte Técnico Detallado')}

        <div class="section">
            <h2>Análisis Técnico del Sistema</h2>
            <p style="color: #6b7280;">Período: ${reportPeriod} | Generado: ${this.formatDate(reportDate)}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card metric-card-small">
                <div class="metric-label">Disponibilidad</div>
                <div class="metric-value">${serviceMetrics.uptime}%</div>
            </div>
            <div class="metric-card metric-card-small">
                <div class="metric-label">Total Eventos</div>
                <div class="metric-value">${statistics.totalLogs}</div>
            </div>
            <div class="metric-card metric-card-small">
                <div class="metric-label">Eventos Críticos</div>
                <div class="metric-value" style="color: #ef4444;">${statistics.highCount}</div>
            </div>
            <div class="metric-card metric-card-small">
                <div class="metric-label">Advertencias</div>
                <div class="metric-value" style="color: #f59e0b;">${statistics.mediumCount}</div>
            </div>
        </div>

        <div class="section">
            <h3>Métricas de Servicio</h3>
            <table class="log-table">
                <tr>
                    <th>Métrica</th>
                    <th>Valor</th>
                    <th>Estado</th>
                </tr>
                <tr>
                    <td>Chequeos Totales</td>
                    <td>${serviceMetrics.totalChecks}</td>
                    <td><span class="badge-low">NORMAL</span></td>
                </tr>
                <tr>
                    <td>Chequeos Exitosos</td>
                    <td>${serviceMetrics.successfulChecks}</td>
                    <td><span class="badge-low">OK</span></td>
                </tr>
                <tr>
                    <td>Chequeos Fallidos</td>
                    <td>${serviceMetrics.failedChecks}</td>
                    <td><span class="${serviceMetrics.failedChecks > 0 ? 'badge-high' : 'badge-low'}">${serviceMetrics.failedChecks > 0 ? 'ATENCIÓN' : 'OK'}</span></td>
                </tr>
                <tr>
                    <td>Origen Principal</td>
                    <td colspan="2">${statistics.mostCommonOrigin || 'N/A'}</td>
                </tr>
            </table>
        </div>

        ${statistics.criticalEvents.length > 0 ? `
        <div class="section">
            <h3>🚨 Eventos Críticos (Top 10)</h3>
            <table class="log-table">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Mensaje</th>
                        <th>Origen</th>
                        <th>Severidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${statistics.criticalEvents.map(log => `
                        <tr>
                            <td style="white-space: nowrap;">${this.formatDateTime(log.createdAt)}</td>
                            <td>${log.message}</td>
                            <td><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${log.origin}</code></td>
                            <td><span class="badge-high">CRÍTICO</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="section">
            <h3>📋 Eventos Recientes (Últimos 20)</h3>
            <table class="log-table">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Mensaje</th>
                        <th>Origen</th>
                        <th>Severidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${statistics.recentEvents.map(log => `
                        <tr>
                            <td style="white-space: nowrap;">${this.formatDateTime(log.createdAt)}</td>
                            <td>${log.message}</td>
                            <td><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${log.origin}</code></td>
                            <td><span class="badge-${log.level}">${log.level.toUpperCase()}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>📊 Distribución por Severidad</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                ${this.generateProgressBar('Informativos', statistics.lowCount, statistics.totalLogs, '#10b981')}
                ${this.generateProgressBar('Advertencias', statistics.mediumCount, statistics.totalLogs, '#f59e0b')}
                ${this.generateProgressBar('Críticos', statistics.highCount, statistics.totalLogs, '#ef4444')}
            </div>
        </div>

        ${this.getFooter(companyName)}
    </div>
</body>
</html>`;
    }

    /**
     * Reporte de Operaciones - Enfocado en métricas operacionales
     */
    private static generateOperationsReport(data: ReportData): string {
        const { statistics, serviceMetrics, companyName = 'NOC System', reportDate, reportPeriod } = data;

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Operaciones - ${companyName}</title>
    <style>
        ${this.getCommonStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.getHeader(companyName, 'Reporte de Operaciones')}

        <div class="section">
            <h2>Dashboard Operacional</h2>
            <p style="color: #6b7280;">Período: ${reportPeriod} | Generado: ${this.formatDate(reportDate)}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Disponibilidad del Sistema</div>
                <div class="metric-value">${serviceMetrics.uptime}%</div>
                <div class="metric-change ${serviceMetrics.uptime >= 99 ? 'positive' : 'negative'}">
                    ${this.getUptimeLabel(serviceMetrics.uptime)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Eventos Totales</div>
                <div class="metric-value">${statistics.totalLogs}</div>
                <div class="metric-change neutral">${statistics.timeRange || 'N/A'}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Tasa de Éxito</div>
                <div class="metric-value">${serviceMetrics.totalChecks > 0 ? ((serviceMetrics.successfulChecks / serviceMetrics.totalChecks) * 100).toFixed(1) : 0}%</div>
                <div class="metric-change positive">${serviceMetrics.successfulChecks}/${serviceMetrics.totalChecks} checks</div>
            </div>
        </div>

        <div class="section">
            <h3>Estado del Sistema</h3>
            ${statistics.highCount === 0
                ? '<div class="alert alert-success">✓ Todos los sistemas operando normalmente</div>'
                : `<div class="alert alert-error">⚠ ${statistics.highCount} evento${statistics.highCount > 1 ? 's' : ''} crítico${statistics.highCount > 1 ? 's' : ''} requiere${statistics.highCount > 1 ? 'n' : ''} atención</div>`
            }
        </div>

        <div class="section">
            <h3>Resumen de Eventos por Severidad</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #10b981;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">INFORMATIVOS</div>
                        <div style="font-size: 24px; font-weight: 700; color: #10b981;">${statistics.lowCount}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">PORCENTAJE</div>
                        <div style="font-size: 24px; font-weight: 700;">${statistics.lowPercentage}%</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">ADVERTENCIAS</div>
                        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${statistics.mediumCount}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">PORCENTAJE</div>
                        <div style="font-size: 24px; font-weight: 700;">${statistics.mediumPercentage}%</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">CRÍTICOS</div>
                        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${statistics.highCount}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">PORCENTAJE</div>
                        <div style="font-size: 24px; font-weight: 700;">${statistics.highPercentage}%</div>
                    </div>
                </div>
            </div>
        </div>

        ${statistics.criticalEvents.length > 0 ? `
        <div class="section">
            <h3>🔴 Eventos Críticos Recientes</h3>
            ${statistics.criticalEvents.slice(0, 10).map(log => `
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #991b1b; margin-bottom: 5px;">${log.message}</div>
                            <div style="font-size: 12px; color: #6b7280;">
                                <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 3px; margin-right: 10px;">${log.origin}</span>
                                ${this.formatDateTime(log.createdAt)}
                            </div>
                        </div>
                        <div style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap;">
                            CRÍTICO
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h3>📈 Información Adicional</h3>
            <table style="width: 100%; background: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tr>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;"><strong>Primer Evento:</strong></td>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">${statistics.firstLogDate ? this.formatDateTime(statistics.firstLogDate) : 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;"><strong>Último Evento:</strong></td>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">${statistics.lastLogDate ? this.formatDateTime(statistics.lastLogDate) : 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;"><strong>Duración del Monitoreo:</strong></td>
                    <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">${statistics.timeRange || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 15px;"><strong>Componente Más Activo:</strong></td>
                    <td style="padding: 15px;">${statistics.mostCommonOrigin || 'N/A'}</td>
                </tr>
            </table>
        </div>

        ${this.getFooter(companyName)}
    </div>
</body>
</html>`;
    }

    /**
     * Estilos CSS comunes para todos los templates
     */
    private static getCommonStyles(): string {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f3f4f6;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .section {
            padding: 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            font-size: 24px;
            color: #111827;
            margin-bottom: 15px;
        }
        .section h3 {
            font-size: 18px;
            color: #374151;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .metrics-grid {
            display: flex;
            gap: 20px;
            padding: 30px;
            flex-wrap: wrap;
        }
        .metric-card {
            flex: 1;
            min-width: 200px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .metric-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 5px;
        }
        .metric-change {
            font-size: 14px;
            font-weight: 500;
        }
        .metric-change.positive {
            color: #059669;
        }
        .metric-change.negative {
            color: #dc2626;
        }
        .metric-change.neutral {
            color: #6b7280;
        }
        .alert {
            padding: 15px 20px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
        }
        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border-left: 4px solid #10b981;
        }
        .alert-warning {
            background: #fef3c7;
            color: #92400e;
            border-left: 4px solid #f59e0b;
        }
        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border-left: 4px solid #ef4444;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .metrics-grid {
                flex-direction: column;
            }
            .metric-card {
                min-width: 100%;
            }
        }
        `;
    }

    /**
     * Header común
     */
    private static getHeader(companyName: string, reportTitle: string): string {
        return `
        <div class="header">
            <h1>${companyName}</h1>
            <p>${reportTitle}</p>
        </div>
        `;
    }

    /**
     * Footer común
     */
    private static getFooter(companyName: string): string {
        return `
        <div class="footer">
            <p><strong>${companyName}</strong> - Sistema de Monitoreo y Operaciones</p>
            <p style="margin-top: 10px;">
                Este es un reporte automático generado por el sistema NOC.<br>
                Para más información, contacte al equipo de operaciones.
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                Generado automáticamente - No responder a este correo
            </p>
        </div>
        `;
    }

    /**
     * Genera una barra de progreso visual
     */
    private static generateProgressBar(label: string, value: number, total: number, color: string): string {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return `
        <div style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #374151;">${label}</span>
                <span style="color: #6b7280;">${value} (${percentage.toFixed(1)}%)</span>
            </div>
            <div style="background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
            </div>
        </div>
        `;
    }

    /**
     * Formatea fecha en formato legible
     */
    private static formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    }

    /**
     * Formatea fecha y hora completa
     */
    private static formatDateTime(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date);
    }

    /**
     * Obtiene el estado del uptime
     */
    private static getUptimeStatus(uptime: number): string {
        if (uptime >= 99.5) return 'status-good';
        if (uptime >= 95) return 'status-warning';
        return 'status-critical';
    }

    /**
     * Obtiene la etiqueta del uptime
     */
    private static getUptimeLabel(uptime: number): string {
        if (uptime >= 99.5) return 'Excelente';
        if (uptime >= 99) return 'Bueno';
        if (uptime >= 95) return 'Aceptable';
        return 'Requiere atención';
    }
}
