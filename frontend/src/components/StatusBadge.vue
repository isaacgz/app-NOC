<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    <span v-if="showDot" class="mr-1.5 h-2 w-2 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ServiceStatus, IncidentSeverity, IncidentStatus, ViolationRisk } from '../types';

interface Props {
  status?: ServiceStatus | IncidentSeverity | IncidentStatus | ViolationRisk;
  label?: string;
  showDot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDot: true,
});

const badgeClass = computed(() => {
  const classes: Record<string, string> = {
    // Service status
    up: 'bg-green-100 text-green-800',
    down: 'bg-red-100 text-red-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    unknown: 'bg-gray-100 text-gray-800',

    // Incident severity
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',

    // Incident status
    new: 'bg-blue-100 text-blue-800',
    investigating: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',

    // Violation risk
    none: 'bg-green-100 text-green-800',
  };

  return classes[props.status || ''] || 'bg-gray-100 text-gray-800';
});

const dotClass = computed(() => {
  const classes: Record<string, string> = {
    // Service status
    up: 'bg-green-400',
    down: 'bg-red-400',
    degraded: 'bg-yellow-400',
    unknown: 'bg-gray-400',

    // Incident severity
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-blue-400',

    // Incident status
    new: 'bg-blue-400',
    investigating: 'bg-purple-400',
    in_progress: 'bg-yellow-400',
    resolved: 'bg-green-400',
    closed: 'bg-gray-400',

    // Violation risk
    none: 'bg-green-400',
  };

  return classes[props.status || ''] || 'bg-gray-400';
});

const label = computed(() => {
  if (props.label) return props.label;
  if (!props.status) return '';

  // Capitalize and format
  return props.status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
});
</script>
