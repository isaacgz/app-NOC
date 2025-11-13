import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);

// Install Pinia for state management
app.use(createPinia());

// Install Vue Router
app.use(router);

// Mount the app
app.mount('#app');

// Auto-refresh data every 30 seconds
import { useServiceStore } from './stores/serviceStore';
import { useIncidentStore } from './stores/incidentStore';
import { useSLOStore } from './stores/sloStore';

setInterval(async () => {
  const serviceStore = useServiceStore();
  const incidentStore = useIncidentStore();
  const sloStore = useSLOStore();

  try {
    await Promise.all([
      serviceStore.fetchOverview(),
      serviceStore.fetchServices(),
      incidentStore.fetchActiveIncidents(),
      sloStore.fetchAllStatuses(),
    ]);
  } catch (error) {
    console.error('Auto-refresh failed:', error);
  }
}, 30000); // 30 seconds
