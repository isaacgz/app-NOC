<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="sloStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- SLO Details -->
    <div v-else-if="sloStore.currentSLO && sloStore.currentStatus">
      <!-- Back Button -->
      <button
        @click="router.back()"
        class="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon class="h-5 w-5 mr-2" />
        Back
      </button>

      <!-- Header -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-900">{{ sloStore.currentSLO.name }}</h1>
          <StatusBadge :status="sloStore.currentStatus.violationRisk" />
        </div>
        <p class="text-gray-600">{{ sloStore.currentSLO.description }}</p>
      </div>

      <!-- Current Status -->
      <SLOCard :status="sloStore.currentStatus" />

      <!-- Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-600">Target</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ sloStore.currentSLO.target }}%</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-600">Window</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatWindow(sloStore.currentSLO.window) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-600">SLI Type</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatSLIType(sloStore.currentSLO.sliType) }}</dd>
          </div>
          <div v-if="sloStore.currentSLO.threshold">
            <dt class="text-sm font-medium text-gray-600">Threshold</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ sloStore.currentSLO.threshold }}</dd>
          </div>
        </dl>
      </div>

      <!-- History Chart Placeholder -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Status History</h2>
        <p class="text-gray-500 text-center py-8">Historical data visualization would be displayed here</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">SLO not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSLOStore } from '../stores/sloStore';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import StatusBadge from '../components/StatusBadge.vue';
import SLOCard from '../components/SLOCard.vue';

const route = useRoute();
const router = useRouter();
const sloStore = useSLOStore();

onMounted(async () => {
  const sloId = route.params.id as string;
  await Promise.all([
    sloStore.fetchSLOById(sloId),
    sloStore.fetchStatus(sloId),
  ]);
});

function formatWindow(window: string): string {
  const labels: Record<string, string> = {
    '1h': '1 Hour',
    '24h': '24 Hours',
    '7d': '7 Days',
    '30d': '30 Days',
    '90d': '90 Days',
  };
  return labels[window] || window;
}

function formatSLIType(type: string): string {
  const labels: Record<string, string> = {
    availability: 'Availability',
    latency: 'Latency',
    errorRate: 'Error Rate',
  };
  return labels[type] || type;
}
</script>
