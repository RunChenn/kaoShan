import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/HikeLayout.vue'),
    children: [
      { path: '/', component: () => import('src/pages/IndexPage.vue') },
      { path: 'pre-departure', name: 'pre-departure', component: () => import('src/pages/PreDeparturePage.vue') },
      { path: 'active',        name: 'active',        component: () => import('src/pages/ActiveHikePage.vue') },
      { path: 'summary',       name: 'summary',       component: () => import('src/pages/PostHikePage.vue') },
      { path: 'line',          name: 'line',          component: () => import('src/pages/LinePage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorNotFound.vue'),
  },
]

export default routes
