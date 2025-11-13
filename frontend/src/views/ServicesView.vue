<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Services</h1>
        <p class="mt-2 text-gray-600">Monitor all your services in real-time</p>
      </div>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="showAddModal = true"
      >
        + Add Service
      </button>
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
          <span class="ml-2 px-2 py-0.5 rounded-full text-xs" :class="activeFilter === filter.key ? 'bg-primary-700' : 'bg-gray-200'">
            {{ filter.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="serviceStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Services Grid -->
    <div v-else-if="filteredServices.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ServiceCard
        v-for="service in filteredServices"
        :key="service.id"
        :service="service"
        @click="router.push(`/services/${service.id}`)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <ServerIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No services found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by adding a new service.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useServiceStore } from '../stores/serviceStore';
import { ServerIcon } from '@heroicons/vue/24/outline';
import ServiceCard from '../components/ServiceCard.vue';

const router = useRouter();
const serviceStore = useServiceStore();

const activeFilter = ref('all');
const showAddModal = ref(false);

const filters = computed(() => [
  { key: 'all', label: 'All Services', count: serviceStore.services.length },
  { key: 'up', label: 'Up', count: serviceStore.servicesUp.length },
  { key: 'down', label: 'Down', count: serviceStore.servicesDown.length },
  { key: 'degraded', label: 'Degraded', count: serviceStore.servicesDegraded.length },
  { key: 'critical', label: 'Critical', count: serviceStore.criticalServices.length },
]);

const filteredServices = computed(() => {
  switch (activeFilter.value) {
    case 'up':
      return serviceStore.servicesUp;
    case 'down':
      return serviceStore.servicesDown;
    case 'degraded':
      return serviceStore.servicesDegraded;
    case 'critical':
      return serviceStore.criticalServices;
    default:
      return serviceStore.services;
  }
});

onMounted(async () => {
  await serviceStore.fetchServices();
});
</script>
