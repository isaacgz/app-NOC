import { apiClient } from './api';
import type { Service, ServiceOverview, SystemMetrics } from '../types';

/**
 * Service API - Endpoints for service management
 */
export const serviceApi = {
  /**
   * Get system overview metrics
   */
  async getOverview(): Promise<SystemMetrics> {
    const response = await apiClient.get<SystemMetrics>('/api/overview');
    return response.data;
  },

  /**
   * Get all services with their current status
   */
  async getAllServices(): Promise<ServiceOverview[]> {
    const response = await apiClient.get<ServiceOverview[]>('/api/services');
    return response.data;
  },

  /**
   * Get service details by ID
   */
  async getServiceById(id: string): Promise<Service> {
    const response = await apiClient.get<Service>(`/api/services/${id}`);
    return response.data;
  },

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: string) {
    const response = await apiClient.get(`/api/services/${serviceId}/stats`);
    return response.data;
  },

  /**
   * Create a new service
   */
  async createService(service: Partial<Service>): Promise<Service> {
    const response = await apiClient.post<Service>('/api/services', service);
    return response.data;
  },

  /**
   * Update an existing service
   */
  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const response = await apiClient.put<Service>(`/api/services/${id}`, service);
    return response.data;
  },

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    await apiClient.delete(`/api/services/${id}`);
  },

  /**
   * Enable/disable a service
   */
  async toggleService(id: string, enabled: boolean): Promise<Service> {
    const response = await apiClient.patch<Service>(`/api/services/${id}`, { enabled });
    return response.data;
  },
};
