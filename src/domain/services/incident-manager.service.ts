/**
 * Incident Manager Service
 * Orquesta la creación, actualización y gestión de incidentes
 */

import { v4 as uuid } from 'uuid';
import { Incident, IncidentStatus, IncidentSeverity, IncidentEvent, IncidentStatistics } from '../entities/incident.entity';
import { IncidentRepository } from '../repository/incident.repository';

export interface CreateIncidentParams {
  serviceId: string;
  serviceName: string;
  severity: IncidentSeverity;
  description: string;
  estimatedImpact?: string;
}

export interface UpdateIncidentParams {
  status?: IncidentStatus;
  assignedTo?: string;
  rootCause?: string;
  resolution?: string;
  notes?: string;
}

export class IncidentManagerService {
  constructor(
    private incidentRepo: IncidentRepository
  ) {}

  /**
   * Crea un nuevo incidente
   */
  async createIncident(params: CreateIncidentParams): Promise<Incident> {
    const incident: Incident = {
      id: uuid(),
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      description: params.description,
      severity: params.severity,
      status: IncidentStatus.NEW,
      createdAt: new Date(),
      updatedAt: new Date(),
      affectedChecks: 1,
      estimatedImpact: params.estimatedImpact,
      timeline: [
        {
          timestamp: new Date(),
          type: 'created',
          message: 'Incident automatically created by monitoring system'
        }
      ],
      metadata: {}
    };

    const saved = await this.incidentRepo.save(incident);

    // Log de creación de incidente
    console.log(`📋 Incident created: ${saved.id} - ${saved.severity}`);

    return saved;
  }

  /**
   * Actualiza un incidente existente
   */
  async updateIncident(
    incidentId: string,
    params: UpdateIncidentParams
  ): Promise<Incident> {
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    // Actualizar campos
    if (params.status) {
      incident.status = params.status;

      if (params.status === IncidentStatus.RESOLVED) {
        incident.resolvedAt = new Date();
      } else if (params.status === IncidentStatus.CLOSED) {
        incident.closedAt = new Date();
      }
    }

    // Actualizar metadata
    if (!incident.metadata) {
      incident.metadata = {};
    }

    if (params.assignedTo !== undefined) {
      incident.metadata.assignedTo = params.assignedTo;
    }

    if (params.rootCause !== undefined) {
      incident.metadata.rootCause = params.rootCause;
    }

    if (params.resolution !== undefined) {
      incident.metadata.resolution = params.resolution;
    }

    incident.updatedAt = new Date();

    // Agregar evento al timeline
    const eventMessage = params.notes || this.buildUpdateDescription(params);
    incident.timeline.push({
      timestamp: new Date(),
      type: params.status === IncidentStatus.RESOLVED ? 'resolved' :
            params.status === IncidentStatus.CLOSED ? 'closed' :
            params.status ? 'status_change' : 'update',
      message: eventMessage
    });

    const updated = await this.incidentRepo.update(incident);

    // Log de actualización
    if (updated.status === IncidentStatus.RESOLVED || updated.status === IncidentStatus.CLOSED) {
      console.log(`✅ Incident ${updated.id} ${updated.status}: ${this.calculateDuration(updated)}`);
    }

    return updated;
  }

  /**
   * Vincula un check fallido a un incidente existente
   */
  async linkCheckToIncident(incidentId: string, checkDetails: any): Promise<void> {
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) return;

    incident.affectedChecks++;
    incident.updatedAt = new Date();

    incident.timeline.push({
      timestamp: new Date(),
      type: 'failed_check',
      message: `Additional check failed: ${checkDetails.message || 'Service still down'}`
    });

    await this.incidentRepo.update(incident);
  }

  /**
   * Encuentra un incidente activo para un servicio
   */
  async findActiveByService(serviceId: string): Promise<Incident | null> {
    return await this.incidentRepo.findActiveByService(serviceId);
  }

  /**
   * Obtiene todos los incidentes activos
   */
  async getActiveIncidents(): Promise<Incident[]> {
    return await this.incidentRepo.findByStatus([
      IncidentStatus.NEW,
      IncidentStatus.INVESTIGATING,
      IncidentStatus.IN_PROGRESS
    ]);
  }

  /**
   * Obtiene incidentes por servicio
   */
  async getIncidentsByService(serviceId: string): Promise<Incident[]> {
    return await this.incidentRepo.findByServiceId(serviceId);
  }

  /**
   * Obtiene todos los incidentes
   */
  async getAllIncidents(): Promise<Incident[]> {
    return await this.incidentRepo.getAll();
  }

  /**
   * Obtiene un incidente por ID
   */
  async getIncidentById(id: string): Promise<Incident | null> {
    return await this.incidentRepo.findById(id);
  }

  /**
   * Obtiene estadísticas de incidentes
   */
  async getStatistics(): Promise<IncidentStatistics> {
    return await this.incidentRepo.getStatistics();
  }

  /**
   * Auto-resuelve un incidente cuando el servicio se recupera
   */
  async autoResolveIncident(serviceId: string): Promise<Incident | null> {
    const activeIncident = await this.findActiveByService(serviceId);

    if (activeIncident) {
      // Calcular tiempo de resolución
      const resolutionTimeMinutes = Math.floor(
        (new Date().getTime() - activeIncident.createdAt.getTime()) / 60000
      );

      // Actualizar metadata con información de resolución
      if (!activeIncident.metadata) {
        activeIncident.metadata = {};
      }
      activeIncident.metadata.resolution = 'Automatic recovery detected by monitoring system';
      activeIncident.resolutionTimeMinutes = resolutionTimeMinutes;

      // Actualizar estado
      return await this.updateIncident(activeIncident.id, {
        status: IncidentStatus.RESOLVED,
        notes: 'Service automatically recovered. All health checks are now passing.',
        resolution: 'Automatic recovery detected by monitoring system'
      });
    }

    return null;
  }

  /**
   * Determina la severidad basada en el tipo de fallo
   */
  determineSeverity(checkResult: any): IncidentSeverity {
    if (!checkResult.ok) {
      // Si es un error de conexión o timeout, es crítico
      if (checkResult.message.includes('timeout') || checkResult.message.includes('ENOTFOUND')) {
        return IncidentSeverity.CRITICAL;
      }
      // Si es un error 5xx, es high
      if (checkResult.statusCode && checkResult.statusCode >= 500) {
        return IncidentSeverity.HIGH;
      }
      // Otros errores son medium
      return IncidentSeverity.MEDIUM;
    }

    // Si el response time es muy alto, es degradación (low)
    if (checkResult.responseTime && checkResult.responseTime > 3000) {
      return IncidentSeverity.LOW;
    }

    return IncidentSeverity.LOW;
  }

  /**
   * Métodos privados de ayuda
   */
  private buildUpdateDescription(params: UpdateIncidentParams): string {
    const parts: string[] = [];

    if (params.status) parts.push(`Status changed to ${params.status}`);
    if (params.assignedTo) parts.push(`Assigned to ${params.assignedTo}`);
    if (params.rootCause) parts.push(`Root cause identified: ${params.rootCause}`);
    if (params.resolution) parts.push(`Resolution: ${params.resolution}`);

    return parts.join('. ') || 'Incident updated';
  }

  private calculateDuration(incident: Incident): string {
    const endTime = incident.resolvedAt || incident.closedAt || new Date();
    const durationMs = endTime.getTime() - incident.createdAt.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }

    return `${minutes}m`;
  }
}
