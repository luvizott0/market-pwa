<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, LogOut, Trash2, CheckCircle2, Shield, Layers, HardDrive } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useInventoryStore } from '@/stores/inventory'

const router = useRouter()
const authStore = useAuthStore()
const shoppingStore = useShoppingListStore()
const inventoryStore = useInventoryStore()

const successMessage = ref<string | null>(null)

const handleWorkspaceChange = async (workspaceId: number) => {
  authStore.setActiveWorkspace(workspaceId)
  successMessage.value = 'Workspace ativo alterado com sucesso.'
  await inventoryStore.refreshAll()
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

const handleClearShoppingCache = () => {
  shoppingStore.clearAll()
  successMessage.value = 'Lista de compras local limpa com sucesso.'
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-8">
    <!-- Success Alert -->
    <div
      v-if="successMessage"
      class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- User Profile Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
          {{ authStore.user?.name?.charAt(0) || 'U' }}
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900">{{ authStore.user?.name || 'Usuário' }}</h2>
          <p class="text-xs text-slate-500 font-medium">{{ authStore.user?.email || 'email@exemplo.com' }}</p>
        </div>
      </div>
    </div>

    <!-- Workspace Selection -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div>
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers class="w-4 h-4 text-emerald-600" />
          <span>Workspace Residencial</span>
        </h3>
        <p class="text-xs text-slate-500 font-medium mt-0.5">
          Selecione a residência ou workspace cujos itens de estoque você está gerenciando
        </p>
      </div>

      <div class="space-y-2">
        <div
          v-for="ws in authStore.workspaces"
          :key="ws.id"
          @click="handleWorkspaceChange(ws.id)"
          :class="[
            'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between text-xs font-semibold',
            String(ws.id) === authStore.activeWorkspaceId
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
          ]"
        >
          <span>{{ ws.name }}</span>
          <span
            v-if="String(ws.id) === authStore.activeWorkspaceId"
            class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold"
          >
            Ativo
          </span>
        </div>
      </div>
    </div>

    <!-- Local Data & Cache Management -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div>
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HardDrive class="w-4 h-4 text-slate-600" />
          <span>Dados Locais & Lista de Mercado</span>
        </h3>
        <p class="text-xs text-slate-500 font-medium mt-0.5">
          Itens da lista de compras salvos localmente no dispositivo para funcionamento offline
        </p>
      </div>

      <div class="flex items-center justify-between pt-2">
        <span class="text-xs text-slate-600 font-medium">
          {{ shoppingStore.totalItemsCount }} itens na lista de compras local
        </span>
        <button
          type="button"
          @click="handleClearShoppingCache"
          class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Limpar Lista</span>
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="pt-2">
      <button
        type="button"
        @click="handleLogout"
        class="w-full py-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <LogOut class="w-4 h-4" />
        <span>Sair da Conta</span>
      </button>
    </div>
  </div>
</template>
