<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Incidents</h1>
      <p class="mt-2 text-gray-600">Track and manage service incidents</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Incidents"
        :value="incidentStore.statistics?.total || 0"
        :icon="ExclamationTriangleIcon"
        color="blue"
      />
      <StatCard
        title="Active"
        :value="incidentStore.statistics?.active || 0"
        :icon="FireIcon"
        color="red"
      />
      <StatCard
        title="Resolved"
        :value="incidentStore.statistics?.resolved || 0"
        :icon="CheckCircleIcon"
        color="green"
      />
      <StatCard
        title="MTTR"
        :value="`${incidentStore.statistics?.mttr?.toFixed(0) || 0}m`"
        :icon="ClockIcon"
        color="gray"
      />
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-3">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeFilter === filter.key
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="incidentStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Incidents Table -->
    <div v-else>
      <IncidentTable
        :incidents="displayedIncidents"
        :title="activeFilter === 'active' ? 'Active Incidents' : 'All Incidents'"
        @select="router.push(`/incidents/${$event.id}`)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIncidentStore } from '../stores/incidentStore';
import {
  ExclamationTriangleIcon,
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import StatCard from '../components/StatCard.vue';
import IncidentTable from '../components/IncidentTable.vue';

const router = useRouter();
const incidentStore = useIncidentStore();

const activeFilter = ref('active');

const filters = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All Incidents' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'resolved', label: 'Resolved' },
];

const displayedIncidents = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return incidentStore.activeIncidents;
    case 'critical':
      return incidentStore.incidents.filter(i => i.severity === 'critical');
    case 'high':
      return incidentStore.incidents.filter(i => i.severity === 'high');
    case 'resolved':
      return incidentStore.incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
    default:
      return incidentStore.incidents;
  }
});

onMounted(async () => {
  await Promise.all([
    incidentStore.fetchAllIncidents(),
    incidentStore.fetchActiveIncidents(),
    incidentStore.fetchStatistics(),
  ]);
});
</script>
