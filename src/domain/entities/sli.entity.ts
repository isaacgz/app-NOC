/**
 * SLI (Service Level Indicator) Entity
 * Métricas específicas que se miden para calcular SLOs
 */

export interface SLIMeasurement {
  timestamp: Date;
  value: number;
  unit: string; // 'ms', '%', 'count', etc.
  success: boolean; // Si esta medición cumple con el objetivo
}

export interface SLISnapshot {
  serviceId: string;
  sliType: 'availability' | 'latency' | 'errorRate';
  value: number;
  timestamp: Date;
  details: {
    totalMeasurements: number;
    successfulMeasurements: number;
    failedMeasurements: number;
    averageLatency?: number;
    p50?: number;
    p95?: number;
    p99?: number;
  };
}

export interface SLIHistory {
  serviceId: string;
  sliType: 'availability' | 'latency' | 'errorRate';
  measurements: SLIMeasurement[];
  aggregatedValue: number;
  period: {
    start: Date;
    end: Date;
  };
}
