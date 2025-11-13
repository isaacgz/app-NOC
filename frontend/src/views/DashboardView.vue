<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-gray-600">Network Operations Center - Real-time monitoring</p>
    </div>

    <!-- Loading State -->
    <div v-if="serviceStore.loading || incidentStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Services"
          :value="serviceStore.metrics?.totalServices || 0"
          :icon="ServerIcon"
          color="blue"
        />
        <StatCard
          title="Services Up"
          :value="serviceStore.metrics?.servicesUp || 0"
          :icon="CheckCircleIcon"
          color="green"
        />
        <StatCard
          title="Services Down"
          :value="serviceStore.metrics?.servicesDown || 0"
          :icon="XCircleIcon"
          color="red"
        />
        <StatCard
          title="Active Incidents"
          :value="incidentStore.activeIncidents.length"
          :icon="ExclamationTriangleIcon"
          :color="incidentStore.activeIncidents.length > 0 ? 'red' : 'green'"
        />
      </div>

      <!-- Secondary Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Critical Incidents"
          :value="incidentStore.criticalIncidents.length"
          :icon="FireIcon"
          color="red"
        />
        <StatCard
          title="Average Uptime"
          :value="`${(serviceStore.metrics?.averageUptime || 0).toFixed(2)}%`"
          :icon="ChartBarIcon"
          color="green"
        />
        <StatCard
          title="SLO Compliance"
          :value="`${sloStore.complianceRate.toFixed(1)}%`"
          :icon="TrophyIcon"
          :color="sloStore.complianceRate >= 95 ? 'green' : 'yellow'"
        />
        <StatCard
          title="MTTR"
          :value="`${incidentStore.statistics?.mttr?.toFixed(0) || 0}m`"
          :icon="ClockIcon"
          color="blue"
        />
      </div>

      <!-- Critical Alerts -->
      <div v-if="incidentStore.criticalIncidents.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center space-x-2 mb-4">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
          <h2 class="text-lg font-semibold text-red-900">Critical Incidents</h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="incident in incidentStore.criticalIncidents"
            :key="incident.id"
            class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            @click="router.push(`/incidents/${incident.id}`)"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-gray-900">{{ incident.serviceName }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ incident.description }}</p>
              </div>
              <StatusBadge :status="incident.status" />
            </div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Incidents -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Recent Incidents</h2>
            <router-link
              to="/incidents"
              class="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              View All →
            </router-link>
          </div>
          <div class="p-6">
            <div v-if="incidentStore.recentIncidents.length === 0" class="text-center py-8 text-gray-500">
              No recent incidents
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="incident in incidentStore.recentIncidents.slice(0, 5)"
                :key="incident.id"
                class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
                @click="router.push(`/incidents/${incident.id}`)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ incident.serviceName }}</span>
                  <StatusBadge :status="incident.severity" />
                </div>
                <p class="text-sm text-gray-600">{{ incident.description }}</p>
                <div class="mt-2 flex items-center justify-between">
                  <StatusBadge :status="incident.status" />
                  <span class="text-xs text-gray-500">
                    {{ formatRelativeTime(incident.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SLO Violations -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">SLO Status</h2>
            <router-link
              to="/slos"
              class="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              View All →
            </router-link>
          </div>
          <div class="p-6">
            <div v-if="sloStore.sloStatuses.length === 0" class="text-center py-8 text-gray-500">
              No SLOs configured
            </div>
            <div v-else class="space-y-4">
              <!-- At Risk SLOs -->
              <div v-if="sloStore.criticalRiskSLOs.length > 0">
                <h3 class="text-sm font-semibold text-red-600 mb-2">Critical Risk</h3>
                <div class="space-y-2">
                  <div
                    v-for="status in sloStore.criticalRiskSLOs.slice(0, 3)"
                    :key="status.sloId"
                    class="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-900">{{ status.sloName }}</span>
                      <span class="text-xs text-red-600 font-semibold">
                        {{ status.errorBudgetUsed.toFixed(1) }}% used
                      </span>
                    </div>
                    <div class="text-xs text-gray-600">{{ status.serviceName }}</div>
                  </div>
                </div>
              </div>

              <!-- Compliant SLOs Summary -->
              <div class="pt-4 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Compliant SLOs</span>
                  <span class="text-sm font-semibold text-green-600">
                    {{ sloStore.compliantSLOs.length }} / {{ sloStore.sloStatuses.length }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Services Grid -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Services</h2>
          <router-link
            to="/services"
            class="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View All →
          </router-link>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            v-for="service in serviceStore.services.slice(0, 6)"
            :key="service.id"
            :service="service"
            @click="router.push(`/services/${service.id}`)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useServiceStore } from '../stores/serviceStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useSLOStore } from '../stores/sloStore';
import {
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import StatCard from '../components/StatCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import ServiceCard from '../components/ServiceCard.vue';

const router = useRouter();
const serviceStore = useServiceStore();
const incidentStore = useIncidentStore();
const sloStore = useSLOStore();

onMounted(async () => {
  await Promise.all([
    serviceStore.fetchOverview(),
    serviceStore.fetchServices(),
    incidentStore.fetchActiveIncidents(),
    incidentStore.fetchStatistics(),
    sloStore.fetchAllStatuses(),
  ]);
});

function formatRelativeTime(timestamp: string): string {
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
