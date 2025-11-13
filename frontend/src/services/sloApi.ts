import { apiClient } from './api';
import type { SLO, SLOStatus } from '../types';

/**
 * SLO API - Endpoints for SLO management
 */
export const sloApi = {
  /**
   * Get all SLOs
   */
  async getAllSLOs(): Promise<SLO[]> {
    const response = await apiClient.get<SLO[]>('/api/slos');
    return response.data;
  },

  /**
   * Get SLO by ID
   */
  async getSLOById(id: string): Promise<SLO> {
    const response = await apiClient.get<SLO>(`/api/slos/${id}`);
    return response.data;
  },

  /**
   * Get SLOs by service ID
   */
  async getSLOsByService(serviceId: string): Promise<SLO[]> {
    const response = await apiClient.get<SLO[]>(`/api/slos/service/${serviceId}`);
    return response.data;
  },

  /**
   * Get all SLO statuses
   */
  async getAllStatuses(): Promise<SLOStatus[]> {
    const response = await apiClient.get<SLOStatus[]>('/api/slos/status/all');
    return response.data;
  },

  /**
   * Get SLO status by SLO ID
   */
  async getStatus(sloId: string): Promise<SLOStatus> {
    const response = await apiClient.get<SLOStatus>(`/api/slos/${sloId}/status`);
    return response.data;
  },

  /**
   * Get SLO status history
   */
  async getStatusHistory(sloId: string, limit = 100): Promise<SLOStatus[]> {
    const response = await apiClient.get<SLOStatus[]>(
      `/api/slos/${sloId}/history?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Create a new SLO
   */
  async createSLO(slo: Partial<SLO>): Promise<SLO> {
    const response = await apiClient.post<SLO>('/api/slos', slo);
    return response.data;
  },

  /**
   * Update an existing SLO
   */
  async updateSLO(id: string, slo: Partial<SLO>): Promise<SLO> {
    const response = await apiClient.put<SLO>(`/api/slos/${id}`, slo);
    return response.data;
  },

  /**
   * Delete a SLO
   */
  async deleteSLO(id: string): Promise<void> {
    await apiClient.delete(`/api/slos/${id}`);
  },

  /**
   * Enable/disable a SLO
   */
  async toggleSLO(id: string, enabled: boolean): Promise<SLO> {
    const response = await apiClient.patch<SLO>(`/api/slos/${id}`, { enabled });
    return response.data;
  },
};
