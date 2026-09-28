<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Tag,
  DollarSign,
  Package,
  Pencil,
  ArrowRight,
} from 'lucide-vue-next'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useInventoryStore } from '@/stores/inventory'
import { formatCurrency } from '@/utils/formatters'
import type { InventoryItem } from '@/types/inventory'
import type { ShoppingItem } from '@/types/market'
import FinishShoppingModal from '@/components/market/FinishShoppingModal.vue'
import QuickAddCustomModal from '@/components/market/QuickAddCustomModal.vue'

const shoppingStore = useShoppingListStore()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const isCustomModalOpen = ref(false)
const isFinishModalOpen = ref(false)
const finishResult = ref<any | null>(null)

// Price editing modal state
const selectedItemForPrice = ref<ShoppingItem | null>(null)
const isPriceModalOpen = ref(false)
const modalPriceInput = ref<number | null>(null)

onMounted(async () => {
  if (inventoryStore.items.length === 0) {
    await inventoryStore.fetchItems()
  }
})

// Search results for adding from inventory
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase().trim()
  return inventoryStore.items
    .filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query)
      const brandMatch = item.brand?.toLowerCase().includes(query)
      const catMatch = item.category?.name.toLowerCase().includes(query)
      return nameMatch || brandMatch || catMatch
    })
    .slice(0, 8)
})

// Suggested items: low stock or out of stock items not yet in shopping list
const suggestedItems = computed(() => {
  return inventoryStore.items
    .filter((item) => {
      const isUrgent =
        item.quantity <= 0 ||
        (item.min_quantity !== null && item.min_quantity !== undefined && item.quantity <= item.min_quantity) ||
        item.status === 'expiring_soon'
      const inList = shoppingStore.isItemInList(item.id)
      return isUrgent && !inList
    })
    .slice(0, 6)
})

const handleAddFromSearch = (item: InventoryItem) => {
  shoppingStore.addFromInventory(item, 1)
  searchQuery.value = ''
}

const handleAddCustomPrompt = () => {
  isCustomModalOpen.value = true
}

const openPriceModal = (item: ShoppingItem) => {
  selectedItemForPrice.value = item
  modalPriceInput.value = item.actual_price !== null && item.actual_price !== undefined ? item.actual_price : item.estimated_price
  isPriceModalOpen.value = true
}

const savePriceModal = () => {
  if (selectedItemForPrice.value) {
    const val = modalPriceInput.value !== null && modalPriceInput.value >= 0 ? Number(modalPriceInput.value) : 0
    shoppingStore.updateActualPrice(selectedItemForPrice.value.id, val)
  }
  isPriceModalOpen.value = false
  selectedItemForPrice.value = null
}

const resetPriceToEstimated = () => {
  if (selectedItemForPrice.value) {
    shoppingStore.updateActualPrice(selectedItemForPrice.value.id, null)
  }
  isPriceModalOpen.value = false
  selectedItemForPrice.value = null
}

const adjustPriceStep = (delta: number) => {
  if (modalPriceInput.value === null) {
    modalPriceInput.value = 0
  }
  const next = Math.max(0, Math.round((modalPriceInput.value + delta) * 100) / 100)
  modalPriceInput.value = next
}

const onShoppingFinished = (result: any) => {
  finishResult.value = result
  setTimeout(() => {
    finishResult.value = null
  }, 6000)
}
</script>

