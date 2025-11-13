/**
 * Types for NOC Dashboard Frontend
 */

// ============================================================
// Service Types
// ============================================================
export interface Service {
  id: string;
  name: string;
  description?: string;
  url: string;
  interval: string;
  critical: boolean;
  enabled: boolean;
  tags?: string[];
  healthCheck?: HealthCheckConfig;
  alerts?: AlertConfig;
  lastCheckAt?: string;
  lastStatus?: string;
}

export interface HealthCheckConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  expectedResponse?: {
    statusCode?: number;
    acceptedStatusCodes?: number[];
    bodyContains?: string;
    requiredHeaders?: string[];
    maxResponseTime?: number;
  };
  followRedirects?: boolean;
}

export interface AlertConfig {
  enabled?: boolean;
  notifyEmails?: string[];
  notifyOnRecovery?: boolean;
  cooldown?: {
    durationMinutes: number;
    maxAlertsInPeriod?: number;
  };
  retry?: {
    attempts: number;
    delayMs: number;
  };
  escalation?: {
    enabled: boolean;
    afterMinutes: number;
    notifyTo: string[];
  };
}

// ============================================================
// Incident Types
// ============================================================
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'new' | 'investigating' | 'in_progress' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  estimatedImpact?: string;
  affectedChecks: number;
  timeline: IncidentTimelineEvent[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionTimeMinutes?: number;
}

export interface IncidentTimelineEvent {
  timestamp: string;
  type: 'created' | 'status_change' | 'note' | 'resolved' | 'closed';
  description: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface IncidentStatistics {
  total: number;
  active: number;
  resolved: number;
  mttr: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// ============================================================
// SLO Types
// ============================================================
export type SLOWindow = '1h' | '24h' | '7d' | '30d' | '90d';
export type SLIType = 'availability' | 'latency' | 'errorRate';
export type ViolationRisk = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface SLO {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  target: number;
  window: SLOWindow;
  sliType: SLIType;
  threshold?: number;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SLOStatus {
  sloId: string;
  sloName: string;
  serviceId: string;
  serviceName: string;
  currentValue: number;
  target: number;
  compliance: boolean;
  errorBudget: number;
  errorBudgetTotal: number;
  errorBudgetUsed: number;
  burnRate: number;
  violationRisk: ViolationRisk;
  calculatedAt: string;
  window: SLOWindow;
  sliType: SLIType;
}

// ============================================================
// Service Monitor Types
// ============================================================
export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown';

export interface ServiceOverview {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  lastCheck?: string;
  critical: boolean;
  tags?: string[];
  activeIncident?: {
    id: string;
    severity: IncidentSeverity;
    createdAt: string;
  };
}

export interface SystemMetrics {
  totalServices: number;
  servicesUp: number;
  servicesDown: number;
  servicesDegraded: number;
  activeIncidents: number;
  criticalIncidents: number;
  averageUptime: number;
  sloCompliance: number;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
