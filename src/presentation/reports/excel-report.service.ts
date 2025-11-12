import ExcelJS from 'exceljs';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log.entity';
import { LogStatistics, ServiceMetrics } from '../../domain/services/log-statistics.service';

export interface ExcelReportOptions {
    statistics: LogStatistics;
    serviceMetrics: ServiceMetrics;
    logs: LogEntity[];
    companyName?: string;
    reportDate: Date;
    reportPeriod: string;
    outputPath: string;
}

export class ExcelReportService {

    /**
     * Genera un reporte Excel profesional con múltiples hojas
     */
    static async generateExcelReport(options: ExcelReportOptions): Promise<string> {
        const {
            statistics,
            serviceMetrics,
            logs,
            companyName = 'NOC System',
            reportDate,
            reportPeriod,
            outputPath
        } = options;

        // Crear workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = companyName;
        workbook.created = reportDate;
        workbook.modified = reportDate;
        workbook.properties.date1904 = false;

        // Hoja 1: Resumen Ejecutivo
        this.createSummarySheet(workbook, statistics, serviceMetrics, companyName, reportPeriod);

        // Hoja 2: Todos los eventos
        this.createAllLogsSheet(workbook, logs);

        // Hoja 3: Eventos críticos
        if (statistics.criticalEvents.length > 0) {
            this.createCriticalLogsSheet(workbook, statistics.criticalEvents);
        }

        // Hoja 4: Análisis por severidad
        this.createAnalysisSheet(workbook, statistics, logs);

        // Guardar archivo
        await workbook.xlsx.writeFile(outputPath);
        return outputPath;
    }

