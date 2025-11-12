/**
 * Service Repository Interface
 * Define el contrato para el acceso a datos de servicios
 */

import { ServiceConfig } from '../interfaces/service-monitor.interface';

export abstract class ServiceRepository {
  abstract save(service: ServiceConfig): Promise<ServiceConfig>;
  abstract update(service: ServiceConfig): Promise<ServiceConfig>;
  abstract findById(id: string): Promise<ServiceConfig | null>;
  abstract findByEnabled(enabled: boolean): Promise<ServiceConfig[]>;
  abstract findByCritical(critical: boolean): Promise<ServiceConfig[]>;
  abstract findByTags(tags: string[]): Promise<ServiceConfig[]>;
  abstract getAll(): Promise<ServiceConfig[]>;
  abstract deleteById(id: string): Promise<boolean>;
  abstract updateLastCheck(id: string, status: string, timestamp: Date): Promise<void>;
}
