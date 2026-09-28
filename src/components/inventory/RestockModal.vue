<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import {
  X,
  ShoppingCart,
  Calendar,
  DollarSign,
  AlertCircle,
  Package,
  Store,
  Plus,
  Check,
} from 'lucide-vue-next'
import { inventoryService } from '@/services/inventoryService'
import { useInventoryStore } from '@/stores/inventory'
import type { InventoryItem } from '@/types/inventory'

const props = defineProps<{
  isOpen: boolean
  item: InventoryItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restocked'): void
}>()

const inventoryStore = useInventoryStore()

const purchasedAt = ref<string>('')
const quantity = ref<number>(1)
const unitPrice = ref<number | null>(null)
const storeName = ref('')
const storeSearch = ref('')
const isStoreDropdownOpen = ref(false)
const notes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

function resetForm() {
  const today = new Date().toISOString().split('T')[0] ?? ''
  purchasedAt.value = today
  quantity.value = 1
  unitPrice.value =
    props.item?.last_price !== null && props.item?.last_price !== undefined
      ? Number(props.item.last_price)
      : null
  storeName.value = ''
  storeSearch.value = ''
  isStoreDropdownOpen.value = false
  notes.value = ''
  errorMessage.value = null
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
      inventoryStore.fetchStores()
    }
  }
)

const filteredStores = computed(() => {
  const query = storeSearch.value.trim().toLowerCase()
  if (!query) return inventoryStore.stores
  return inventoryStore.stores.filter((s) => s.toLowerCase().includes(query))
})

const isNewStore = computed(() => {
  const query = storeSearch.value.trim()
  if (!query) return false
  return !inventoryStore.stores.some((s) => s.toLowerCase() === query.toLowerCase())
})

const selectStore = (name: string) => {
  storeName.value = name
  storeSearch.value = name
  isStoreDropdownOpen.value = false
}

const createAndSelectStore = () => {
  const clean = storeSearch.value.trim()
  if (clean) {
    storeName.value = clean
    isStoreDropdownOpen.value = false
  }
}

const clearStoreSelection = () => {
  storeName.value = ''
  storeSearch.value = ''
}

const totalPrice = computed(() => {
  if (quantity.value && unitPrice.value !== null) {
    return Math.round(quantity.value * unitPrice.value * 100) / 100
  }
  return 0
})

const handleSubmit = async () => {
  if (!props.item) return

  if (!purchasedAt.value || !quantity.value || quantity.value <= 0 || unitPrice.value === null || unitPrice.value < 0) {
    errorMessage.value = 'Preencha a data, quantidade e preço unitário válido.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const finalStore = storeName.value.trim() || storeSearch.value.trim() || null

    await inventoryService.recordPurchase(props.item.id, {
      purchased_at: purchasedAt.value,
      quantity: Number(quantity.value),
      unit_price: Number(unitPrice.value),
      store_name: finalStore,
      notes: notes.value.trim() || null,
    })

    emit('restocked')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha ao registrar compra/reposição.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && item"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingCart class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Registrar Reposição</h3>
            <p class="text-xs text-slate-500 font-medium truncate max-w-[220px]">
              {{ item.name }} {{ item.brand ? `(${item.brand})` : '' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto space-y-4 text-xs font-medium">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Current Stock Info -->
        <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
          <span class="text-slate-500">Estoque atual:</span>
          <span class="font-bold text-slate-900">{{ item.quantity }} {{ item.unit }}</span>
        </div>

        <!-- Date & Quantity -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Data da Compra *</label>
            <input
              v-model="purchasedAt"
              type="date"
              required
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white transition"
            />
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Qtd Comprada ({{ item.unit }}) *</label>
            <input
              v-model.number="quantity"
              type="number"
              step="any"
              min="0.01"
              required
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>
        </div>

        <!-- Price & Total Preview -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Preço Unitário (R$) *</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">R$</span>
              <input
                v-model.number="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Total Pago</label>
            <div class="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold flex items-center">
              R$ {{ totalPrice.toFixed(2).replace('.', ',') }}
            </div>
          </div>
        </div>

        <!-- Estabelecimento (Search Select) -->
        <div class="space-y-1 relative">
          <label class="text-slate-700 font-semibold block flex items-center gap-1.5">
            <Store class="w-3.5 h-3.5 text-emerald-600" />
            <span>Onde foi comprado? (Estabelecimento)</span>
          </label>
          <div class="relative">
            <input
              v-model="storeSearch"
              type="text"
              placeholder="Ex: Atacadão, Carrefour, Droga Raia..."
              @focus="isStoreDropdownOpen = true"
              @input="isStoreDropdownOpen = true"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 bg-white transition pr-8"
            />
            <button
              v-if="storeSearch"
              type="button"
              @click="clearStoreSelection"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Dropdown -->
          <div
            v-if="isStoreDropdownOpen && (filteredStores.length > 0 || isNewStore)"
            class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100"
          >
            <button
              v-if="isNewStore"
              type="button"
              @click="createAndSelectStore"
              class="w-full px-3 py-2 text-left text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus class="w-3.5 h-3.5 text-emerald-600" />
              <span>Usar novo: "<strong>{{ storeSearch.trim() }}</strong>"</span>
            </button>
            <button
              v-for="s in filteredStores"
              :key="s"
              type="button"
              @click="selectStore(s)"
              class="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
            >
              <span>{{ s }}</span>
              <Check v-if="s === storeName" class="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Observação da Compra</label>
          <input
            v-model="notes"
            type="text"
            placeholder="Ex: Promoção leve 3 pague 2..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
          />
        </div>

        <!-- Buttons -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50"
          >
            <span>{{ isSubmitting ? 'Salvando...' : 'Confirmar Reposição' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
