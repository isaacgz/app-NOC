<template>
  <div class="bg-white rounded-lg shadow p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ status.sloName }}</h3>
      <StatusBadge :status="status.violationRisk" />
    </div>

    <!-- Service Name -->
    <p class="text-sm text-gray-600 mb-4">{{ status.serviceName }}</p>

    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="flex justify-between text-sm mb-1">
        <span class="text-gray-600">Current: {{ status.currentValue.toFixed(2) }}%</span>
        <span class="text-gray-600">Target: {{ status.target.toFixed(2) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all"
          :class="progressClass"
          :style="{ width: `${Math.min(100, (status.currentValue / status.target) * 100)}%` }"
        ></div>
      </div>
    </div>

    <!-- Compliance Status -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-gray-600">Compliance</span>
      <span class="text-sm font-medium" :class="status.compliance ? 'text-green-600' : 'text-red-600'">
        {{ status.compliance ? 'In Compliance' : 'Violated' }}
      </span>
    </div>

    <!-- Error Budget -->
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Error Budget Used</span>
        <span class="font-medium" :class="errorBudgetClass">
          {{ status.errorBudgetUsed.toFixed(1) }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all"
          :class="errorBudgetBarClass"
          :style="{ width: `${Math.min(100, status.errorBudgetUsed)}%` }"
        ></div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
      <div>
        <p class="text-xs text-gray-600">Burn Rate</p>
        <p class="text-lg font-semibold text-gray-900">{{ status.burnRate.toFixed(2) }}x</p>
      </div>
      <div>
        <p class="text-xs text-gray-600">Error Budget</p>
        <p class="text-lg font-semibold text-gray-900">
          {{ status.errorBudget.toFixed(0) }}m
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 text-xs text-gray-500">
      Window: {{ formatWindow(status.window) }} | Type: {{ formatSLIType(status.sliType) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';
import type { SLOStatus } from '../types';

interface Props {
  status: SLOStatus;
}

const props = defineProps<Props>();

const progressClass = computed(() => {
  if (props.status.compliance) return 'bg-green-500';
  return 'bg-red-500';
});

const errorBudgetClass = computed(() => {
  const used = props.status.errorBudgetUsed;
  if (used > 90) return 'text-red-600';
  if (used > 75) return 'text-orange-600';
  if (used > 50) return 'text-yellow-600';
  return 'text-green-600';
});

const errorBudgetBarClass = computed(() => {
  const used = props.status.errorBudgetUsed;
  if (used > 90) return 'bg-red-500';
  if (used > 75) return 'bg-orange-500';
  if (used > 50) return 'bg-yellow-500';
  return 'bg-green-500';
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
