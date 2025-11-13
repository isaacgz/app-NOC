<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Service Level Objectives</h1>
        <p class="mt-2 text-gray-600">Monitor SLO compliance and error budgets</p>
      </div>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="showAddModal = true"
      >
        + Add SLO
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total SLOs"
        :value="sloStore.sloStatuses.length"
        :icon="TrophyIcon"
        color="blue"
      />
      <StatCard
        title="Compliant"
        :value="sloStore.compliantSLOs.length"
        :icon="CheckCircleIcon"
        color="green"
      />
      <StatCard
        title="Violations"
        :value="sloStore.violatingSLOs.length"
        :icon="XCircleIcon"
        color="red"
      />
      <StatCard
        title="Compliance Rate"
        :value="`${sloStore.complianceRate.toFixed(1)}%`"
        :icon="ChartBarIcon"
        :color="sloStore.complianceRate >= 95 ? 'green' : 'yellow'"
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
    <div v-if="sloStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- SLO Cards Grid -->
    <div v-else-if="filteredStatuses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SLOCard
        v-for="status in filteredStatuses"
        :key="status.sloId"
        :status="status"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <TrophyIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No SLOs found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by adding a new SLO.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSLOStore } from '../stores/sloStore';
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline';
import StatCard from '../components/StatCard.vue';
import SLOCard from '../components/SLOCard.vue';

const sloStore = useSLOStore();

const activeFilter = ref('all');
const showAddModal = ref(false);

const filters = [
  { key: 'all', label: 'All SLOs' },
  { key: 'compliant', label: 'Compliant' },
  { key: 'violated', label: 'Violated' },
  { key: 'at-risk', label: 'At Risk' },
];

const filteredStatuses = computed(() => {
  switch (activeFilter.value) {
    case 'compliant':
      return sloStore.compliantSLOs;
    case 'violated':
      return sloStore.violatingSLOs;
    case 'at-risk':
      return sloStore.sloStatuses.filter(
        s => s.violationRisk === 'high' || s.violationRisk === 'critical'
      );
    default:
      return sloStore.sloStatuses;
  }
});

onMounted(async () => {
  await Promise.all([
    sloStore.fetchAllSLOs(),
    sloStore.fetchAllStatuses(),
  ]);
});
</script>
