<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Package,
  ShoppingCart,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Eye,
} from 'lucide-vue-next'
import { useInventoryStore } from '@/stores/inventory'
import { useShoppingListStore } from '@/stores/shoppingList'
import { formatCurrency, formatFullDate } from '@/utils/formatters'
import type { InventoryItem } from '@/types/inventory'
import InventoryItemModal from '@/components/inventory/InventoryItemModal.vue'
import RestockModal from '@/components/inventory/RestockModal.vue'
import ItemDetailModal from '@/components/inventory/ItemDetailModal.vue'

const router = useRouter()
const inventoryStore = useInventoryStore()
const shoppingStore = useShoppingListStore()

// Modals
const isCreateItemModalOpen = ref(false)
const isRestockModalOpen = ref(false)
const selectedItemForRestock = ref<InventoryItem | null>(null)
const isDetailModalOpen = ref(false)
const selectedItemForDetail = ref<InventoryItem | null>(null)

const openDetailModal = (item: InventoryItem) => {
  selectedItemForDetail.value = item
  isDetailModalOpen.value = true
}

const openEditModal = (item: InventoryItem) => {
  router.push('/inventory')
}

onMounted(async () => {
  if (inventoryStore.items.length === 0) {
    await inventoryStore.refreshAll()
  }
})

const handleAddToShoppingList = (item: InventoryItem) => {
  shoppingStore.addFromInventory(item, item.min_quantity && item.min_quantity > item.quantity ? Math.ceil(item.min_quantity - item.quantity) : 1)
}

const handleOpenRestock = (item: InventoryItem) => {
  selectedItemForRestock.value = item
  isRestockModalOpen.value = true
}

const handleRestocked = async () => {
  await inventoryStore.fetchItems()
}
</script>

