import { CheckResult } from '../interfaces/service-monitor.interface';
import {
    DetectedPattern,
    PatternType,
    PatternSeverity,
    MetricTrend,
    PatternDetectionConfig,
} from '../interfaces/pattern-detection.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio de detección de patrones y tendencias
 * Analiza el comportamiento de los servicios para predecir problemas
 */
export class PatternDetectorService {
    private detectedPatterns: Map<string, DetectedPattern[]> = new Map();
    private serviceHistory: Map<string, CheckResult[]> = new Map();

    constructor(private config: PatternDetectionConfig) {}

    /**
     * Agrega un check result al historial para análisis
     */
    addCheckResult(result: CheckResult): void {
        const history = this.serviceHistory.get(result.serviceId) || [];
        history.push(result);

        // Mantener solo los últimos N checks según la ventana de tiempo
        const maxChecks = this.config.timeWindowMinutes * 2; // Asumiendo ~30s por check
        if (history.length > maxChecks) {
            history.shift();
        }

        this.serviceHistory.set(result.serviceId, history);
    }

    /**
     * Analiza patrones para un servicio
     */
    analyzePatterns(serviceId: string, serviceName: string): DetectedPattern[] {
        if (!this.config.enabled) return [];

        const history = this.serviceHistory.get(serviceId);
        if (!history || history.length < 10) return []; // Necesitamos mínimo de datos

        const patterns: DetectedPattern[] = [];

        // Detectar degradación progresiva
        if (this.config.enabledPatterns.includes('progressive_degradation')) {
            const degradation = this.detectProgressiveDegradation(serviceId, serviceName, history);
            if (degradation) patterns.push(degradation);
        }

        // Detectar fallos intermitentes
        if (this.config.enabledPatterns.includes('intermittent_failures')) {
            const intermittent = this.detectIntermittentFailures(serviceId, serviceName, history);
            if (intermittent) patterns.push(intermittent);
        }

        // Detectar caídas recurrentes
        if (this.config.enabledPatterns.includes('recurring_downtime')) {
            const recurring = this.detectRecurringDowntime(serviceId, serviceName, history);
            if (recurring) patterns.push(recurring);
        }

        // Guardar patrones detectados
        if (patterns.length > 0) {
            this.detectedPatterns.set(serviceId, patterns);
        }

        return patterns;
    }

    /**
     * Detecta degradación progresiva (response time aumentando)
     */
    private detectProgressiveDegradation(
        serviceId: string,
        serviceName: string,
        history: CheckResult[]
    ): DetectedPattern | null {
        // Obtener solo los últimos 20 checks
        const recentHistory = history.slice(-20);

        // Calcular promedios de response time en dos ventanas
        const firstHalf = recentHistory.slice(0, 10);
        const secondHalf = recentHistory.slice(10, 20);

        const firstAvg = this.calculateAverageResponseTime(firstHalf);
        const secondAvg = this.calculateAverageResponseTime(secondHalf);

        // Si el promedio aumentó más del 50%
        const increasePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (increasePercentage > 50 && firstAvg > 0) {
            const confidence = Math.min(increasePercentage, 100);

            return {
                id: uuidv4(),
                type: 'progressive_degradation',
                severity: increasePercentage > 100 ? 'high' : 'medium',
                serviceId,
                serviceName,
                description: `Response time increasing progressively: from ${firstAvg.toFixed(0)}ms to ${secondAvg.toFixed(0)}ms (${increasePercentage.toFixed(1)}% increase)`,
                detectedAt: new Date(),
                data: {
                    timeWindowMinutes: this.config.timeWindowMinutes,
                    eventsAnalyzed: recentHistory.length,
                    confidence,
                    details: {
                        previousAverage: firstAvg,
                        currentAverage: secondAvg,
                        increasePercentage,
                    },
                },
                recommendations: [
                    'Check server resources (CPU, memory, disk)',
                    'Review recent deployments or configuration changes',
                    'Consider scaling resources if trend continues',
                ],
                notified: false,
            };
        }

        return null;
    }

