<script setup lang="ts">
import { LayoutGrid, Package, ShoppingCart } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { useShoppingListStore } from '@/stores/shoppingList'

const route = useRoute()
const shoppingStore = useShoppingListStore()

const mobileTabs = [
  { name: 'Início', path: '/', icon: LayoutGrid, count: null },
  { name: 'Estoque', path: '/inventory', icon: Package, count: null },
  { name: 'Mercado', path: '/shopping', icon: ShoppingCart, count: 'shopping' },
]
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2 pb-safe flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)] select-none"
  >
    <RouterLink
      v-for="tab in mobileTabs"
      :key="tab.name"
      :to="tab.path"
      :title="tab.name"
      :aria-label="tab.name"
      :class="[
        'relative flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200',
        route.path === tab.path
          ? 'text-emerald-600 font-bold'
          : 'text-slate-400 hover:text-slate-600 font-medium'
      ]"
    >
      <div class="relative">
        <component
          :is="tab.icon"
          class="w-6 h-6 transition-transform duration-200"
          :class="route.path === tab.path ? 'scale-110 stroke-[2.4]' : 'stroke-[2]'"
        />
        <!-- Shopping list pending badge -->
        <span
          v-if="tab.count === 'shopping' && shoppingStore.pendingCount > 0"
          class="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs"
        >
          {{ shoppingStore.pendingCount }}
        </span>
      </div>
      <span class="text-[11px] mt-1 tracking-tight">{{ tab.name }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
}
</style>
