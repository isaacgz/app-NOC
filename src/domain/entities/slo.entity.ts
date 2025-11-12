/**
 * SLO (Service Level Objective) Entity
 * Define objetivos de nivel de servicio para monitoreo
 */

export type SLOWindow = '1h' | '24h' | '7d' | '30d' | '90d';

export type SLIType = 'availability' | 'latency' | 'errorRate';

export interface SLO {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  target: number; // 99.9 = 99.9%
  window: SLOWindow;
  sliType: SLIType;
  threshold?: number; // Para latency: 200ms, para errorRate: 1%
  enabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SLOStatus {
  sloId: string;
  sloName: string;
  serviceId: string;
  serviceName: string;
  currentValue: number; // Valor actual del SLI
  target: number; // Objetivo del SLO
  compliance: boolean; // ¿Se está cumpliendo el SLO?
  errorBudget: number; // Tiempo restante de error permitido (en minutos)
  errorBudgetTotal: number; // Error budget total del período
  errorBudgetUsed: number; // % del error budget usado (0-100)
  burnRate: number; // Velocidad de consumo del error budget
  violationRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  calculatedAt: Date;
  window: SLOWindow;
  sliType: SLIType;
}

export interface SLOAlert {
  sloId: string;
  type: 'violation' | 'risk' | 'recovery';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  details: {
    currentValue: number;
    target: number;
    errorBudgetRemaining: number;
    burnRate: number;
  };
}
