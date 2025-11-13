import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('../views/ServicesView.vue'),
    meta: { title: 'Services' },
  },
  {
    path: '/services/:id',
    name: 'ServiceDetail',
    component: () => import('../views/ServiceDetailView.vue'),
    meta: { title: 'Service Details' },
  },
  {
    path: '/incidents',
    name: 'Incidents',
    component: () => import('../views/IncidentsView.vue'),
    meta: { title: 'Incidents' },
  },
  {
    path: '/incidents/:id',
    name: 'IncidentDetail',
    component: () => import('../views/IncidentDetailView.vue'),
    meta: { title: 'Incident Details' },
  },
  {
    path: '/slos',
    name: 'SLOs',
    component: () => import('../views/SLOsView.vue'),
    meta: { title: 'SLOs' },
  },
  {
    path: '/slos/:id',
    name: 'SLODetail',
    component: () => import('../views/SLODetailView.vue'),
    meta: { title: 'SLO Details' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Update document title on route change
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string;
  document.title = title ? `${title} - NOC Dashboard` : 'NOC Dashboard';
  next();
});

export default router;
