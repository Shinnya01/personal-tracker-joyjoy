import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { hasSupabaseConfig } from '../lib/supabase';

export const routeNames = {
  login: 'login',
  dashboard: 'dashboard',
  recentActivity: 'recent-activity',
  trackers: 'trackers',
  trackerNew: 'tracker-new',
  trackerDetail: 'tracker-detail',
  trackerEdit: 'tracker-edit',
  reminders: 'reminders',
  settings: 'settings',
} as const;

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: routeNames.login,
    component: () => import('../pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    children: [
      {
        path: '',
        name: routeNames.dashboard,
        component: () => import('../pages/DashboardPage.vue'),
      },
      {
        path: 'trackers',
        name: routeNames.trackers,
        component: () => import('../pages/TrackersPage.vue'),
      },
      {
        path: 'activity',
        name: routeNames.recentActivity,
        component: () => import('../pages/RecentActivityPage.vue'),
      },
      {
        path: 'trackers/new',
        name: routeNames.trackerNew,
        component: () => import('../pages/TrackerFormPage.vue'),
      },
      {
        path: 'trackers/:id',
        name: routeNames.trackerDetail,
        component: () => import('../pages/TrackerDetailPage.vue'),
      },
      {
        path: 'trackers/:id/edit',
        name: routeNames.trackerEdit,
        component: () => import('../pages/TrackerFormPage.vue'),
      },
      {
        path: 'reminders',
        name: routeNames.reminders,
        component: () => import('../pages/RemindersPage.vue'),
      },
      {
        path: 'settings',
        name: routeNames.settings,
        component: () => import('../pages/SettingsPage.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (!hasSupabaseConfig) return true;
  const authStore = useAuthStore();
  await authStore.init();
  if (to.meta.public) {
    if (authStore.isLoggedIn) return { name: routeNames.dashboard };
    return true;
  }
  if (!authStore.isLoggedIn) {
    return { name: routeNames.login };
  }
  return true;
});

export default router;
