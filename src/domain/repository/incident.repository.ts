/**
 * Incident Repository Interface
 * Define el contrato para el acceso a datos de incidentes
 */

import { Incident, IncidentStatus, IncidentSeverity, IncidentStatistics } from '../entities/incident.entity';

export abstract class IncidentRepository {
  abstract save(incident: Incident): Promise<Incident>;
  abstract update(incident: Incident): Promise<Incident>;
  abstract findById(id: string): Promise<Incident | null>;
  abstract findByServiceId(serviceId: string): Promise<Incident[]>;
  abstract findByStatus(status: IncidentStatus[]): Promise<Incident[]>;
  abstract findBySeverity(severity: IncidentSeverity): Promise<Incident[]>;
  abstract findActiveByService(serviceId: string): Promise<Incident | null>;
  abstract getAll(): Promise<Incident[]>;
  abstract getStatistics(): Promise<IncidentStatistics>;
  abstract deleteById(id: string): Promise<boolean>;
  abstract findByDateRange(startDate: Date, endDate: Date): Promise<Incident[]>;
}
