<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and primary navigation -->
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <router-link to="/" class="text-2xl font-bold text-primary-600">
                NOC Dashboard
              </router-link>
            </div>

            <!-- Primary Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.to"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  isCurrentRoute(item.to)
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                ]"
              >
                <component :is="item.icon" class="h-5 w-5 mr-2" />
                {{ item.name }}
              </router-link>
            </div>
          </div>

          <!-- Right side items -->
          <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <!-- Status indicator -->
            <div class="flex items-center space-x-2">
              <span
                class="h-2 w-2 rounded-full"
                :class="systemStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'"
              ></span>
              <span class="text-sm text-gray-600">System {{ systemStatus }}</span>
            </div>

            <!-- Refresh button -->
            <button
              @click="refreshData"
              class="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
              :class="{ 'animate-spin': isRefreshing }"
            >
              <ArrowPathIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Mobile menu button -->
          <div class="-mr-2 flex items-center sm:hidden">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon v-if="!mobileMenuOpen" class="block h-6 w-6" />
              <XMarkIcon v-else class="block h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              isCurrentRoute(item.to)
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
            ]"
            @click="mobileMenuOpen = false"
          >
            <div class="flex items-center">
              <component :is="item.icon" class="h-5 w-5 mr-2" />
              {{ item.name }}
            </div>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="mt-12 border-t border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-sm text-gray-500">
          &copy; {{ currentYear }} NOC Monitoring System. Built with Vue 3 + Prisma + PostgreSQL + InfluxDB.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useServiceStore } from './stores/serviceStore';
import { useIncidentStore } from './stores/incidentStore';
import { useSLOStore } from './stores/sloStore';
import {
  HomeIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();
const serviceStore = useServiceStore();
const incidentStore = useIncidentStore();
const sloStore = useSLOStore();

const mobileMenuOpen = ref(false);
const isRefreshing = ref(false);

const navigation = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Services', to: '/services', icon: ServerIcon },
  { name: 'Incidents', to: '/incidents', icon: ExclamationTriangleIcon },
  { name: 'SLOs', to: '/slos', icon: TrophyIcon },
];

const currentYear = computed(() => new Date().getFullYear());

const systemStatus = computed(() => {
  const metrics = serviceStore.metrics;
  if (!metrics) return 'unknown';
  if (metrics.servicesDown > 0 || metrics.criticalIncidents > 0) return 'degraded';
  return 'healthy';
});

function isCurrentRoute(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}

async function refreshData() {
  isRefreshing.value = true;
  try {
    await Promise.all([
      serviceStore.fetchOverview(),
      serviceStore.fetchServices(),
      incidentStore.fetchActiveIncidents(),
      incidentStore.fetchStatistics(),
      sloStore.fetchAllStatuses(),
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    setTimeout(() => {
      isRefreshing.value = false;
    }, 500);
  }
}
</script>
