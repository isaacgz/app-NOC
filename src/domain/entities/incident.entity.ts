/**
 * Incident Entity
 * Representa un incidente en el sistema de monitoreo
 */

export enum IncidentStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface IncidentEvent {
  timestamp: Date;
  action: string;
  description: string;
  user?: string;
}

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  assignedTo?: string;
  rootCause?: string;
  resolution?: string;
  affectedChecks: number;
  estimatedImpact?: string;
  timeline: IncidentEvent[];
}

export interface IncidentStatistics {
  total: number;
  active: number;
  resolved: number;
  closed: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageResolutionTime: number; // en minutos
  mttr: number; // Mean Time To Resolution en minutos
}
