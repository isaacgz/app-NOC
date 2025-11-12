/**
 * Incident Repository Implementation
 * Persiste incidentes en archivos JSON
 */

import fs from 'fs';
import path from 'path';
import { Incident, IncidentStatus, IncidentSeverity, IncidentStatistics } from '../../domain/entities/incident.entity';
import { IncidentRepository } from '../../domain/repository/incident.repository';

export class IncidentRepositoryImpl extends IncidentRepository {
  private readonly dataDir: string;
  private readonly incidentsFile: string;
  private incidents: Map<string, Incident>;

  constructor(dataDir: string = './data/incidents') {
    super();
    this.dataDir = dataDir;
    this.incidentsFile = path.join(dataDir, 'incidents.json');
    this.incidents = new Map();
    this.ensureDataDir();
    this.loadIncidents();
  }

  async save(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, incident);
    await this.persist();
    return incident;
  }

  async update(incident: Incident): Promise<Incident> {
    if (!this.incidents.has(incident.id)) {
      throw new Error(`Incident ${incident.id} not found`);
    }
    this.incidents.set(incident.id, incident);
    await this.persist();
    return incident;
  }

  async findById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async findByServiceId(serviceId: string): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(inc => inc.serviceId === serviceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByStatus(status: IncidentStatus[]): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(inc => status.includes(inc.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findBySeverity(severity: IncidentSeverity): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(inc => inc.severity === severity)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findActiveByService(serviceId: string): Promise<Incident | null> {
    const activeStatuses = [
      IncidentStatus.NEW,
      IncidentStatus.INVESTIGATING,
      IncidentStatus.IN_PROGRESS
    ];

    const activeIncidents = Array.from(this.incidents.values())
      .filter(inc => inc.serviceId === serviceId && activeStatuses.includes(inc.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activeIncidents.length > 0 ? activeIncidents[0] : null;
  }

  async getAll(): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStatistics(): Promise<IncidentStatistics> {
    const allIncidents = Array.from(this.incidents.values());

    const bySeverity = {
      critical: allIncidents.filter(i => i.severity === IncidentSeverity.CRITICAL).length,
      high: allIncidents.filter(i => i.severity === IncidentSeverity.HIGH).length,
      medium: allIncidents.filter(i => i.severity === IncidentSeverity.MEDIUM).length,
      low: allIncidents.filter(i => i.severity === IncidentSeverity.LOW).length
    };

    const activeStatuses = [IncidentStatus.NEW, IncidentStatus.INVESTIGATING, IncidentStatus.IN_PROGRESS];
    const active = allIncidents.filter(i => activeStatuses.includes(i.status)).length;
    const resolved = allIncidents.filter(i => i.status === IncidentStatus.RESOLVED).length;
    const closed = allIncidents.filter(i => i.status === IncidentStatus.CLOSED).length;

    // Calcular tiempo promedio de resolución (solo para resueltos)
    const resolvedIncidents = allIncidents.filter(i => i.resolvedAt);
    let averageResolutionTime = 0;
    let mttr = 0;

    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, inc) => {
        const resolutionMs = inc.resolvedAt!.getTime() - inc.createdAt.getTime();
        return sum + resolutionMs;
      }, 0);

      averageResolutionTime = totalResolutionTime / resolvedIncidents.length / 60000; // en minutos
      mttr = averageResolutionTime; // MTTR = Mean Time To Resolution
    }

    return {
      total: allIncidents.length,
      active,
      resolved,
      closed,
      bySeverity,
      averageResolutionTime: parseFloat(averageResolutionTime.toFixed(2)),
      mttr: parseFloat(mttr.toFixed(2))
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = this.incidents.delete(id);
    if (deleted) {
      await this.persist();
    }
    return deleted;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(inc => {
        const createdAt = new Date(inc.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Métodos privados de persistencia
   */
  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadIncidents(): void {
    if (fs.existsSync(this.incidentsFile)) {
      try {
        const data = fs.readFileSync(this.incidentsFile, 'utf-8');
        const incidents = JSON.parse(data) as Incident[];

        // Convertir fechas de strings a Date objects
        incidents.forEach(inc => {
          inc.createdAt = new Date(inc.createdAt);
          inc.updatedAt = new Date(inc.updatedAt);
          if (inc.resolvedAt) inc.resolvedAt = new Date(inc.resolvedAt);
          if (inc.closedAt) inc.closedAt = new Date(inc.closedAt);
          inc.timeline = inc.timeline.map(event => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }));

          this.incidents.set(inc.id, inc);
        });

        console.log(`Loaded ${incidents.length} incidents from disk`);
      } catch (error) {
        console.error('Error loading incidents:', error);
      }
    }
  }

  private async persist(): Promise<void> {
    try {
      const incidents = Array.from(this.incidents.values());
      const data = JSON.stringify(incidents, null, 2);
      fs.writeFileSync(this.incidentsFile, data, 'utf-8');
    } catch (error) {
      console.error('Error persisting incidents:', error);
      throw error;
    }
  }
}
