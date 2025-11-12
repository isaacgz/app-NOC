import { LogEntity, LogSeverityLevel } from '../entities/log.entity';

export interface LogStatistics {
    totalLogs: number;
    lowCount: number;
    mediumCount: number;
    highCount: number;
    lowPercentage: number;
    mediumPercentage: number;
    highPercentage: number;
    firstLogDate?: Date;
    lastLogDate?: Date;
    timeRange?: string;
    mostCommonOrigin?: string;
    criticalEvents: LogEntity[];
    recentEvents: LogEntity[];
}

export interface ServiceMetrics {
    uptime: number;
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    averageResponseTime?: number;
}

export class LogStatisticsService {

    /**
     * Calcula estadísticas completas de un conjunto de logs
     */
    static calculateStatistics(logs: LogEntity[]): LogStatistics {
        const totalLogs = logs.length;

        if (totalLogs === 0) {
            return {
                totalLogs: 0,
                lowCount: 0,
                mediumCount: 0,
                highCount: 0,
                lowPercentage: 0,
                mediumPercentage: 0,
                highPercentage: 0,
                criticalEvents: [],
                recentEvents: [],
            };
        }

        // Contar por severidad
        const lowCount = logs.filter(log => log.level === LogSeverityLevel.low).length;
        const mediumCount = logs.filter(log => log.level === LogSeverityLevel.medium).length;
        const highCount = logs.filter(log => log.level === LogSeverityLevel.high).length;

        // Calcular porcentajes
        const lowPercentage = (lowCount / totalLogs) * 100;
        const mediumPercentage = (mediumCount / totalLogs) * 100;
        const highPercentage = (highCount / totalLogs) * 100;

        // Ordenar logs por fecha
        const sortedLogs = [...logs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        const firstLogDate = sortedLogs[0]?.createdAt;
        const lastLogDate = sortedLogs[sortedLogs.length - 1]?.createdAt;
        const timeRange = this.formatTimeRange(firstLogDate, lastLogDate);

        // Encontrar origen más común
        const originCounts = new Map<string, number>();
        logs.forEach(log => {
            originCounts.set(log.origin, (originCounts.get(log.origin) || 0) + 1);
        });
        const mostCommonOrigin = Array.from(originCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0];

        // Eventos críticos (high severity)
        const criticalEvents = logs
            .filter(log => log.level === LogSeverityLevel.high)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10); // Top 10 eventos críticos

        // Eventos recientes
        const recentEvents = [...logs]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20); // 20 eventos más recientes

        return {
            totalLogs,
            lowCount,
            mediumCount,
            highCount,
            lowPercentage: parseFloat(lowPercentage.toFixed(2)),
            mediumPercentage: parseFloat(mediumPercentage.toFixed(2)),
            highPercentage: parseFloat(highPercentage.toFixed(2)),
            firstLogDate,
            lastLogDate,
            timeRange,
            mostCommonOrigin,
            criticalEvents,
            recentEvents,
        };
    }

    /**
     * Calcula métricas de servicio basadas en logs
     */
    static calculateServiceMetrics(logs: LogEntity[]): ServiceMetrics {
        const totalChecks = logs.filter(log =>
            log.message.toLowerCase().includes('check') ||
            log.message.toLowerCase().includes('service')
        ).length;

        const successfulChecks = logs.filter(log =>
            log.level === LogSeverityLevel.low &&
            (log.message.toLowerCase().includes('success') || log.message.toLowerCase().includes('ok'))
        ).length;

        const failedChecks = logs.filter(log =>
            (log.level === LogSeverityLevel.medium || log.level === LogSeverityLevel.high) &&
            (log.message.toLowerCase().includes('fail') || log.message.toLowerCase().includes('error'))
        ).length;

        const uptime = totalChecks > 0
            ? parseFloat(((successfulChecks / totalChecks) * 100).toFixed(2))
            : 100;

        return {
            uptime,
            totalChecks,
            successfulChecks,
            failedChecks,
        };
    }

    /**
     * Formatea el rango de tiempo entre dos fechas
     */
    private static formatTimeRange(start?: Date, end?: Date): string {
        if (!start || !end) return 'N/A';

        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        }
    }

    /**
     * Agrupa logs por período de tiempo
     */
    static groupLogsByPeriod(logs: LogEntity[], periodHours: number = 24): Map<string, LogEntity[]> {
        const groups = new Map<string, LogEntity[]>();

        logs.forEach(log => {
            const date = new Date(log.createdAt);
            const periodKey = this.getPeriodKey(date, periodHours);

            if (!groups.has(periodKey)) {
                groups.set(periodKey, []);
            }
            groups.get(periodKey)!.push(log);
        });

        return groups;
    }

    /**
     * Genera clave de período para agrupación
     */
    private static getPeriodKey(date: Date, periodHours: number): string {
        if (periodHours === 24) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
            const hour = Math.floor(date.getHours() / periodHours) * periodHours;
            return `${date.toISOString().split('T')[0]} ${hour}:00`;
        }
    }

    /**
     * Calcula tendencias comparando con período anterior
     */
    static calculateTrends(currentLogs: LogEntity[], previousLogs: LogEntity[]): {
        totalChange: number;
        criticalChange: number;
        uptimeChange: number;
    } {
        const currentStats = this.calculateStatistics(currentLogs);
        const previousStats = this.calculateStatistics(previousLogs);

        const totalChange = currentStats.totalLogs - previousStats.totalLogs;
        const criticalChange = currentStats.highCount - previousStats.highCount;

        const currentMetrics = this.calculateServiceMetrics(currentLogs);
        const previousMetrics = this.calculateServiceMetrics(previousLogs);
        const uptimeChange = currentMetrics.uptime - previousMetrics.uptime;

        return {
            totalChange,
            criticalChange,
            uptimeChange: parseFloat(uptimeChange.toFixed(2)),
        };
    }
}
