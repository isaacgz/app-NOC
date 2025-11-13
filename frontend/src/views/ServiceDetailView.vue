<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="serviceStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Service Details -->
    <div v-else-if="serviceStore.currentService">
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
          <h1 class="text-3xl font-bold text-gray-900">{{ serviceStore.currentService.name }}</h1>
          <StatusBadge :status="currentStatus" />
        </div>
        <p class="text-gray-600">{{ serviceStore.currentService.description }}</p>
        <div class="mt-4 text-sm text-gray-500">
          <span class="font-medium">URL:</span> {{ serviceStore.currentService.url }}
        </div>
      </div>

      <!-- Service configuration details would go here -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-600">Interval</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ serviceStore.currentService.interval }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-600">Critical</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ serviceStore.currentService.critical ? 'Yes' : 'No' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-600">Enabled</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ serviceStore.currentService.enabled ? 'Yes' : 'No' }}</dd>
          </div>
          <div v-if="serviceStore.currentService.tags && serviceStore.currentService.tags.length > 0">
            <dt class="text-sm font-medium text-gray-600">Tags</dt>
            <dd class="mt-1 flex flex-wrap gap-2">
              <span
                v-for="tag in serviceStore.currentService.tags"
                :key="tag"
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {{ tag }}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Service not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServiceStore } from '../stores/serviceStore';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import StatusBadge from '../components/StatusBadge.vue';
import type { ServiceStatus } from '../types';

const route = useRoute();
const router = useRouter();
const serviceStore = useServiceStore();

const currentStatus = computed<ServiceStatus>(() => {
  const status = serviceStore.currentService?.lastStatus;
  if (status === 'up' || status === 'down' || status === 'degraded' || status === 'unknown') {
    return status;
  }
  return 'unknown';
});

onMounted(async () => {
  const serviceId = route.params.id as string;
  await serviceStore.fetchServiceById(serviceId);
});
</script>
