/**
 * SLO Repository Implementation
 * Persiste SLOs y sus estados en archivos JSON
 */

import fs from 'fs';
import path from 'path';
import { SLO, SLOStatus } from '../../domain/entities/slo.entity';
import { SLORepository } from '../../domain/repository/slo.repository';

export class SLORepositoryImpl extends SLORepository {
  private readonly dataDir: string;
  private readonly slosFile: string;
  private readonly statusFile: string;
  private slos: Map<string, SLO>;
  private statuses: Map<string, SLOStatus[]>; // sloId -> array de status históricos

  constructor(dataDir: string = './data/slos') {
    super();
    this.dataDir = dataDir;
    this.slosFile = path.join(dataDir, 'slos.json');
    this.statusFile = path.join(dataDir, 'slo-status.json');
    this.slos = new Map();
    this.statuses = new Map();
    this.ensureDataDir();
    this.loadSLOs();
    this.loadStatuses();
  }

  async save(slo: SLO): Promise<SLO> {
    this.slos.set(slo.id, slo);
    await this.persistSLOs();
    return slo;
  }

  async update(slo: SLO): Promise<SLO> {
    if (!this.slos.has(slo.id)) {
      throw new Error(`SLO ${slo.id} not found`);
    }
    slo.updatedAt = new Date();
    this.slos.set(slo.id, slo);
    await this.persistSLOs();
    return slo;
  }

  async findById(id: string): Promise<SLO | null> {
    return this.slos.get(id) || null;
  }

  async findByServiceId(serviceId: string): Promise<SLO[]> {
    return Array.from(this.slos.values())
      .filter(slo => slo.serviceId === serviceId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findEnabled(): Promise<SLO[]> {
    return Array.from(this.slos.values())
      .filter(slo => slo.enabled)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAll(): Promise<SLO[]> {
    return Array.from(this.slos.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = this.slos.delete(id);
    if (deleted) {
      this.statuses.delete(id); // También eliminar historial de status
      await this.persistSLOs();
      await this.persistStatuses();
    }
    return deleted;
  }

  async saveStatus(status: SLOStatus): Promise<SLOStatus> {
    const sloId = status.sloId;
    const history = this.statuses.get(sloId) || [];

    // Agregar nuevo status
    history.push(status);

    // Mantener solo los últimos 1000 registros por SLO
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.statuses.set(sloId, history);
    await this.persistStatuses();

    return status;
  }

  async getLatestStatus(sloId: string): Promise<SLOStatus | null> {
    const history = this.statuses.get(sloId);
    if (!history || history.length === 0) return null;

    return history[history.length - 1];
  }

  async getStatusHistory(sloId: string, limit: number = 100): Promise<SLOStatus[]> {
    const history = this.statuses.get(sloId) || [];

    // Retornar los últimos N registros
    return history.slice(-limit).reverse();
  }

  /**
   * Métodos privados de persistencia
   */
  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadSLOs(): void {
    if (fs.existsSync(this.slosFile)) {
      try {
        const data = fs.readFileSync(this.slosFile, 'utf-8');
        const slos = JSON.parse(data) as SLO[];

        slos.forEach(slo => {
          slo.createdAt = new Date(slo.createdAt);
          if (slo.updatedAt) slo.updatedAt = new Date(slo.updatedAt);
          this.slos.set(slo.id, slo);
        });

        console.log(`Loaded ${slos.length} SLOs from disk`);
      } catch (error) {
        console.error('Error loading SLOs:', error);
      }
    }
  }

  private loadStatuses(): void {
    if (fs.existsSync(this.statusFile)) {
      try {
        const data = fs.readFileSync(this.statusFile, 'utf-8');
        const statusMap = JSON.parse(data) as Record<string, SLOStatus[]>;

        Object.entries(statusMap).forEach(([sloId, statuses]) => {
          const convertedStatuses = statuses.map(s => ({
            ...s,
            calculatedAt: new Date(s.calculatedAt)
          }));
          this.statuses.set(sloId, convertedStatuses);
        });

        const totalStatuses = Object.values(statusMap).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Loaded ${totalStatuses} SLO status records from disk`);
      } catch (error) {
        console.error('Error loading SLO statuses:', error);
      }
    }
  }

  private async persistSLOs(): Promise<void> {
    try {
      const slos = Array.from(this.slos.values());
      const data = JSON.stringify(slos, null, 2);
      fs.writeFileSync(this.slosFile, data, 'utf-8');
    } catch (error) {
      console.error('Error persisting SLOs:', error);
      throw error;
    }
  }

  private async persistStatuses(): Promise<void> {
    try {
      const statusMap: Record<string, SLOStatus[]> = {};
      this.statuses.forEach((statuses, sloId) => {
        statusMap[sloId] = statuses;
      });

      const data = JSON.stringify(statusMap, null, 2);
      fs.writeFileSync(this.statusFile, data, 'utf-8');
    } catch (error) {
      console.error('Error persisting SLO statuses:', error);
      throw error;
    }
  }
}
