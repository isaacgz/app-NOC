import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serviceApi } from '../services/serviceApi';
import type { Service, ServiceOverview, SystemMetrics } from '../types';

export const useServiceStore = defineStore('service', () => {
  // State
  const services = ref<ServiceOverview[]>([]);
  const currentService = ref<Service | null>(null);
  const metrics = ref<SystemMetrics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const servicesUp = computed(() => services.value.filter(s => s.status === 'up'));
  const servicesDown = computed(() => services.value.filter(s => s.status === 'down'));
  const servicesDegraded = computed(() => services.value.filter(s => s.status === 'degraded'));
  const criticalServices = computed(() => services.value.filter(s => s.critical));

  // Actions
  async function fetchOverview() {
    loading.value = true;
    error.value = null;
    try {
      metrics.value = await serviceApi.getOverview();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch overview';
      console.error('Error fetching overview:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchServices() {
    loading.value = true;
    error.value = null;
    try {
      services.value = await serviceApi.getAllServices();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch services';
      console.error('Error fetching services:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchServiceById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentService.value = await serviceApi.getServiceById(id);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch service';
      console.error('Error fetching service:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createService(service: Partial<Service>) {
    loading.value = true;
    error.value = null;
    try {
      const newService = await serviceApi.createService(service);
      await fetchServices(); // Refresh list
      return newService;
    } catch (err: any) {
      error.value = err.message || 'Failed to create service';
      console.error('Error creating service:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateService(id: string, service: Partial<Service>) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await serviceApi.updateService(id, service);
      await fetchServices(); // Refresh list
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to update service';
      console.error('Error updating service:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteService(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await serviceApi.deleteService(id);
      await fetchServices(); // Refresh list
    } catch (err: any) {
      error.value = err.message || 'Failed to delete service';
      console.error('Error deleting service:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleService(id: string, enabled: boolean) {
    try {
      await serviceApi.toggleService(id, enabled);
      await fetchServices(); // Refresh list
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle service';
      console.error('Error toggling service:', err);
      throw err;
    }
  }

  return {
    // State
    services,
    currentService,
    metrics,
    loading,
    error,
    // Computed
    servicesUp,
    servicesDown,
    servicesDegraded,
    criticalServices,
    // Actions
    fetchOverview,
    fetchServices,
    fetchServiceById,
    createService,
    updateService,
    deleteService,
    toggleService,
  };
});