    /**
     * Detecta fallos intermitentes
     */
    private detectIntermittentFailures(
        serviceId: string,
        serviceName: string,
        history: CheckResult[]
    ): DetectedPattern | null {
        const recentHistory = history.slice(-30);
        const failures = recentHistory.filter(h => !h.success);

        // Si hay fallos pero no son consecutivos (intermitentes)
        if (failures.length >= 3 && failures.length < recentHistory.length * 0.3) {
            // Verificar que no sean consecutivos
            let consecutiveCount = 0;
            let maxConsecutive = 0;

            for (const check of recentHistory) {
                if (!check.success) {
                    consecutiveCount++;
                    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
                } else {
                    consecutiveCount = 0;
                }
            }

            if (maxConsecutive < 3) {
                // Son intermitentes
                const failureRate = (failures.length / recentHistory.length) * 100;

                return {
                    id: uuidv4(),
                    type: 'intermittent_failures',
                    severity: failureRate > 20 ? 'high' : 'medium',
                    serviceId,
                    serviceName,
                    description: `Intermittent failures detected: ${failures.length} failures out of ${recentHistory.length} checks (${failureRate.toFixed(1)}% failure rate)`,
                    detectedAt: new Date(),
                    data: {
                        timeWindowMinutes: this.config.timeWindowMinutes,
                        eventsAnalyzed: recentHistory.length,
                        confidence: Math.min(failureRate * 3, 100),
                        details: {
                            totalFailures: failures.length,
                            failureRate,
                            maxConsecutiveFailures: maxConsecutive,
                        },
                    },
                    recommendations: [
                        'Check network stability',
                        'Review load balancer configuration',
                        'Investigate timeout settings',
                        'Look for rate limiting issues',
                    ],
                    notified: false,
                };
            }
        }

        return null;
    }

    /**
     * Detecta caídas recurrentes en horarios específicos
     */
    private detectRecurringDowntime(
        serviceId: string,
        serviceName: string,
        history: CheckResult[]
    ): DetectedPattern | null {
        // Agrupar fallos por hora del día
        const failuresByHour: Map<number, number> = new Map();
        const failures = history.filter(h => !h.success);

        for (const failure of failures) {
            const hour = failure.timestamp.getHours();
            failuresByHour.set(hour, (failuresByHour.get(hour) || 0) + 1);
        }

        // Buscar horas con muchos fallos
        for (const [hour, count] of failuresByHour.entries()) {
            if (count >= 3) {
                const totalInHour = history.filter(h => h.timestamp.getHours() === hour).length;
                const failureRate = (count / totalInHour) * 100;

                if (failureRate > 50) {
                    return {
                        id: uuidv4(),
                        type: 'recurring_downtime',
                        severity: 'medium',
                        serviceId,
                        serviceName,
                        description: `Recurring failures detected at hour ${hour}:00 (${count} failures, ${failureRate.toFixed(1)}% failure rate)`,
                        detectedAt: new Date(),
                        data: {
                            timeWindowMinutes: this.config.timeWindowMinutes,
                            eventsAnalyzed: history.length,
                            confidence: Math.min(failureRate, 100),
                            details: {
                                recurringHour: hour,
                                failuresAtHour: count,
                                failureRate,
                            },
                        },
                        recommendations: [
                            `Check for scheduled jobs running at ${hour}:00`,
                            'Review backup processes',
                            'Investigate maintenance windows',
                            'Check for cron jobs or batch processes',
                        ],
                        notified: false,
                    };
                }
            }
        }

        return null;
    }

    /**
     * Calcula tendencias de métricas
     */
    calculateTrend(serviceId: string): MetricTrend | null {
        const history = this.serviceHistory.get(serviceId);
        if (!history || history.length < 20) return null;

        const recentHistory = history.slice(-20);
        const firstHalf = recentHistory.slice(0, 10);
        const secondHalf = recentHistory.slice(10, 20);

        const firstAvg = this.calculateAverageResponseTime(firstHalf);
        const secondAvg = this.calculateAverageResponseTime(secondHalf);

        const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;

        let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (Math.abs(changeRate) > 10) {
            direction = changeRate > 0 ? 'increasing' : 'decreasing';
        }

        let concernLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
        if (direction === 'increasing' && changeRate > 50) concernLevel = 'high';
        else if (direction === 'increasing' && changeRate > 25) concernLevel = 'medium';
        else if (direction === 'increasing' && changeRate > 10) concernLevel = 'low';

        // Predicción simple
        const prediction = secondAvg + (secondAvg - firstAvg);

        return {
            serviceId,
            metric: 'responseTime',
            direction,
            changeRate,
            timeWindowMinutes: this.config.timeWindowMinutes,
            currentValue: secondAvg,
            previousValue: firstAvg,
            prediction,
            concernLevel,
        };
    }

    /**
     * Obtiene todos los patrones detectados
     */
    getAllDetectedPatterns(): Map<string, DetectedPattern[]> {
        return this.detectedPatterns;
    }

    /**
     * Marca un patrón como notificado
     */
    markAsNotified(patternId: string): void {
        for (const patterns of this.detectedPatterns.values()) {
            const pattern = patterns.find(p => p.id === patternId);
            if (pattern) {
                pattern.notified = true;
            }
        }
    }

    /**
     * Calcula promedio de response time
     */
    private calculateAverageResponseTime(checks: CheckResult[]): number {
        const responseTimes = checks
            .filter(c => c.responseTime !== undefined)
            .map(c => c.responseTime!);

        if (responseTimes.length === 0) return 0;

        return responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    }
}
