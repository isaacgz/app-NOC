<template>
  <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" @click="handleClick">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <StatusBadge :status="service.status" />
          <h3 class="text-lg font-semibold text-gray-900">{{ service.name }}</h3>
        </div>
        <span v-if="service.critical" class="text-red-600 text-xs font-semibold">CRITICAL</span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-600">Uptime</p>
          <p class="text-2xl font-semibold text-gray-900">{{ service.uptime.toFixed(2) }}%</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Response Time</p>
          <p class="text-2xl font-semibold text-gray-900">{{ service.responseTime }}ms</p>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="service.tags && service.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="tag in service.tags"
          :key="tag"
          class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Active Incident -->
      <div
        v-if="service.activeIncident"
        class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-600" />
            <span class="text-sm font-medium text-red-800">Active Incident</span>
          </div>
          <StatusBadge :status="service.activeIncident.severity" />
        </div>
      </div>

      <!-- Last Check -->
      <div class="mt-4 text-xs text-gray-500">
        Last checked: {{ formatTimestamp(service.lastCheck) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import StatusBadge from './StatusBadge.vue';
import type { ServiceOverview } from '../types';

interface Props {
  service: ServiceOverview;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [service: ServiceOverview];
}>();

function handleClick() {
  emit('click', props.service);
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
</script>
