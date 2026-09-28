import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import InventoryView from '../views/InventoryView.vue'
import ShoppingListView from '../views/ShoppingListView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/inventory',
      alias: ['/estoque'],
      name: 'inventory',
      component: InventoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/shopping',
      alias: ['/compras', '/mercado'],
      name: 'shopping',
      component: ShoppingListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/invite/:token',
      name: 'invite',
      component: () => import('../views/InviteView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('market_auth_token') || localStorage.getItem('flux_auth_token')
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)

  if (requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && token) {
    const redirect = (to.query.redirect as string) || '/'
    next(redirect)
  } else {
    next()
  }
})

export default router