<template>
  <div class="space-y-6 pb-20 lg:pb-8">
    <!-- Welcome / Highlights Banner -->
    <div class="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
      <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Painel Inteligente de Mercado</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Controle de Estoque & Compras
          </h1>
          <p class="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
            Monitore seu consumo médio mensal, antecipe reposições e mantenha sua despensa sempre abastecida sem desperdício.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="router.push('/shopping')"
            class="px-4 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer shrink-0"
          >
            <ShoppingCart class="w-4 h-4 text-emerald-600 stroke-[2.4]" />
            <span>Ir ao Mercado</span>
            <span
              v-if="shoppingStore.pendingCount > 0"
              class="ml-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]"
            >
              {{ shoppingStore.pendingCount }}
            </span>
          </button>

          <button
            type="button"
            @click="isCreateItemModalOpen = true"
            class="px-4 py-3 rounded-2xl bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Novo Item</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Metrics Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Gasto Médio Mensal com Estoque -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Gasto Médio Mensal</span>
          <div class="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign class="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 tracking-tight">
            {{ formatCurrency(inventoryStore.estimatedMonthlySpend) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
            <span>Estimativa baseada no ciclo de consumo dos itens</span>
          </p>
        </div>
      </div>

      <!-- 2. Valor Total do Estoque Atual -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Valor em Estoque</span>
          <div class="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Package class="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 tracking-tight">
            {{ formatCurrency(inventoryStore.stockStats.estimatedValue) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1 font-medium">
            {{ inventoryStore.stockStats.total }} itens cadastrados na despensa
          </p>
        </div>
      </div>

      <!-- 3. Itens com Estoque Baixo / Esgotados -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-200 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Atenção / Reposição</span>
          <div class="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-extrabold text-amber-600 tracking-tight">
              {{ inventoryStore.stockStats.lowStock + inventoryStore.stockStats.outOfStock }}
            </span>
            <span class="text-xs font-bold text-slate-400">itens precisando compra</span>
          </div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
            <span class="text-rose-600 font-bold">{{ inventoryStore.stockStats.outOfStock }} esgotados</span>
            <span>•</span>
            <span class="text-amber-600 font-bold">{{ inventoryStore.stockStats.lowStock }} em baixa</span>
          </div>
        </div>
      </div>

      <!-- 4. Saúde do Estoque -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Saúde do Estoque</span>
          <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck class="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-2xl font-extrabold text-slate-900 tracking-tight">
              {{ inventoryStore.stockStats.healthyPercent }}%
            </span>
            <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {{ inventoryStore.stockStats.normal }} normais
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              class="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${inventoryStore.stockStats.healthyPercent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Próximos 5 Itens a Serem Comprados -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900">Próximos 5 Itens a Comprar</h2>
            <span class="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-extrabold rounded-full">
              Prioridade
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium">
            Itens calculados com base no nível de estoque atual e tempo de duração estimado
          </p>
        </div>

        <button
          type="button"
          @click="router.push('/inventory')"
          class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver todo o estoque</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Items Grid or Empty -->
      <div v-if="inventoryStore.nextItemsToBuy.length === 0" class="py-10 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800">Seu estoque está em dia!</h3>
          <p class="text-xs text-slate-400 mt-0.5">Nenhum item em estado crítico ou prestes a esgotar no momento.</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div
          v-for="{ item, reason, daysRemaining } in inventoryStore.nextItemsToBuy"
          :key="item.id"
          class="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between space-y-3 group"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-md"
                :style="{
                  backgroundColor: `${item.category?.color_hex || '#10b981'}15`,
                  color: item.category?.color_hex || '#10b981',
                }"
              >
                {{ item.category?.name || 'Geral' }}
              </span>

              <span
                :class="[
                  'px-2 py-0.5 text-[10px] font-bold rounded-full',
                  item.quantity <= 0
                    ? 'bg-rose-100 text-rose-700'
                    : item.min_quantity && item.quantity <= item.min_quantity
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-700'
                ]"
              >
                {{ reason }}
              </span>
            </div>

            <h3
              @click="openDetailModal(item)"
              class="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition truncate cursor-pointer"
              title="Clique para ver detalhes e histórico"
            >
              {{ item.name }}
            </h3>
            <p v-if="item.brand" class="text-[11px] text-slate-400 font-medium truncate">
              {{ item.brand }}
            </p>
            <button
              type="button"
              @click="openDetailModal(item)"
              class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md transition cursor-pointer mt-1"
            >
              <Eye class="w-3 h-3" />
              <span>Ver Detalhes</span>
            </button>

            <div class="mt-3 flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Estoque</span>
                <span class="font-bold text-slate-800">{{ item.quantity }} {{ item.unit }}</span>
                <span v-if="item.min_quantity" class="text-[10px] text-slate-400 ml-1">
                  (mín. {{ item.min_quantity }})
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Preço Ref.</span>
                <span class="font-bold text-slate-800">
                  {{ formatCurrency(item.last_price || item.average_price) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions: Add to Cart or Restock -->
          <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              @click="handleAddToShoppingList(item)"
              :class="[
                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer',
                shoppingStore.isItemInList(item.id)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              ]"
            >
              <ShoppingCart class="w-3.5 h-3.5" />
              <span>{{ shoppingStore.isItemInList(item.id) ? 'Na Lista ✓' : 'Adicionar à Lista' }}</span>
            </button>

            <button
              type="button"
              @click="handleOpenRestock(item)"
              title="Registrar Reposição Imediata"
              class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Distribuição por Categorias & Visão Geral -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Categorias do Estoque -->
      <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Categorias no Estoque</h2>
            <p class="text-xs text-slate-500 font-medium">Distribuição de itens e valor por departamento</p>
          </div>
        </div>

        <div v-if="inventoryStore.categoryStats.length === 0" class="py-8 text-center text-slate-400 text-xs">
          Nenhuma categoria com produtos cadastrados.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="cat in inventoryStore.categoryStats"
            :key="cat.name"
            class="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="w-3.5 h-3.5 rounded-full shrink-0 ring-4"
                :style="{ backgroundColor: cat.color, boxShadow: `0 0 0 4px ${cat.color}20` }"
              ></span>
              <div class="truncate">
                <span class="font-bold text-slate-800 text-xs block truncate">{{ cat.name }}</span>
                <span class="text-[11px] text-slate-400 font-medium">
                  {{ cat.count }} {{ cat.count === 1 ? 'produto' : 'produtos' }}
                </span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="font-bold text-slate-900 text-xs block">{{ formatCurrency(cat.value) }}</span>
              <span class="text-[10px] text-slate-400">valor acumulado</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo Rápido da Lista de Mercado Atual -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Próxima Compra</span>
            <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <ShoppingCart class="w-4 h-4" />
            </div>
          </div>

          <h3 class="text-xl font-bold">Lista de Mercado</h3>
          <p class="text-xs text-slate-300 font-medium">
            {{ shoppingStore.totalItemsCount === 0
              ? 'Sua lista está vazia no momento.'
              : `${shoppingStore.pendingCount} itens pendentes para compra e ${shoppingStore.checkedCount} no carrinho.`
            }}
          </p>

          <div class="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Total Estimado:</span>
              <span class="font-bold text-white">{{ formatCurrency(shoppingStore.estimatedTotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Já no Carrinho:</span>
              <span class="font-bold text-emerald-400">{{ formatCurrency(shoppingStore.checkedTotal) }}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="router.push('/shopping')"
          class="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <span>Abrir Lista de Compras</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Modals -->
    <InventoryItemModal
      :is-open="isCreateItemModalOpen"
      :categories="inventoryStore.categories"
      @close="isCreateItemModalOpen = false"
      @saved="inventoryStore.fetchItems()"
    />

    <RestockModal
      :is-open="isRestockModalOpen"
      :item="selectedItemForRestock"
      @close="isRestockModalOpen = false"
      @restocked="handleRestocked"
    />

    <ItemDetailModal
      :is-open="isDetailModalOpen"
      :item="selectedItemForDetail"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
      @restock="handleOpenRestock"
      @add-to-list="handleAddToShoppingList"
    />
  </div>
</template>
