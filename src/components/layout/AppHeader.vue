<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Settings, RefreshCw, Store } from 'lucide-vue-next'
import { useInventoryStore } from '@/stores/inventory'
import { useAuthStore } from '@/stores/auth'
import SpaceSwitcher from '@/components/layout/SpaceSwitcher.vue'

const route = useRoute()
const router = useRouter()
const inventoryStore = useInventoryStore()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  switch (route.name) {
    case 'dashboard':
      return 'Visão Geral'
    case 'inventory':
      return 'Controle de Estoque'
    case 'shopping':
      return 'Lista de Compras'
    case 'settings':
      return 'Configurações'
    default:
      return 'Market PWA'
  }
})

const handleRefresh = async () => {
  await inventoryStore.refreshAll()
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 pt-safe-header pb-3 sm:px-6 flex items-center justify-between">
    <!-- Mobile brand icon & Title -->
    <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
      <div class="lg:hidden w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
        <Store class="w-4 h-4" />
      </div>
      <div class="min-w-0">
        <h2 class="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight leading-tight truncate">
          {{ pageTitle }}
        </h2>
      </div>
    </div>

    <!-- Right Actions with SpaceSwitcher -->
    <div class="flex items-center gap-2 shrink-0">
      <SpaceSwitcher />

      <button
        type="button"
        @click="handleRefresh"
        :disabled="inventoryStore.isRefreshing"
        title="Atualizar dados"
        class="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': inventoryStore.isRefreshing }" />
      </button>

      <button
        type="button"
        @click="router.push('/settings')"
        title="Configurações"
        class="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