<template>
  <div class="space-y-6 pb-28 lg:pb-12">
    <!-- Success Banner upon finishing trip -->
    <div
      v-if="finishResult"
      class="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
          <CheckCircle2 class="w-6 h-6 stroke-[2.4]" />
        </div>
        <div>
          <h3 class="font-extrabold text-sm">Compras Finalizadas com Sucesso!</h3>
          <p class="text-xs text-emerald-100">
            {{ finishResult.restockedCount }} itens atualizados no estoque.
            <span v-if="finishResult.storeName">Comprado em: <strong>{{ finishResult.storeName }}</strong>. </span>
            Total: {{ formatCurrency(finishResult.totalSpent) }}
          </p>
        </div>
      </div>
      <button
        type="button"
        @click="finishResult = null"
        class="p-1 rounded-xl hover:bg-white/20 cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Top Supermarket Fast Search Bar -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Lista de Compras</span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {{ shoppingStore.pendingCount }} a comprar
            </span>
          </h1>
          <p class="text-xs text-slate-500 font-medium">
            Pesquise itens para colocar no carrinho ou adicione avulsos
          </p>
        </div>

        <button
          type="button"
          @click="handleAddCustomPrompt"
          class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Item Avulso</span>
        </button>
      </div>

      <!-- Search Input with Auto-complete -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Pesquisar produto no estoque para comprar..."
          class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 placeholder:text-slate-400 transition"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <!-- Dropdown search suggestions -->
        <div
          v-if="searchQuery && searchResults.length > 0"
          class="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-40 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-98 duration-100"
        >
          <div
            v-for="item in searchResults"
            :key="item.id"
            @click="handleAddFromSearch(item)"
            class="p-3 hover:bg-emerald-50/50 flex items-center justify-between cursor-pointer transition"
          >
            <div class="min-w-0 pr-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-slate-900 truncate">{{ item.name }}</span>
                <span v-if="item.brand" class="text-[11px] text-slate-400">({{ item.brand }})</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Estoque: {{ item.quantity }} {{ item.unit }}</span>
                <span>•</span>
                <span>Ref: {{ formatCurrency(item.last_price || item.average_price) }}</span>
              </div>
            </div>

            <button
              type="button"
              class="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        <div
          v-else-if="searchQuery && searchResults.length === 0"
          class="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-40 p-4 text-center space-y-2 animate-in fade-in"
        >
          <p class="text-xs text-slate-500">Nenhum produto cadastrado com "{{ searchQuery }}".</p>
          <button
            type="button"
            @click="handleAddCustomPrompt"
            class="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Adicionar "{{ searchQuery }}" como item avulso</span>
          </button>
        </div>
      </div>

      <!-- Suggested Items Row (Estoque Baixo ou Esgotado) -->
      <div v-if="suggestedItems.length > 0" class="pt-2 border-t border-slate-100">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Sugestões de Reposição (Estoque Crítico):
        </span>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div
            v-for="item in suggestedItems"
            :key="item.id"
            class="p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 flex items-center gap-2 shrink-0 transition"
          >
            <div class="text-[11px]">
              <span class="font-bold text-slate-800 block truncate max-w-[130px]">{{ item.name }}</span>
              <span class="text-[10px] text-amber-600 font-semibold">
                {{ item.quantity <= 0 ? 'Esgotado' : `Resta ${item.quantity} ${item.unit}` }}
              </span>
            </div>
            <button
              type="button"
              @click="shoppingStore.addFromInventory(item, 1)"
              title="Adicionar à Lista"
              class="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="shoppingStore.items.length === 0"
      class="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-6"
    >
      <div class="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <ShoppingCart class="w-8 h-8 stroke-[2.2]" />
      </div>
      <div class="max-w-sm mx-auto">
        <h2 class="text-base font-bold text-slate-900">Sua lista de mercado está vazia</h2>
        <p class="text-xs text-slate-400 mt-1">
          Use a busca acima ou clique nas sugestões para montar sua lista antes de ir às compras.
        </p>
      </div>
      <button
        type="button"
        @click="handleAddCustomPrompt"
        class="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 cursor-pointer"
      >
        Adicionar Primeiro Item
      </button>
    </div>

    <!-- Active List Content -->
    <div v-else class="space-y-6">
      <!-- Section 1: A Comprar (Pendentes) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span>A Comprar</span>
            <span class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[11px] font-bold">
              {{ shoppingStore.pendingItems.length }}
            </span>
          </h2>

          <span class="text-xs font-bold text-slate-500">
            Est. {{ formatCurrency(shoppingStore.estimatedTotal - shoppingStore.checkedTotal) }}
          </span>
        </div>

        <div v-if="shoppingStore.pendingItems.length === 0" class="p-6 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400 font-medium">
          Todos os itens da lista já foram colocados no carrinho! 🎉
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="item in shoppingStore.pendingItems"
            :key="item.id"
            class="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <!-- Checkbox & Item details -->
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <!-- Touch-friendly Checkbox -->
              <button
                type="button"
                @click="shoppingStore.toggleCheck(item.id)"
                title="Marcar como comprado"
                class="w-8 h-8 rounded-xl border-2 border-slate-300 hover:border-emerald-500 flex items-center justify-center transition cursor-pointer shrink-0 bg-slate-50"
              >
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 truncate">{{ item.name }}</h3>
                  <span
                    class="px-2 py-0.5 text-[9px] font-bold rounded-md shrink-0"
                    :style="{
                      backgroundColor: `${item.category_color || '#10b981'}15`,
                      color: item.category_color || '#10b981',
                    }"
                  >
                    {{ item.category_name || 'Geral' }}
                  </span>
                </div>

                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span v-if="item.brand" class="text-[11px] text-slate-400 font-medium">{{ item.brand }} •</span>

                  <!-- Interactive Price Paid Button -->
                  <button
                    type="button"
                    @click="openPriceModal(item)"
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border',
                      item.actual_price !== null && item.actual_price !== undefined
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    ]"
                    title="Toque para alterar o valor pago no mercado"
                  >
                    <DollarSign class="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{{ formatCurrency(item.actual_price ?? item.estimated_price) }} / {{ item.unit }}</span>
                    <span v-if="item.actual_price !== null && item.actual_price !== undefined" class="text-[9px] font-semibold text-emerald-600">(pago)</span>
                    <Pencil class="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Quantity Controls & Subtotal -->
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
              <!-- Inline Quantity Adjuster -->
              <div class="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  @click="shoppingStore.updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="w-7 h-7 rounded-lg bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>
                <span class="w-8 text-center text-xs font-extrabold text-slate-800">
                  {{ item.quantity }}
                </span>
                <button
                  type="button"
                  @click="shoppingStore.updateQuantity(item.id, item.quantity + 1)"
                  class="w-7 h-7 rounded-lg bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Subtotal -->
              <div class="text-right min-w-[75px]">
                <span class="text-xs font-extrabold text-slate-900 block">
                  {{ formatCurrency((item.actual_price ?? item.estimated_price) * item.quantity) }}
                </span>
                <span class="text-[10px] text-slate-400 block">subtotal</span>
              </div>

              <!-- Delete item from list -->
              <button
                type="button"
                @click="shoppingStore.removeItem(item.id)"
                title="Remover da lista"
                class="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: No Carrinho / Já Comprados (Marcados) -->
      <div v-if="shoppingStore.checkedItems.length > 0" class="space-y-3 pt-4 border-t border-slate-200/80">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>No Carrinho (Comprados)</span>
            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
              {{ shoppingStore.checkedItems.length }}
            </span>
          </h2>

          <button
            type="button"
            @click="shoppingStore.uncheckAll"
            class="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Desmarcar Todos
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="item in shoppingStore.checkedItems"
            :key="item.id"
            class="bg-emerald-50/40 rounded-2xl border border-emerald-200/60 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group"
          >
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <!-- Checked button -->
              <button
                type="button"
                @click="shoppingStore.toggleCheck(item.id)"
                title="Desmarcar"
                class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs"
              >
                <Check class="w-4 h-4 stroke-[3]" />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-600 line-through truncate">{{ item.name }}</h3>
                </div>
                <div class="flex items-center gap-2 text-[11px] text-emerald-700 mt-1 flex-wrap">
                  <span>{{ item.quantity }} {{ item.unit }} •</span>

                  <!-- Price Edit Button inside checked card as well -->
                  <button
                    type="button"
                    @click="openPriceModal(item)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
                    title="Editar valor pago"
                  >
                    <span>{{ formatCurrency(item.actual_price ?? item.estimated_price) }} un</span>
                    <Pencil class="w-2.5 h-2.5 ml-0.5 opacity-70" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Subtotal and remove -->
            <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span class="text-xs font-extrabold text-emerald-900 block">
                {{ formatCurrency((item.actual_price ?? item.estimated_price) * item.quantity) }}
              </span>

              <button
                type="button"
                @click="shoppingStore.removeItem(item.id)"
                class="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Supermarket Checkout Bar -->
    <div
      v-if="shoppingStore.items.length > 0"
      class="fixed bottom-16 lg:bottom-4 left-0 lg:left-64 right-0 z-30 px-4 sm:px-6 pointer-events-none"
    >
      <div class="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 pointer-events-auto select-none">
        <!-- Cart counter & total -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingBag class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-semibold">Total no Carrinho:</span>
              <span class="text-base sm:text-lg font-extrabold text-emerald-400">
                {{ formatCurrency(shoppingStore.checkedTotal) }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              {{ shoppingStore.checkedCount }} de {{ shoppingStore.totalItemsCount }} itens pegos
            </p>
          </div>
        </div>

        <!-- Checkout Action Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="isFinishModalOpen = true"
            :disabled="shoppingStore.checkedCount === 0"
            class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles class="w-4 h-4" />
            <span>Finalizar Compras</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Alterar Preço Pago no Mercado -->
    <div
      v-if="isPriceModalOpen && selectedItemForPrice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign class="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Preço Pago no Mercado</h3>
              <p class="text-[11px] text-slate-400 truncate max-w-[200px]">
                {{ selectedItemForPrice.name }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="isPriceModalOpen = false"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5 space-y-4 text-xs font-medium">
          <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
            <span class="text-slate-500">Preço de referência/anterior:</span>
            <span class="font-bold text-slate-800">{{ formatCurrency(selectedItemForPrice.estimated_price) }}</span>
          </div>

          <!-- Price Input -->
          <div class="space-y-1.5">
            <label class="text-slate-700 font-bold block">
              Valor unitário na gôndola (R$ / {{ selectedItemForPrice.unit }})
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">R$</span>
              <input
                v-model.number="modalPriceInput"
                type="number"
                step="0.01"
                min="0"
                autofocus
                placeholder="0,00"
                class="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-emerald-500/40 focus:outline-none focus:border-emerald-600 text-lg font-extrabold text-slate-900 transition bg-white"
                @keydown.enter="savePriceModal"
              />
            </div>
          </div>

          <!-- Quick Increment Buttons -->
          <div class="space-y-1">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Ajuste Rápido:</span>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                @click="adjustPriceStep(-1.00)"
                class="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                -1,00
              </button>
              <button
                type="button"
                @click="adjustPriceStep(-0.50)"
                class="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                -0,50
              </button>
              <button
                type="button"
                @click="adjustPriceStep(0.50)"
                class="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                +0,50
              </button>
              <button
                type="button"
                @click="adjustPriceStep(1.00)"
                class="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                +1,00
              </button>
            </div>
          </div>

          <!-- Subtotal preview -->
          <div class="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <span class="text-emerald-800">Subtotal ({{ selectedItemForPrice.quantity }} un):</span>
            <span class="font-extrabold text-emerald-900 text-sm">
              {{ formatCurrency((modalPriceInput ?? selectedItemForPrice.estimated_price) * selectedItemForPrice.quantity) }}
            </span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
          <button
            type="button"
            @click="resetPriceToEstimated"
            class="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            Redefinir
          </button>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="isPriceModalOpen = false"
              class="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="savePriceModal"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              Salvar Preço
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <QuickAddCustomModal
      :is-open="isCustomModalOpen"
      @close="isCustomModalOpen = false"
    />

    <FinishShoppingModal
      :is-open="isFinishModalOpen"
      @close="isFinishModalOpen = false"
      @finished="onShoppingFinished"
    />
  </div>
</template>
