<script setup lang="ts">
import { LayoutGrid, Package, ShoppingCart, Settings, LogOut, Store } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShoppingListStore } from '@/stores/shoppingList'

const route = useRoute()
const authStore = useAuthStore()
const shoppingStore = useShoppingListStore()

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid, count: null },
  { name: 'Estoque', path: '/inventory', icon: Package, count: null },
  { name: 'Lista de Compras', path: '/shopping', icon: ShoppingCart, count: 'shopping' },
  { name: 'Configurações', path: '/settings', icon: Settings, count: null },
]

const handleLogout = async () => {
  await authStore.logout()
  window.location.reload()
}
</script>

<template>
  <aside
    class="hidden lg:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen px-4 py-6 shrink-0 select-none shadow-xs sticky top-0 h-screen"
  >
    <!-- Logo Brand -->
    <div class="flex items-center gap-3 px-3 mb-8">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
        <Store class="w-5 h-5 stroke-[2.2]" />
      </div>
      <div>
        <h1 class="text-base font-extrabold text-slate-900 tracking-tight leading-none">Market PWA</h1>
        <span class="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Estoque & Mercado</span>
      </div>
    </div>

    <!-- Workspace Info Card -->
    <div
      v-if="authStore.workspaces.length > 0"
      class="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"
    >
      <div class="min-w-0 pr-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Ativo</span>
        <p class="text-xs font-bold text-slate-800 truncate">
          {{ authStore.workspaces.find(w => String(w.id) === authStore.activeWorkspaceId)?.name || 'Residencial' }}
        </p>
      </div>
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0"></span>
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 space-y-1.5">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150',
          route.path === item.path
            ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        ]"
      >
        <div class="flex items-center gap-3">
          <component
            :is="item.icon"
            class="w-5 h-5 transition-colors"
            :class="route.path === item.path ? 'text-emerald-600 stroke-[2.4]' : 'text-slate-400 stroke-[2]'"
          />
          <span>{{ item.name }}</span>
        </div>

        <span
          v-if="item.count === 'shopping' && shoppingStore.pendingCount > 0"
          class="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-full"
        >
          {{ shoppingStore.pendingCount }}
        </span>
      </RouterLink>
    </nav>

    <!-- Bottom User Profile & Logout -->
    <div class="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
      <div class="min-w-0 flex-1 pr-2">
        <p class="text-xs font-bold text-slate-800 truncate">{{ authStore.user?.name || 'Usuário' }}</p>
        <p class="text-[11px] text-slate-400 truncate">{{ authStore.user?.email || 'market@local' }}</p>
      </div>
      <button
        type="button"
        @click="handleLogout"
        title="Sair da conta"
        class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>
