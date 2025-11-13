import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { incidentApi } from '../services/incidentApi';
import type { Incident, IncidentStatistics } from '../types';

export const useIncidentStore = defineStore('incident', () => {
  // State
  const incidents = ref<Incident[]>([]);
  const activeIncidents = ref<Incident[]>([]);
  const currentIncident = ref<Incident | null>(null);
  const statistics = ref<IncidentStatistics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const criticalIncidents = computed(() =>
    activeIncidents.value.filter(i => i.severity === 'critical')
  );

  const highIncidents = computed(() =>
    activeIncidents.value.filter(i => i.severity === 'high')
  );

  const recentIncidents = computed(() =>
    [...incidents.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  );

  // Actions
  async function fetchAllIncidents() {
    loading.value = true;
    error.value = null;
    try {
      incidents.value = await incidentApi.getAllIncidents();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch incidents';
      console.error('Error fetching incidents:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchActiveIncidents() {
    loading.value = true;
    error.value = null;
    try {
      activeIncidents.value = await incidentApi.getActiveIncidents();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch active incidents';
      console.error('Error fetching active incidents:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncidentById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentIncident.value = await incidentApi.getIncidentById(id);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch incident';
      console.error('Error fetching incident:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncidentsByService(serviceId: string) {
    loading.value = true;
    error.value = null;
    try {
      const serviceIncidents = await incidentApi.getIncidentsByService(serviceId);
      return serviceIncidents;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch service incidents';
      console.error('Error fetching service incidents:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics() {
    loading.value = true;
    error.value = null;
    try {
      statistics.value = await incidentApi.getStatistics();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch statistics';
      console.error('Error fetching statistics:', err);
    } finally {
      loading.value = false;
    }
  }

  async function updateIncidentStatus(id: string, status: string, note?: string) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await incidentApi.updateIncidentStatus(id, status, note);
      await fetchActiveIncidents(); // Refresh active incidents
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to update incident status';
      console.error('Error updating incident status:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addNote(id: string, note: string) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await incidentApi.addNote(id, note);
      if (currentIncident.value?.id === id) {
        currentIncident.value = updated;
      }
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to add note';
      console.error('Error adding note:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resolveIncident(id: string, resolution: string) {
    loading.value = true;
    error.value = null;
    try {
      const resolved = await incidentApi.resolveIncident(id, resolution);
      await fetchActiveIncidents(); // Refresh active incidents
      return resolved;
    } catch (err: any) {
      error.value = err.message || 'Failed to resolve incident';
      console.error('Error resolving incident:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function closeIncident(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const closed = await incidentApi.closeIncident(id);
      await fetchActiveIncidents(); // Refresh active incidents
      return closed;
    } catch (err: any) {
      error.value = err.message || 'Failed to close incident';
      console.error('Error closing incident:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    incidents,
    activeIncidents,
    currentIncident,
    statistics,
    loading,
    error,
    // Computed
    criticalIncidents,
    highIncidents,
    recentIncidents,
    // Actions
    fetchAllIncidents,
    fetchActiveIncidents,
    fetchIncidentById,
    fetchIncidentsByService,
    fetchStatistics,
    updateIncidentStatus,
    addNote,
    resolveIncident,
    closeIncident,
  };
});
