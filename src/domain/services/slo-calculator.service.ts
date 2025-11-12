/**
 * SLO Calculator Service
 * Calcula el cumplimiento de SLOs y el error budget
 */

import { SLO, SLOStatus, SLOWindow, SLIType } from '../entities/slo.entity';
import { LogRepository } from '../repository/log.repository';
import { LogEntity } from '../entities/log.entity';

interface TimeWindow {
  start: Date;
  end: Date;
  totalMinutes: number;
}

export class SLOCalculatorService {
  constructor(private logRepo: LogRepository) {}

  /**
   * Calcula el estado actual de un SLO
   */
  async calculateSLOStatus(slo: SLO, serviceName: string): Promise<SLOStatus> {
    const timeWindow = this.parseTimeWindow(slo.window);
    const logs = await this.getLogsForWindow(slo.serviceId, timeWindow);

    let currentValue: number;

    switch (slo.sliType) {
      case 'availability':
        currentValue = this.calculateAvailability(logs);
        break;
      case 'latency':
        currentValue = this.calculateLatencyCompliance(logs, slo.threshold || 1000);
        break;
      case 'errorRate':
        currentValue = this.calculateErrorRate(logs);
        break;
      default:
        currentValue = 0;
    }

    const compliance = currentValue >= slo.target;
    const errorBudgetTotal = this.calculateTotalErrorBudget(slo.target, timeWindow.totalMinutes);
    const errorBudgetUsed = this.calculateErrorBudgetUsed(slo.target, currentValue, timeWindow.totalMinutes);
    const errorBudgetRemaining = Math.max(0, errorBudgetTotal - errorBudgetUsed);
    const errorBudgetUsedPercent = errorBudgetTotal > 0 ? (errorBudgetUsed / errorBudgetTotal) * 100 : 0;
    const burnRate = this.calculateBurnRate(logs, slo.target, slo.sliType, slo.threshold);
    const violationRisk = this.assessRisk(errorBudgetUsedPercent, burnRate, compliance);

    return {
      sloId: slo.id,
      sloName: slo.name,
      serviceId: slo.serviceId,
      serviceName: serviceName,
      currentValue: parseFloat(currentValue.toFixed(2)),
      target: slo.target,
      compliance,
      errorBudget: parseFloat(errorBudgetRemaining.toFixed(2)),
      errorBudgetTotal: parseFloat(errorBudgetTotal.toFixed(2)),
      errorBudgetUsed: parseFloat(errorBudgetUsedPercent.toFixed(2)),
      burnRate: parseFloat(burnRate.toFixed(2)),
      violationRisk,
      calculatedAt: new Date(),
      window: slo.window,
      sliType: slo.sliType
    };
  }

  /**
   * Calcula la disponibilidad (% de checks exitosos)
   */
  private calculateAvailability(logs: LogEntity[]): number {
    if (logs.length === 0) return 100;

    const successfulChecks = logs.filter(l => l.level === 'low').length;
    return (successfulChecks / logs.length) * 100;
  }

  /**
   * Calcula el cumplimiento de latencia (% de requests bajo el umbral)
   */
  private calculateLatencyCompliance(logs: LogEntity[], threshold: number): number {
    if (logs.length === 0) return 100;

    const withinThreshold = logs.filter(l => {
      const match = l.message.match(/Response time: (\d+)ms/);
      if (!match) return false;
      const responseTime = parseInt(match[1]);
      return responseTime <= threshold;
    }).length;

    return (withinThreshold / logs.length) * 100;
  }

  /**
   * Calcula la tasa de error (% de requests exitosos)
   */
  private calculateErrorRate(logs: LogEntity[]): number {
    if (logs.length === 0) return 100;

    const errors = logs.filter(l => l.level === 'high' || l.level === 'medium').length;
    const errorRate = (errors / logs.length) * 100;
    return 100 - errorRate; // Retornamos el % de éxito
  }

  /**
   * Calcula el error budget total (en minutos)
   */
  private calculateTotalErrorBudget(target: number, totalMinutes: number): number {
    // Error budget = tiempo que puede estar caído sin violar el SLO
    const allowedDowntimePercent = 100 - target;
    return (allowedDowntimePercent / 100) * totalMinutes;
  }

  /**
   * Calcula el error budget usado (en minutos)
   */
  private calculateErrorBudgetUsed(target: number, currentValue: number, totalMinutes: number): number {
    const actualDowntimePercent = 100 - currentValue;
    return (actualDowntimePercent / 100) * totalMinutes;
  }

