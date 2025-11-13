import { apiClient } from './api';
import type { Incident, IncidentStatistics } from '../types';

/**
 * Incident API - Endpoints for incident management
 */
export const incidentApi = {
  /**
   * Get all incidents
   */
  async getAllIncidents(): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>('/api/incidents');
    return response.data;
  },

  /**
   * Get active incidents only
   */
  async getActiveIncidents(): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>('/api/incidents/active');
    return response.data;
  },

  /**
   * Get incident by ID
   */
  async getIncidentById(id: string): Promise<Incident> {
    const response = await apiClient.get<Incident>(`/api/incidents/${id}`);
    return response.data;
  },

  /**
   * Get incidents by service ID
   */
  async getIncidentsByService(serviceId: string): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>(`/api/incidents/service/${serviceId}`);
    return response.data;
  },

  /**
   * Get incident statistics
   */
  async getStatistics(): Promise<IncidentStatistics> {
    const response = await apiClient.get<IncidentStatistics>('/api/incidents/stats');
    return response.data;
  },

  /**
   * Update incident status
   */
  async updateIncidentStatus(id: string, status: string, note?: string): Promise<Incident> {
    const response = await apiClient.patch<Incident>(`/api/incidents/${id}/status`, {
      status,
      note,
    });
    return response.data;
  },

  /**
   * Add note to incident timeline
   */
  async addNote(id: string, note: string): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/api/incidents/${id}/notes`, { note });
    return response.data;
  },

  /**
   * Resolve incident
   */
  async resolveIncident(id: string, resolution: string): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/api/incidents/${id}/resolve`, {
      resolution,
    });
    return response.data;
  },

  /**
   * Close incident
   */
  async closeIncident(id: string): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/api/incidents/${id}/close`);
    return response.data;
  },
};
