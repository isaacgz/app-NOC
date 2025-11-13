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
  type: 'created' | 'status_change' | 'update' | 'resolved' | 'closed' | 'failed_check';
  message: string;
  metadata?: any;
}

export interface IncidentMetadata {
  assignedTo?: string;
  tags?: string[];
  relatedIncidents?: string[];
  rootCause?: string;
  resolution?: string;
  [key: string]: any;
}

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  estimatedImpact?: string;
  affectedChecks: number;
  timeline: IncidentEvent[];
  metadata?: IncidentMetadata;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionTimeMinutes?: number;
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
