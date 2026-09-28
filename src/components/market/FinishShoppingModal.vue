<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { CheckCircle2, ShoppingBag, X, AlertCircle, Sparkles, Store, Plus, ChevronDown, Check } from 'lucide-vue-next'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useInventoryStore } from '@/stores/inventory'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'finished', result: any): void
}>()

const shoppingStore = useShoppingListStore()
const inventoryStore = useInventoryStore()

const updateStock = ref(true)
const storeName = ref('')
const storeSearch = ref('')
const isStoreDropdownOpen = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  await inventoryStore.fetchStores()
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      storeName.value = ''
      storeSearch.value = ''
      isStoreDropdownOpen.value = false
      errorMessage.value = null
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

const handleConfirm = async () => {
  isSubmitting.value = true
  errorMessage.value = null
  try {
    const finalStore = storeName.value.trim() || storeSearch.value.trim() || null
    const result = await shoppingStore.finishShopping(finalStore)
    emit('finished', result)
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha ao finalizar compras.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Finalizar Ida ao Mercado</h3>
            <p class="text-xs text-slate-500 font-medium">Concluir compra e atualizar estoque</p>
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

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-4 text-xs font-medium">
        <div
          v-if="errorMessage"
          class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Total summary card -->
        <div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/80 rounded-2xl text-center space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total no Carrinho</span>
          <div class="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {{ formatCurrency(shoppingStore.checkedTotal) }}
          </div>
          <p class="text-[11px] text-emerald-700">
            {{ shoppingStore.checkedCount }} {{ shoppingStore.checkedCount === 1 ? 'item comprado' : 'itens comprados' }}
          </p>
        </div>

        <!-- Estabelecimento / Mercado Search Select -->
        <div class="space-y-1.5 relative">
          <label class="text-slate-700 font-bold block flex items-center gap-1.5">
            <Store class="w-3.5 h-3.5 text-emerald-600" />
            <span>Onde você comprou? (Estabelecimento)</span>
          </label>

          <div class="relative">
            <input
              v-model="storeSearch"
              type="text"
              placeholder="Ex: Atacadão, Carrefour, Pão de Açúcar, Farmácia..."
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

          <!-- Dropdown of existing stores + create new -->
          <div
            v-if="isStoreDropdownOpen && (filteredStores.length > 0 || isNewStore)"
            class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in"
          >
            <!-- Option to create new store if typed -->
            <button
              v-if="isNewStore"
              type="button"
              @click="createAndSelectStore"
              class="w-full px-3.5 py-2.5 text-left text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70 flex items-center gap-2 cursor-pointer transition"
            >
              <Plus class="w-3.5 h-3.5 text-emerald-600" />
              <span>Usar novo: "<strong>{{ storeSearch.trim() }}</strong>"</span>
            </button>

            <!-- Existing stores list -->
            <button
              v-for="store in filteredStores"
              :key="store"
              type="button"
              @click="selectStore(store)"
              class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
            >
              <span class="font-medium">{{ store }}</span>
              <Check
                v-if="store === storeName"
                class="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]"
              />
            </button>
          </div>

          <!-- Recent store chips for 1-tap selection -->
          <div v-if="inventoryStore.stores.length > 0 && !isStoreDropdownOpen" class="flex flex-wrap gap-1.5 pt-1">
            <button
              v-for="s in inventoryStore.stores.slice(0, 4)"
              :key="s"
              type="button"
              @click="selectStore(s)"
              :class="[
                'px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer',
                storeName === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Items list preview -->
        <div class="space-y-1.5">
          <span class="text-slate-700 font-bold block">Itens Comprados ({{ shoppingStore.checkedCount }}):</span>
          <div class="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/50 p-2">
            <div
              v-for="item in shoppingStore.checkedItems"
              :key="item.id"
              class="py-1.5 px-2 flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2 min-w-0 pr-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span class="font-semibold text-slate-800 truncate">{{ item.name }}</span>
                <span class="text-[11px] text-slate-400">({{ item.quantity }} {{ item.unit }})</span>
              </div>
              <span class="font-bold text-slate-700 shrink-0">
                {{ formatCurrency((item.actual_price ?? item.estimated_price) * item.quantity) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Stock update checkbox -->
        <label class="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/70 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition select-none">
          <input
            v-model="updateStock"
            type="checkbox"
            class="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <div>
            <span class="font-bold text-slate-900 block text-xs">Atualizar estoque automaticamente</span>
            <span class="text-[11px] text-slate-500 font-normal">
              Acrescenta as quantidades no inventário e salva o histórico com o estabelecimento.
            </span>
          </div>
        </label>
      </div>

      <!-- Footer Buttons -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="isSubmitting"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50 text-xs"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ isSubmitting ? 'Finalizando...' : 'Confirmar e Limpar Carrinho' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
