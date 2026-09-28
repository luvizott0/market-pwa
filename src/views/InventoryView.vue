<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  Package,
  Plus,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Minus,
  Layers,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Eye,
} from 'lucide-vue-next'
import { useInventoryStore } from '@/stores/inventory'
import { useShoppingListStore } from '@/stores/shoppingList'
import { formatCurrency, formatDate, formatRelativeDays } from '@/utils/formatters'
import type { InventoryItem, StockCategory } from '@/types/inventory'
import InventoryItemModal from '@/components/inventory/InventoryItemModal.vue'
import RestockModal from '@/components/inventory/RestockModal.vue'
import ItemDetailModal from '@/components/inventory/ItemDetailModal.vue'

const inventoryStore = useInventoryStore()
const shoppingStore = useShoppingListStore()

const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedStatus = ref<'all' | 'in_stock' | 'low_stock' | 'expiring_soon' | 'expired'>('all')
const sortBy = ref<string>('name_asc')

// Modals
const isItemModalOpen = ref(false)
const selectedItemForEdit = ref<InventoryItem | null>(null)
const isRestockModalOpen = ref(false)
const selectedItemForRestock = ref<InventoryItem | null>(null)
const isDetailModalOpen = ref(false)
const selectedItemForDetail = ref<InventoryItem | null>(null)

const openDetailModal = (item: InventoryItem) => {
  selectedItemForDetail.value = item
  isDetailModalOpen.value = true
}

// Delete confirmation modal state
const itemToDelete = ref<InventoryItem | null>(null)
const isDeleting = ref(false)

const loadItems = () => {
  const params: Record<string, any> = {
    sort_by: sortBy.value,
  }

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }

  if (selectedCategoryId.value !== null) {
    params.category_id = selectedCategoryId.value
  }

  if (selectedStatus.value !== 'all') {
    params.status = selectedStatus.value
  }

  inventoryStore.fetchItems(params)
}

// Search debounce
let debounceTimer: any = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadItems()
  }, 350)
})

watch([selectedCategoryId, selectedStatus, sortBy], () => {
  loadItems()
})

onMounted(async () => {
  await inventoryStore.refreshAll()
})

const openCreateModal = () => {
  selectedItemForEdit.value = null
  isItemModalOpen.value = true
}

const openEditModal = (item: InventoryItem) => {
  selectedItemForEdit.value = item
  isItemModalOpen.value = true
}

const openRestockModal = (item: InventoryItem) => {
  selectedItemForRestock.value = item
  isRestockModalOpen.value = true
}

// Quick consume 1 unit
const handleConsume = async (item: InventoryItem) => {
  if (item.quantity <= 0) return
  await inventoryStore.consumeItem(item.id, 1)
}