    /**
     * Crea hoja de resumen ejecutivo
     */
    private static createSummarySheet(
        workbook: ExcelJS.Workbook,
        statistics: LogStatistics,
        serviceMetrics: ServiceMetrics,
        companyName: string,
        reportPeriod: string
    ): void {
        const sheet = workbook.addWorksheet('Resumen Ejecutivo', {
            properties: { tabColor: { argb: 'FF3B82F6' } }
        });

        // Configurar columnas
        sheet.columns = [
            { width: 30 },
            { width: 20 },
            { width: 20 }
        ];

        // Título
        sheet.mergeCells('A1:C1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = companyName;
        titleCell.font = { size: 18, bold: true, color: { argb: 'FF1E3A8A' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;

        // Subtítulo
        sheet.mergeCells('A2:C2');
        const subtitleCell = sheet.getCell('A2');
        subtitleCell.value = 'Reporte Ejecutivo de Sistema NOC';
        subtitleCell.font = { size: 14, bold: true };
        subtitleCell.alignment = { horizontal: 'center' };

        // Período
        sheet.mergeCells('A3:C3');
        const periodCell = sheet.getCell('A3');
        periodCell.value = `Período: ${reportPeriod}`;
        periodCell.font = { size: 11, italic: true };
        periodCell.alignment = { horizontal: 'center' };

        sheet.addRow([]);

        // KPIs principales
        const kpiHeaderRow = sheet.addRow(['Indicador Clave', 'Valor', 'Estado']);
        kpiHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        kpiHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A8A' }
        };
        kpiHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
        kpiHeaderRow.height = 25;

        // Disponibilidad
        const uptimeRow = sheet.addRow(['Disponibilidad del Sistema', `${serviceMetrics.uptime.toFixed(2)}%`, this.getUptimeLabel(serviceMetrics.uptime)]);
        uptimeRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: this.getUptimeColorHex(serviceMetrics.uptime) }
        };

        // Total de eventos
        sheet.addRow(['Total de Eventos', statistics.totalLogs, statistics.timeRange || 'N/A']);

        // Eventos críticos
        const criticalRow = sheet.addRow(['Eventos Críticos', statistics.highCount, statistics.highCount > 0 ? 'ATENCIÓN' : 'OK']);
        criticalRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: statistics.highCount > 0 ? 'FFEF4444' : 'FF10B981' }
        };
        criticalRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        sheet.addRow([]);

        // Distribución
        const distHeaderRow = sheet.addRow(['Distribución de Eventos']);
        sheet.mergeCells(distHeaderRow.number, 1, distHeaderRow.number, 3);
        distHeaderRow.font = { size: 12, bold: true };
        distHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
        };

        const distRow = sheet.addRow(['Severidad', 'Cantidad', 'Porcentaje']);
        distRow.font = { bold: true };
        distRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };

        const lowRow = sheet.addRow(['Informativos', statistics.lowCount, `${statistics.lowPercentage}%`]);
        lowRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
        };

        const mediumRow = sheet.addRow(['Advertencias', statistics.mediumCount, `${statistics.mediumPercentage}%`]);
        mediumRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }
        };

        const highRow = sheet.addRow(['Críticos', statistics.highCount, `${statistics.highPercentage}%`]);
        highRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' }
        };

        sheet.addRow([]);

        // Métricas de servicio
        const metricsHeaderRow = sheet.addRow(['Métricas de Servicio']);
        sheet.mergeCells(metricsHeaderRow.number, 1, metricsHeaderRow.number, 3);
        metricsHeaderRow.font = { size: 12, bold: true };
        metricsHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
        };

        sheet.addRow(['Chequeos Totales', serviceMetrics.totalChecks, '']);
        sheet.addRow(['Chequeos Exitosos', serviceMetrics.successfulChecks, '']);
        sheet.addRow(['Chequeos Fallidos', serviceMetrics.failedChecks, '']);
        sheet.addRow(['Componente Más Activo', statistics.mostCommonOrigin || 'N/A', '']);

        // Bordes
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 4) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });
    }

    /**
     * Crea hoja con todos los eventos
     */
    private static createAllLogsSheet(workbook: ExcelJS.Workbook, logs: LogEntity[]): void {
        const sheet = workbook.addWorksheet('Todos los Eventos', {
            properties: { tabColor: { argb: 'FF6B7280' } }
        });

        // Configurar columnas
        sheet.columns = [
            { header: 'Fecha/Hora', key: 'date', width: 20 },
            { header: 'Severidad', key: 'severity', width: 12 },
            { header: 'Mensaje', key: 'message', width: 50 },
            { header: 'Origen', key: 'origin', width: 30 }
        ];

        // Estilo de header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF374151' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Agregar datos
        logs.forEach((log) => {
            const row = sheet.addRow({
                date: this.formatDateTime(log.createdAt),
                severity: log.level.toUpperCase(),
                message: log.message,
                origin: log.origin
            });

            // Color según severidad
            const severityCell = row.getCell('severity');
            severityCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: this.getSeverityColorHex(log.level) }
            };
            severityCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            severityCell.alignment = { horizontal: 'center' };
        });

        // Bordes
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 0) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Filtros
        sheet.autoFilter = {
            from: 'A1',
            to: 'D1'
        };

        // Freeze header
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Crea hoja con eventos críticos
     */
    private static createCriticalLogsSheet(workbook: ExcelJS.Workbook, criticalLogs: LogEntity[]): void {
        const sheet = workbook.addWorksheet('Eventos Críticos', {
            properties: { tabColor: { argb: 'FFEF4444' } }
        });

        // Configurar columnas
        sheet.columns = [
            { header: 'Fecha/Hora', key: 'date', width: 20 },
            { header: 'Mensaje', key: 'message', width: 60 },
            { header: 'Origen', key: 'origin', width: 30 }
        ];

        // Estilo de header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF991B1B' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Agregar datos
        criticalLogs.forEach((log) => {
            const row = sheet.addRow({
                date: this.formatDateTime(log.createdAt),
                message: log.message,
                origin: log.origin
            });

            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEF2F2' }
            };
        });

        // Bordes
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 0) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Freeze header
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Crea hoja de análisis por severidad
     */
    private static createAnalysisSheet(workbook: ExcelJS.Workbook, statistics: LogStatistics, logs: LogEntity[]): void {
        const sheet = workbook.addWorksheet('Análisis Detallado', {
            properties: { tabColor: { argb: 'FF10B981' } }
        });

        // Configurar columnas
        sheet.columns = [
            { width: 25 },
            { width: 20 },
            { width: 20 }
        ];

        // Título
        const titleRow = sheet.addRow(['Análisis Detallado por Origen y Severidad']);
        sheet.mergeCells(titleRow.number, 1, titleRow.number, 3);
        titleRow.font = { size: 14, bold: true };
        titleRow.alignment = { horizontal: 'center' };
        titleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
        };

        sheet.addRow([]);

        // Agrupar logs por origen
        const byOrigin = new Map<string, { low: number; medium: number; high: number; total: number }>();

        logs.forEach((log) => {
            if (!byOrigin.has(log.origin)) {
                byOrigin.set(log.origin, { low: 0, medium: 0, high: 0, total: 0 });
            }
            const stats = byOrigin.get(log.origin)!;
            stats.total++;
            switch (log.level) {
                case LogSeverityLevel.low:
                    stats.low++;
                    break;
                case LogSeverityLevel.medium:
                    stats.medium++;
                    break;
                case LogSeverityLevel.high:
                    stats.high++;
                    break;
            }
        });

        // Header de tabla
        const headerRow = sheet.addRow(['Origen/Componente', 'Total Eventos', 'Distribución']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F2937' }
        };
        headerRow.alignment = { horizontal: 'center' };

        // Datos por origen
        Array.from(byOrigin.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([origin, stats]) => {
                const row = sheet.addRow([
                    origin,
                    stats.total,
                    `Low: ${stats.low} | Med: ${stats.medium} | High: ${stats.high}`
                ]);

                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

        sheet.addRow([]);
        sheet.addRow([]);

        // Resumen temporal
        const timeRow = sheet.addRow(['Análisis Temporal']);
        sheet.mergeCells(timeRow.number, 1, timeRow.number, 3);
        timeRow.font = { size: 14, bold: true };
        timeRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
        };

        sheet.addRow(['Primer Evento', statistics.firstLogDate ? this.formatDateTime(statistics.firstLogDate) : 'N/A', '']);
        sheet.addRow(['Último Evento', statistics.lastLogDate ? this.formatDateTime(statistics.lastLogDate) : 'N/A', '']);
        sheet.addRow(['Duración', statistics.timeRange || 'N/A', '']);
    }

    /**
     * Métodos auxiliares
     */
    private static formatDateTime(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    private static getUptimeLabel(uptime: number): string {
        if (uptime >= 99.5) return 'EXCELENTE';
        if (uptime >= 99) return 'BUENO';
        if (uptime >= 95) return 'ACEPTABLE';
        return 'REQUIERE ATENCIÓN';
    }

    private static getUptimeColorHex(uptime: number): string {
        if (uptime >= 99.5) return 'FF10B981';
        if (uptime >= 95) return 'FFF59E0B';
        return 'FFEF4444';
    }

    private static getSeverityColorHex(level: LogSeverityLevel): string {
        switch (level) {
            case LogSeverityLevel.low:
                return 'FF10B981';
            case LogSeverityLevel.medium:
                return 'FFF59E0B';
            case LogSeverityLevel.high:
                return 'FFEF4444';
            default:
                return 'FF6B7280';
        }
    }
}
