<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-3xl font-semibold text-gray-900 mt-2">{{ value }}</p>
        <p v-if="change" class="text-sm mt-2" :class="changeClass">
          {{ change }}
        </p>
      </div>
      <div v-if="icon" class="flex-shrink-0">
        <div class="p-3 rounded-full" :class="iconBgClass">
          <component :is="icon" class="h-6 w-6" :class="iconClass" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: any;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

const props = withDefaults(defineProps<Props>(), {
  changeType: 'neutral',
  color: 'blue',
});

const changeClass = computed(() => {
  if (props.changeType === 'positive') return 'text-green-600';
  if (props.changeType === 'negative') return 'text-red-600';
  return 'text-gray-600';
});

const iconBgClass = computed(() => {
  const colors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    gray: 'bg-gray-100',
  };
  return colors[props.color];
});

const iconClass = computed(() => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
  };
  return colors[props.color];
});
</script>
