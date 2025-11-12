/**
 * SLO Repository Interface
 * Define el contrato para el acceso a datos de SLOs
 */

import { SLO, SLOStatus, SLOWindow } from '../entities/slo.entity';

export abstract class SLORepository {
  abstract save(slo: SLO): Promise<SLO>;
  abstract update(slo: SLO): Promise<SLO>;
  abstract findById(id: string): Promise<SLO | null>;
  abstract findByServiceId(serviceId: string): Promise<SLO[]>;
  abstract findEnabled(): Promise<SLO[]>;
  abstract getAll(): Promise<SLO[]>;
  abstract deleteById(id: string): Promise<boolean>;

  // SLO Status methods
  abstract saveStatus(status: SLOStatus): Promise<SLOStatus>;
  abstract getLatestStatus(sloId: string): Promise<SLOStatus | null>;
  abstract getStatusHistory(sloId: string, limit?: number): Promise<SLOStatus[]>;
}
