<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="incidentStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Incident Details -->
    <div v-else-if="incidentStore.currentIncident">
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
          <h1 class="text-2xl font-bold text-gray-900">Incident #{{ incidentStore.currentIncident.id.slice(0, 8) }}</h1>
          <div class="flex items-center space-x-3">
            <StatusBadge :status="incidentStore.currentIncident.severity" />
            <StatusBadge :status="incidentStore.currentIncident.status" />
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <span class="text-sm font-medium text-gray-600">Service:</span>
            <span class="ml-2 text-sm text-gray-900">{{ incidentStore.currentIncident.serviceName }}</span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-600">Description:</span>
            <p class="mt-1 text-sm text-gray-900">{{ incidentStore.currentIncident.description }}</p>
          </div>
          <div v-if="incidentStore.currentIncident.estimatedImpact">
            <span class="text-sm font-medium text-gray-600">Estimated Impact:</span>
            <p class="mt-1 text-sm text-gray-900">{{ incidentStore.currentIncident.estimatedImpact }}</p>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
        <div class="flow-root">
          <ul class="-mb-8">
            <li
              v-for="(event, idx) in incidentStore.currentIncident.timeline"
              :key="idx"
              class="relative pb-8"
            >
              <span
                v-if="idx < incidentStore.currentIncident.timeline.length - 1"
                class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                aria-hidden="true"
              />
              <div class="relative flex space-x-3">
                <div>
                  <span class="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                    <ClockIcon class="h-5 w-5 text-white" />
                  </span>
                </div>
                <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p class="text-sm text-gray-900">{{ event.description }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ event.type }}</p>
                  </div>
                  <div class="whitespace-nowrap text-right text-sm text-gray-500">
                    {{ formatTimestamp(event.timestamp) }}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Affected Checks"
          :value="incidentStore.currentIncident.affectedChecks"
          :icon="ExclamationTriangleIcon"
          color="yellow"
        />
        <StatCard
          v-if="incidentStore.currentIncident.resolutionTimeMinutes"
          title="Resolution Time"
          :value="`${incidentStore.currentIncident.resolutionTimeMinutes}m`"
          :icon="ClockIcon"
          color="blue"
        />
        <StatCard
          title="Created"
          :value="formatTimestamp(incidentStore.currentIncident.createdAt)"
          :icon="CalendarIcon"
          color="gray"
        />
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Incident not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useIncidentStore } from '../stores/incidentStore';
import {
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline';
import StatusBadge from '../components/StatusBadge.vue';
import StatCard from '../components/StatCard.vue';

const route = useRoute();
const router = useRouter();
const incidentStore = useIncidentStore();

onMounted(async () => {
  const incidentId = route.params.id as string;
  await incidentStore.fetchIncidentById(incidentId);
});

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
</script>