  /**
   * Calcula la velocidad de consumo del error budget (burn rate)
   * > 1 = consumiendo más rápido de lo esperado
   * = 1 = consumiendo al ritmo esperado
   * < 1 = consumiendo más lento de lo esperado
   */
  private calculateBurnRate(
    logs: LogEntity[],
    target: number,
    sliType: SLIType,
    threshold?: number
  ): number {
    // Tomar los últimos 20 checks para calcular la tasa reciente
    const recentLogs = logs.slice(-Math.min(20, logs.length));
    if (recentLogs.length === 0) return 0;

    let recentValue: number;

    switch (sliType) {
      case 'availability':
        recentValue = this.calculateAvailability(recentLogs);
        break;
      case 'latency':
        recentValue = this.calculateLatencyCompliance(recentLogs, threshold || 1000);
        break;
      case 'errorRate':
        recentValue = this.calculateErrorRate(recentLogs);
        break;
      default:
        return 0;
    }

    const recentErrorRate = (100 - recentValue) / 100;
    const allowedErrorRate = (100 - target) / 100;

    if (allowedErrorRate === 0) {
      return recentErrorRate > 0 ? 999 : 0;
    }

    return recentErrorRate / allowedErrorRate;
  }

  /**
   * Evalúa el riesgo de violación del SLO
   */
  private assessRisk(
    budgetUsedPercent: number,
    burnRate: number,
    compliance: boolean
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    // Si ya está en violación, es crítico
    if (!compliance) return 'critical';

    // Si el burn rate es muy alto (> 5x) y se ha usado > 50% del budget
    if (burnRate > 5 && budgetUsedPercent > 50) return 'critical';

    // Si el burn rate es alto (> 3x) y se ha usado > 70% del budget
    if (burnRate > 3 || budgetUsedPercent > 90) return 'high';

    // Si el burn rate es moderado (> 2x) o se ha usado > 70% del budget
    if (burnRate > 2 || budgetUsedPercent > 70) return 'medium';

    // Si el burn rate es elevado (> 1.5x) o se ha usado > 50% del budget
    if (burnRate > 1.5 || budgetUsedPercent > 50) return 'low';

    return 'none';
  }

  /**
   * Parsea una ventana de tiempo a fechas
   */
  private parseTimeWindow(window: SLOWindow): TimeWindow {
    const end = new Date();
    const start = new Date();

    let totalMinutes: number;

    switch (window) {
      case '1h':
        start.setHours(start.getHours() - 1);
        totalMinutes = 60;
        break;
      case '24h':
        start.setHours(start.getHours() - 24);
        totalMinutes = 1440;
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        totalMinutes = 10080;
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        totalMinutes = 43200;
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        totalMinutes = 129600;
        break;
    }

    return { start, end, totalMinutes };
  }

  /**
   * Obtiene logs dentro de una ventana de tiempo
   */
  private async getLogsForWindow(serviceId: string, window: TimeWindow): Promise<LogEntity[]> {
    try {
      // Obtener logs de todos los niveles
      const lowLogs = await this.logRepo.getLogs('low' as any);
      const mediumLogs = await this.logRepo.getLogs('medium' as any);
      const highLogs = await this.logRepo.getLogs('high' as any);

      const allLogs = [...lowLogs, ...mediumLogs, ...highLogs];

      return allLogs.filter(log => {
        // Filtrar por servicio (el origin contiene el nombre del servicio)
        if (!log.origin.includes(serviceId)) return false;

        // Filtrar por rango de fechas
        const logDate = new Date(log.createdAt);
        return logDate >= window.start && logDate <= window.end;
      });
    } catch (error) {
      console.error(`Error getting logs for SLO calculation:`, error);
      return [];
    }
  }

  /**
   * Calcula estadísticas agregadas de múltiples SLOs
   */
  async calculateAggregatedStats(sloStatuses: SLOStatus[]) {
    const totalSLOs = sloStatuses.length;
    const compliantSLOs = sloStatuses.filter(s => s.compliance).length;
    const violatedSLOs = totalSLOs - compliantSLOs;
    const averageCompliance = sloStatuses.reduce((sum, s) => sum + s.currentValue, 0) / totalSLOs;
    const averageErrorBudgetUsed = sloStatuses.reduce((sum, s) => sum + s.errorBudgetUsed, 0) / totalSLOs;

    const atRisk = sloStatuses.filter(s =>
      s.violationRisk === 'high' || s.violationRisk === 'critical'
    ).length;

    return {
      totalSLOs,
      compliantSLOs,
      violatedSLOs,
      complianceRate: (compliantSLOs / totalSLOs) * 100,
      averageCompliance,
      averageErrorBudgetUsed,
      atRisk
    };
  }
}
