import PDFDocument from 'pdfkit';
import fs from 'fs';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log.entity';
import { LogStatistics, ServiceMetrics } from '../../domain/services/log-statistics.service';
import { ReportLevel } from '../email/report-template.generator';

export interface PDFReportOptions {
    statistics: LogStatistics;
    serviceMetrics: ServiceMetrics;
    companyName?: string;
    reportDate: Date;
    reportPeriod: string;
    reportLevel: ReportLevel;
    outputPath: string;
}

export class PDFReportService {

    /**
     * Genera un reporte PDF profesional
     */
    static async generatePDF(options: PDFReportOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const {
                    statistics,
                    serviceMetrics,
                    companyName = 'NOC System',
                    reportDate,
                    reportPeriod,
                    reportLevel,
                    outputPath
                } = options;

                // Crear documento PDF
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: {
                        top: 50,
                        bottom: 50,
                        left: 50,
                        right: 50
                    },
                    info: {
                        Title: `Reporte ${reportLevel.toUpperCase()} - ${companyName}`,
                        Author: companyName,
                        Subject: `Reporte de Sistema NOC - ${reportPeriod}`,
                        Keywords: 'NOC, Monitoreo, Logs, Reporte',
                        CreationDate: reportDate
                    }
                });

                // Stream de salida
                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                // Generar contenido según el nivel
                switch (reportLevel) {
                    case ReportLevel.EXECUTIVE:
                        this.generateExecutivePDF(doc, statistics, serviceMetrics, companyName, reportDate, reportPeriod);
                        break;
                    case ReportLevel.TECHNICAL:
                        this.generateTechnicalPDF(doc, statistics, serviceMetrics, companyName, reportDate, reportPeriod);
                        break;
                    case ReportLevel.OPERATIONS:
                        this.generateOperationsPDF(doc, statistics, serviceMetrics, companyName, reportDate, reportPeriod);
                        break;
                }

                // Finalizar documento
                doc.end();

                stream.on('finish', () => {
                    resolve(outputPath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Genera PDF de nivel ejecutivo
     */
    private static generateExecutivePDF(
        doc: PDFKit.PDFDocument,
        statistics: LogStatistics,
        serviceMetrics: ServiceMetrics,
        companyName: string,
        reportDate: Date,
        reportPeriod: string
    ): void {
        // Header
        this.addHeader(doc, companyName, 'Reporte Ejecutivo');
        this.addSubheader(doc, reportPeriod, reportDate);

        // KPIs principales
        doc.moveDown(2);
        doc.fontSize(16).fillColor('#1e3a8a').text('Indicadores Clave de Desempeño (KPIs)', { underline: true });
        doc.moveDown();

        // Disponibilidad
        this.addKPIBox(doc, 'Disponibilidad del Sistema', `${serviceMetrics.uptime.toFixed(2)}%`, this.getUptimeColor(serviceMetrics.uptime));
        doc.moveDown();

        // Total de eventos
        this.addKPIBox(doc, 'Total de Eventos', statistics.totalLogs.toString(), '#3b82f6');
        doc.moveDown();

        // Eventos críticos
        this.addKPIBox(doc, 'Eventos Críticos', statistics.highCount.toString(), statistics.highCount > 0 ? '#ef4444' : '#10b981');

        // Distribución
        doc.addPage();
        doc.fontSize(16).fillColor('#1e3a8a').text('Distribución de Eventos', { underline: true });
        doc.moveDown();

        this.addProgressBar(doc, 'Informativos', statistics.lowCount, statistics.totalLogs, '#10b981');
        this.addProgressBar(doc, 'Advertencias', statistics.mediumCount, statistics.totalLogs, '#f59e0b');
        this.addProgressBar(doc, 'Críticos', statistics.highCount, statistics.totalLogs, '#ef4444');

        // Eventos críticos si existen
        if (statistics.highCount > 0) {
            doc.moveDown(2);
            doc.fontSize(14).fillColor('#991b1b').text('⚠ Eventos Críticos Recientes', { underline: true });
            doc.moveDown();

            statistics.criticalEvents.slice(0, 5).forEach((log, index) => {
                doc.fontSize(10).fillColor('#000000');
                doc.text(`${index + 1}. ${this.formatDate(log.createdAt)}: ${log.message}`, {
                    width: 500
                });
                doc.moveDown(0.5);
            });
        }

        // Footer
        this.addFooter(doc, companyName);
    }

    /**
     * Genera PDF de nivel técnico
     */
    private static generateTechnicalPDF(
        doc: PDFKit.PDFDocument,
        statistics: LogStatistics,
        serviceMetrics: ServiceMetrics,
        companyName: string,
        reportDate: Date,
        reportPeriod: string
    ): void {
        // Header
        this.addHeader(doc, companyName, 'Reporte Técnico Detallado');
        this.addSubheader(doc, reportPeriod, reportDate);

        // Métricas técnicas
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#1e3a8a').text('Métricas del Sistema', { underline: true });
        doc.moveDown();

        const metrics = [
            ['Disponibilidad', `${serviceMetrics.uptime.toFixed(2)}%`],
            ['Total de Eventos', statistics.totalLogs.toString()],
            ['Eventos Informativos', `${statistics.lowCount} (${statistics.lowPercentage}%)`],
            ['Eventos de Advertencia', `${statistics.mediumCount} (${statistics.mediumPercentage}%)`],
            ['Eventos Críticos', `${statistics.highCount} (${statistics.highPercentage}%)`],
            ['Chequeos Totales', serviceMetrics.totalChecks.toString()],
            ['Chequeos Exitosos', serviceMetrics.successfulChecks.toString()],
            ['Chequeos Fallidos', serviceMetrics.failedChecks.toString()],
            ['Componente Más Activo', statistics.mostCommonOrigin || 'N/A'],
            ['Duración del Monitoreo', statistics.timeRange || 'N/A']
        ];

        this.addMetricsTable(doc, metrics);

        // Eventos críticos
        if (statistics.criticalEvents.length > 0) {
            doc.addPage();
            doc.fontSize(14).fillColor('#991b1b').text('🚨 Eventos Críticos (Top 10)', { underline: true });
            doc.moveDown();

            statistics.criticalEvents.forEach((log, index) => {
                doc.fontSize(9).fillColor('#000000');
                doc.text(`${index + 1}. [${this.formatDateTime(log.createdAt)}] ${log.message}`, {
                    width: 500
                });
                doc.fontSize(8).fillColor('#6b7280').text(`   Origen: ${log.origin}`, {
                    indent: 20
                });
                doc.moveDown(0.5);
            });
        }

        // Eventos recientes
        doc.addPage();
        doc.fontSize(14).fillColor('#1e3a8a').text('📋 Eventos Recientes (Últimos 20)', { underline: true });
        doc.moveDown();

        statistics.recentEvents.forEach((log, index) => {
            const color = this.getSeverityColor(log.level);
            doc.fontSize(9).fillColor('#000000');
            doc.text(`${index + 1}. [${this.formatDateTime(log.createdAt)}] [${log.level.toUpperCase()}] ${log.message}`, {
                width: 500
            });
            doc.fontSize(8).fillColor('#6b7280').text(`   Origen: ${log.origin}`, {
                indent: 20
            });
            doc.moveDown(0.3);
        });

        // Footer
        this.addFooter(doc, companyName);
    }

    /**
     * Genera PDF de nivel operaciones
     */
    private static generateOperationsPDF(
        doc: PDFKit.PDFDocument,
        statistics: LogStatistics,
        serviceMetrics: ServiceMetrics,
        companyName: string,
        reportDate: Date,
        reportPeriod: string
    ): void {
        // Header
        this.addHeader(doc, companyName, 'Reporte de Operaciones');
        this.addSubheader(doc, reportPeriod, reportDate);

        // Dashboard operacional
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#1e3a8a').text('Dashboard Operacional', { underline: true });
        doc.moveDown();

        // Métricas principales
        this.addOperationalMetric(doc, 'Disponibilidad del Sistema', `${serviceMetrics.uptime.toFixed(2)}%`, this.getUptimeLabel(serviceMetrics.uptime));
        this.addOperationalMetric(doc, 'Eventos Totales', statistics.totalLogs.toString(), statistics.timeRange || 'N/A');
        this.addOperationalMetric(doc, 'Tasa de Éxito', `${serviceMetrics.totalChecks > 0 ? ((serviceMetrics.successfulChecks / serviceMetrics.totalChecks) * 100).toFixed(1) : 0}%`, `${serviceMetrics.successfulChecks}/${serviceMetrics.totalChecks} checks`);

        // Estado del sistema
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#1e3a8a').text('Estado del Sistema', { underline: true });
        doc.moveDown();

        if (statistics.highCount === 0) {
            doc.fontSize(11).fillColor('#065f46').text('✓ Todos los sistemas operando normalmente');
        } else {
            doc.fontSize(11).fillColor('#991b1b').text(`⚠ ${statistics.highCount} evento${statistics.highCount > 1 ? 's' : ''} crítico${statistics.highCount > 1 ? 's' : ''} requiere${statistics.highCount > 1 ? 'n' : ''} atención`);
        }

        // Resumen por severidad
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#1e3a8a').text('Resumen de Eventos por Severidad', { underline: true });
        doc.moveDown();

        this.addSeveritySummary(doc, 'INFORMATIVOS', statistics.lowCount, statistics.lowPercentage, '#10b981');
        this.addSeveritySummary(doc, 'ADVERTENCIAS', statistics.mediumCount, statistics.mediumPercentage, '#f59e0b');
        this.addSeveritySummary(doc, 'CRÍTICOS', statistics.highCount, statistics.highPercentage, '#ef4444');

        // Eventos críticos si existen
        if (statistics.criticalEvents.length > 0) {
            doc.addPage();
            doc.fontSize(14).fillColor('#991b1b').text('🔴 Eventos Críticos Recientes', { underline: true });
            doc.moveDown();

            statistics.criticalEvents.slice(0, 10).forEach((log, index) => {
                doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${log.message}`, {
                    width: 500
                });
                doc.fontSize(8).fillColor('#6b7280').text(`   ${log.origin} | ${this.formatDateTime(log.createdAt)}`, {
                    indent: 20
                });
                doc.moveDown(0.5);
            });
        }

        // Información adicional
        doc.addPage();
        doc.fontSize(14).fillColor('#1e3a8a').text('📈 Información Adicional', { underline: true });
        doc.moveDown();

        const additionalInfo = [
            ['Primer Evento', statistics.firstLogDate ? this.formatDateTime(statistics.firstLogDate) : 'N/A'],
            ['Último Evento', statistics.lastLogDate ? this.formatDateTime(statistics.lastLogDate) : 'N/A'],
            ['Duración del Monitoreo', statistics.timeRange || 'N/A'],
            ['Componente Más Activo', statistics.mostCommonOrigin || 'N/A']
        ];

        this.addMetricsTable(doc, additionalInfo);

        // Footer
        this.addFooter(doc, companyName);
    }

    /**
     * Métodos auxiliares para el PDF
     */
    private static addHeader(doc: PDFKit.PDFDocument, companyName: string, title: string): void {
        doc.fillColor('#1e3a8a')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text(companyName, { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(16)
            .fillColor('#3b82f6')
            .text(title, { align: 'center' });

        doc.moveDown(0.5);
        doc.strokeColor('#e5e7eb')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(562, doc.y)
            .stroke();
    }

    private static addSubheader(doc: PDFKit.PDFDocument, period: string, date: Date): void {
        doc.moveDown();
        doc.fontSize(10)
            .fillColor('#6b7280')
            .font('Helvetica')
            .text(`Período: ${period} | Generado: ${this.formatDate(date)}`, { align: 'center' });
    }

    private static addKPIBox(doc: PDFKit.PDFDocument, label: string, value: string, color: string): void {
        const y = doc.y;
        doc.rect(50, y, 512, 60)
            .fillAndStroke(color, '#000000');

        doc.fontSize(10)
            .fillColor('#ffffff')
            .text(label, 60, y + 15, { width: 492 });

        doc.fontSize(24)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(value, 60, y + 30, { width: 492 });

        doc.font('Helvetica');
        doc.y = y + 70;
    }

    private static addProgressBar(doc: PDFKit.PDFDocument, label: string, value: number, total: number, color: string): void {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const y = doc.y;

        doc.fontSize(10)
            .fillColor('#000000')
            .text(`${label}: ${value} (${percentage.toFixed(1)}%)`, 50, y);

        doc.moveDown(0.5);
        const barY = doc.y;

        // Fondo de la barra
        doc.rect(50, barY, 500, 15)
            .fill('#e5e7eb');

        // Barra de progreso
        doc.rect(50, barY, (500 * percentage) / 100, 15)
            .fill(color);

        doc.moveDown(1.5);
    }

    private static addMetricsTable(doc: PDFKit.PDFDocument, data: string[][]): void {
        data.forEach(([key, value]) => {
            doc.fontSize(10)
                .fillColor('#374151')
                .font('Helvetica-Bold')
                .text(key + ':', 50, doc.y, { continued: true, width: 250 })
                .font('Helvetica')
                .fillColor('#000000')
                .text(' ' + value, { width: 250 });
            doc.moveDown(0.5);
        });
    }

    private static addOperationalMetric(doc: PDFKit.PDFDocument, label: string, value: string, detail: string): void {
        const y = doc.y;
        doc.rect(50, y, 512, 50)
            .fillAndStroke('#f9fafb', '#e5e7eb');

        doc.fontSize(9)
            .fillColor('#6b7280')
            .text(label, 60, y + 10, { width: 492 });

        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#111827')
            .text(value, 60, y + 22, { width: 250, continued: true });

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(' ' + detail, { align: 'right' });

        doc.font('Helvetica');
        doc.y = y + 60;
    }

    private static addSeveritySummary(doc: PDFKit.PDFDocument, label: string, count: number, percentage: number, color: string): void {
        const y = doc.y;
        doc.rect(50, y, 512, 40)
            .fillAndStroke('#ffffff', color);

        doc.fontSize(10)
            .fillColor('#6b7280')
            .text(label, 60, y + 10);

        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor(color)
            .text(count.toString(), 60, y + 20, { width: 200, continued: true });

        doc.fontSize(16)
            .fillColor('#000000')
            .text(`${percentage.toFixed(1)}%`, { align: 'right', width: 442 });

        doc.font('Helvetica');
        doc.y = y + 50;
    }

    private static addFooter(doc: PDFKit.PDFDocument, companyName: string): void {
        const bottomMargin = 50;
        const pageHeight = doc.page.height;

        doc.fontSize(8)
            .fillColor('#6b7280')
            .text(
                `${companyName} - Sistema de Monitoreo y Operaciones | Generado automáticamente`,
                50,
                pageHeight - bottomMargin - 30,
                { align: 'center', width: 512 }
            );
    }

    private static formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    private static formatDateTime(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    private static getUptimeColor(uptime: number): string {
        if (uptime >= 99.5) return '#10b981';
        if (uptime >= 95) return '#f59e0b';
        return '#ef4444';
    }

    private static getUptimeLabel(uptime: number): string {
        if (uptime >= 99.5) return 'Excelente';
        if (uptime >= 99) return 'Bueno';
        if (uptime >= 95) return 'Aceptable';
        return 'Requiere atención';
    }

    private static getSeverityColor(level: LogSeverityLevel): string {
        switch (level) {
            case LogSeverityLevel.low: return '#10b981';
            case LogSeverityLevel.medium: return '#f59e0b';
            case LogSeverityLevel.high: return '#ef4444';
            default: return '#6b7280';
        }
    }
}
