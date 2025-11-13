import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { sloApi } from '../services/sloApi';
import type { SLO, SLOStatus } from '../types';

export const useSLOStore = defineStore('slo', () => {
  // State
  const slos = ref<SLO[]>([]);
  const sloStatuses = ref<SLOStatus[]>([]);
  const currentSLO = ref<SLO | null>(null);
  const currentStatus = ref<SLOStatus | null>(null);
  const statusHistory = ref<SLOStatus[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const enabledSLOs = computed(() => slos.value.filter(slo => slo.enabled));

  const compliantSLOs = computed(() =>
    sloStatuses.value.filter(status => status.compliance)
  );

  const violatingSLOs = computed(() =>
    sloStatuses.value.filter(status => !status.compliance)
  );

  const criticalRiskSLOs = computed(() =>
    sloStatuses.value.filter(status => status.violationRisk === 'critical')
  );

  const highRiskSLOs = computed(() =>
    sloStatuses.value.filter(status => status.violationRisk === 'high')
  );

  const complianceRate = computed(() => {
    if (sloStatuses.value.length === 0) return 100;
    return (compliantSLOs.value.length / sloStatuses.value.length) * 100;
  });

  // Actions
  async function fetchAllSLOs() {
    loading.value = true;
    error.value = null;
    try {
      slos.value = await sloApi.getAllSLOs();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch SLOs';
      console.error('Error fetching SLOs:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchSLOById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentSLO.value = await sloApi.getSLOById(id);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch SLO';
      console.error('Error fetching SLO:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchSLOsByService(serviceId: string) {
    loading.value = true;
    error.value = null;
    try {
      const serviceSLOs = await sloApi.getSLOsByService(serviceId);
      return serviceSLOs;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch service SLOs';
      console.error('Error fetching service SLOs:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllStatuses() {
    loading.value = true;
    error.value = null;
    try {
      sloStatuses.value = await sloApi.getAllStatuses();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch SLO statuses';
      console.error('Error fetching SLO statuses:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatus(sloId: string) {
    loading.value = true;
    error.value = null;
    try {
      currentStatus.value = await sloApi.getStatus(sloId);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch SLO status';
      console.error('Error fetching SLO status:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatusHistory(sloId: string, limit = 100) {
    loading.value = true;
    error.value = null;
    try {
      statusHistory.value = await sloApi.getStatusHistory(sloId, limit);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch SLO history';
      console.error('Error fetching SLO history:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createSLO(slo: Partial<SLO>) {
    loading.value = true;
    error.value = null;
    try {
      const newSLO = await sloApi.createSLO(slo);
      await fetchAllSLOs(); // Refresh list
      return newSLO;
    } catch (err: any) {
      error.value = err.message || 'Failed to create SLO';
      console.error('Error creating SLO:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSLO(id: string, slo: Partial<SLO>) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await sloApi.updateSLO(id, slo);
      await fetchAllSLOs(); // Refresh list
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to update SLO';
      console.error('Error updating SLO:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSLO(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await sloApi.deleteSLO(id);
      await fetchAllSLOs(); // Refresh list
    } catch (err: any) {
      error.value = err.message || 'Failed to delete SLO';
      console.error('Error deleting SLO:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleSLO(id: string, enabled: boolean) {
    try {
      await sloApi.toggleSLO(id, enabled);
      await fetchAllSLOs(); // Refresh list
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle SLO';
      console.error('Error toggling SLO:', err);
      throw err;
    }
  }

  return {
    // State
    slos,
    sloStatuses,
    currentSLO,
    currentStatus,
    statusHistory,
    loading,
    error,
    // Computed
    enabledSLOs,
    compliantSLOs,
    violatingSLOs,
    criticalRiskSLOs,
    highRiskSLOs,
    complianceRate,
    // Actions
    fetchAllSLOs,
    fetchSLOById,
    fetchSLOsByService,
    fetchAllStatuses,
    fetchStatus,
    fetchStatusHistory,
    createSLO,
    updateSLO,
    deleteSLO,
    toggleSLO,
  };
});
