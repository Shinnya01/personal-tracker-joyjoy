import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

export const routeNames = {
  dashboard: 'dashboard',
  trackers: 'trackers',
  trackerNew: 'tracker-new',
  trackerDetail: 'tracker-detail',
  trackerEdit: 'tracker-edit',
  reminders: 'reminders',
  settings: 'settings',
} as const;

const routes: RouteRecordRaw[] = [
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

export default router;