// Confirm Delete
const confirmDelete = (item: InventoryItem) => {
  itemToDelete.value = item
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await inventoryStore.deleteItem(itemToDelete.value.id)
    itemToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

// Add to shopping list
const handleAddToList = (item: InventoryItem) => {
  shoppingStore.addFromInventory(
    item,
    item.min_quantity && item.min_quantity > item.quantity ? Math.ceil(item.min_quantity - item.quantity) : 1
  )
}
</script>

<template>
  <div class="space-y-6 pb-20 lg:pb-8">
    <!-- Top Action Bar: Search, Filters, Add Button -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar produto, marca ou nota..."
          class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs transition"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <!-- Sort Select -->
        <div class="relative shrink-0">
          <select
            v-model="sortBy"
            class="appearance-none pl-3 pr-8 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer"
          >
            <option value="name_asc">Nome (A-Z)</option>
            <option value="name_desc">Nome (Z-A)</option>
            <option value="price_desc">Maior Preço</option>
            <option value="expiration_date">Validade Próxima</option>
            <option value="recent">Mais Recentes</option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <!-- Add Item Button -->
        <button
          type="button"
          @click="openCreateModal"
          class="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>
    </div>

    <!-- Category Pills Filter -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
      <button
        type="button"
        @click="selectedCategoryId = null"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer',
          selectedCategoryId === null
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
        ]"
      >
        Todas as Categorias
      </button>

      <button
        v-for="cat in inventoryStore.categories"
        :key="cat.id"
        type="button"
        @click="selectedCategoryId = cat.id"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer',
          selectedCategoryId === cat.id
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <span
          class="w-2 h-2 rounded-full"
          :style="{ backgroundColor: cat.color_hex || '#10b981' }"
        ></span>
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <!-- Status Tabs Filter (Todos, Em Estoque, Estoque Baixo, Vencendo, Vencidos) -->
    <div class="flex items-center gap-2 border-b border-slate-200/80 pb-3 text-xs font-bold text-slate-500 overflow-x-auto select-none">
      <button
        type="button"
        @click="selectedStatus = 'all'"
        :class="[
          'px-3 py-1 rounded-xl transition cursor-pointer shrink-0',
          selectedStatus === 'all'
            ? 'bg-slate-900 text-white'
            : 'hover:text-slate-900 hover:bg-slate-100'
        ]"
      >
        Todos ({{ inventoryStore.items.length }})
      </button>

      <button
        type="button"
        @click="selectedStatus = 'low_stock'"
        :class="[
          'px-3 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1',
          selectedStatus === 'low_stock'
            ? 'bg-amber-600 text-white'
            : 'hover:text-amber-700 hover:bg-amber-50 text-amber-600'
        ]"
      >
        <AlertTriangle class="w-3.5 h-3.5" />
        <span>Estoque Baixo ({{ inventoryStore.stockStats.lowStock + inventoryStore.stockStats.outOfStock }})</span>
      </button>

      <button
        type="button"
        @click="selectedStatus = 'in_stock'"
        :class="[
          'px-3 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1',
          selectedStatus === 'in_stock'
            ? 'bg-emerald-600 text-white'
            : 'hover:text-emerald-700 hover:bg-emerald-50 text-emerald-600'
        ]"
      >
        <CheckCircle2 class="w-3.5 h-3.5" />
        <span>Em Estoque ({{ inventoryStore.stockStats.normal }})</span>
      </button>

      <button
        type="button"
        @click="selectedStatus = 'expiring_soon'"
        :class="[
          'px-3 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1',
          selectedStatus === 'expiring_soon'
            ? 'bg-indigo-600 text-white'
            : 'hover:text-indigo-700 hover:bg-indigo-50 text-indigo-600'
        ]"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>Vencendo em Breve</span>
      </button>
    </div>

    <!-- Items Grid -->
    <div v-if="inventoryStore.isLoading" class="py-16 text-center text-slate-400 text-xs">
      <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
      <span>Carregando itens de estoque...</span>
    </div>

    <div v-else-if="inventoryStore.items.length === 0" class="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80">
      <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Package class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-slate-800">Nenhum produto encontrado</h3>
        <p class="text-xs text-slate-400 mt-0.5">Cadastre itens para gerenciar a despensa e sua lista de compras.</p>
      </div>
      <button
        type="button"
        @click="openCreateModal"
        class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-sm"
      >
        Cadastrar Primeiro Item
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="item in inventoryStore.items"
        :key="item.id"
        class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between space-y-4 group"
      >
        <!-- Card Header: Category & Status Badge -->
        <div>
          <div class="flex items-start justify-between gap-2 mb-2.5">
            <span
              class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg"
              :style="{
                backgroundColor: `${item.category?.color_hex || '#10b981'}15`,
                color: item.category?.color_hex || '#10b981',
              }"
            >
              {{ item.category?.name || 'Geral' }}
            </span>

            <!-- Status Badge -->
            <span
              :class="[
                'px-2.5 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1',
                item.quantity <= 0
                  ? 'bg-rose-100 text-rose-700'
                  : item.min_quantity && item.quantity <= item.min_quantity
                  ? 'bg-amber-100 text-amber-700'
                  : item.status === 'expired'
                  ? 'bg-rose-100 text-rose-700'
                  : item.status === 'expiring_soon'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              ]"
            >
              <span v-if="item.quantity <= 0">Esgotado</span>
              <span v-else-if="item.min_quantity && item.quantity <= item.min_quantity">Estoque Baixo</span>
              <span v-else-if="item.status === 'expired'">Vencido</span>
              <span v-else-if="item.status === 'expiring_soon'">Vencendo</span>
              <span v-else>Em Estoque</span>
            </span>
          </div>

          <!-- Title & Brand -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3
                @click="openDetailModal(item)"
                class="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition truncate cursor-pointer"
                title="Clique para ver detalhes e histórico de compras"
              >
                {{ item.name }}
              </h3>
              <p v-if="item.brand" class="text-xs text-slate-400 font-medium truncate">
                {{ item.brand }}
              </p>
              <button
                type="button"
                @click="openDetailModal(item)"
                class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-2 py-0.5 rounded-lg transition cursor-pointer mt-1"
              >
                <Eye class="w-3 h-3" />
                <span>Ver Detalhes & Histórico</span>
              </button>
            </div>

            <!-- Edit & Delete buttons -->
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              <button
                type="button"
                @click="openEditModal(item)"
                title="Editar Item"
                class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="confirmDelete(item)"
                title="Excluir Item"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Quantity Highlight Bar -->
          <div class="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Quantidade</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-xl font-extrabold text-slate-900">{{ item.quantity }}</span>
                <span class="text-xs font-bold text-slate-500">{{ item.unit }}</span>
                <span v-if="item.min_quantity" class="text-[11px] text-slate-400 font-medium">
                  / mín. {{ item.min_quantity }}
                </span>
              </div>
            </div>

            <!-- Fast -1 consume button -->
            <button
              type="button"
              @click="handleConsume(item)"
              :disabled="item.quantity <= 0"
              title="Consumir 1 unidade"
              class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <Minus class="w-3.5 h-3.5" />
              <span>1 {{ item.unit }}</span>
            </button>
          </div>

          <!-- Details & Cycles -->
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 rounded-xl bg-slate-50/50 border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Preço Ref.</span>
              <span class="font-bold text-slate-800">
                {{ formatCurrency(item.last_price || item.average_price) }}
              </span>
            </div>

            <div class="p-2 rounded-xl bg-slate-50/50 border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Ciclo Médio</span>
              <span class="font-bold text-slate-800">
                {{ item.duration_days ? `~${item.duration_days} dias` : 'Indefinido' }}
              </span>
            </div>
          </div>

          <!-- Expiration Date Warning if any -->
          <div
            v-if="item.expiration_date"
            class="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
          >
            <div class="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Validade: {{ formatDate(item.expiration_date) }}</span>
            </div>
            <span
              v-if="item.days_until_expiration !== null && item.days_until_expiration !== undefined"
              :class="[
                'font-bold text-[10px]',
                item.days_until_expiration < 0
                  ? 'text-rose-600'
                  : item.days_until_expiration <= 7
                  ? 'text-amber-600'
                  : 'text-slate-500'
              ]"
            >
              {{ formatRelativeDays(item.days_until_expiration).text }}
            </span>
          </div>
        </div>

        <!-- Card Footer Actions: Add to Shopping List & Repor -->
        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            @click="handleAddToList(item)"
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
            @click="openRestockModal(item)"
            title="Registrar Compra / Repor Estoque"
            class="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 text-emerald-600" />
            <span>Repor</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="itemToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 class="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">Excluir Produto?</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Tem certeza de que deseja excluir <span class="font-bold text-slate-800">"{{ itemToDelete.name }}"</span>? O histórico de compras do item também será apagado.
          </p>
        </div>
        <div class="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            @click="itemToDelete = null"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {{ isDeleting ? 'Excluindo...' : 'Sim, Excluir' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <InventoryItemModal
      :is-open="isItemModalOpen"
      :item="selectedItemForEdit"
      :categories="inventoryStore.categories"
      @close="isItemModalOpen = false"
      @saved="inventoryStore.fetchItems()"
    />

    <RestockModal
      :is-open="isRestockModalOpen"
      :item="selectedItemForRestock"
      @close="isRestockModalOpen = false"
      @restocked="inventoryStore.fetchItems()"
    />

    <ItemDetailModal
      :is-open="isDetailModalOpen"
      :item="selectedItemForDetail"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
      @restock="openRestockModal"
      @add-to-list="handleAddToList"
    />
  </div>
</template>
