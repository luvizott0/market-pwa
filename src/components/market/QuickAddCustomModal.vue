<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, X, ShoppingCart, Calendar, AlertCircle, Sparkles } from 'lucide-vue-next'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useInventoryStore } from '@/stores/inventory'
import type { StockCategory } from '@/types/inventory'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    categories?: StockCategory[]
  }>(),
  {
    categories: () => [],
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'added'): void
}>()

const shoppingStore = useShoppingListStore()
const inventoryStore = useInventoryStore()

const name = ref('')
const brand = ref('')
const selectedCategoryId = ref<number | null>(null)
const quantity = ref<number>(1)
const unit = ref<string>('un')
const minQuantity = ref<number | null>(1)
const estimatedPrice = ref<number | null>(null)
const expirationDate = ref<string>('')
const notes = ref('')

const errorMessage = ref<string | null>(null)

const unitOptions = [
  { label: 'Unidade (un)', value: 'un' },
  { label: 'Pacote (pct)', value: 'pct' },
  { label: 'Quilo (kg)', value: 'kg' },
  { label: 'Grama (g)', value: 'g' },
  { label: 'Litro (L)', value: 'L' },
  { label: 'Mililitro (ml)', value: 'ml' },
  { label: 'Caixa (cx)', value: 'cx' },
  { label: 'Rolo (rolo)', value: 'rolo' },
  { label: 'Lata (lata)', value: 'lata' },
  { label: 'Garrafa (gf)', value: 'gf' },
]

const resetForm = () => {
  name.value = ''
  brand.value = ''
  const availableCategories = props.categories.length > 0 ? props.categories : inventoryStore.categories
  selectedCategoryId.value = availableCategories.length > 0 ? (availableCategories[0]?.id ?? null) : null
  quantity.value = 1
  unit.value = 'un'
  minQuantity.value = 1
  estimatedPrice.value = null
  expirationDate.value = ''
  notes.value = ''
  errorMessage.value = null
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

const handleSubmit = () => {
  if (!name.value.trim()) {
    errorMessage.value = 'Informe o nome do item.'
    return
  }

  const availableCategories = props.categories.length > 0 ? props.categories : inventoryStore.categories
  const selectedCat = availableCategories.find((c) => c.id === selectedCategoryId.value)

  shoppingStore.addCustomItem({
    name: name.value.trim(),
    brand: brand.value.trim() || null,
    stock_category_id: selectedCategoryId.value,
    category_name: selectedCat?.name || 'Geral',
    category_color: selectedCat?.color_hex || '#10b981',
    quantity: Number(quantity.value || 1),
    unit: unit.value || 'un',
    min_quantity: minQuantity.value !== null ? Number(minQuantity.value) : 1,
    estimated_price: estimatedPrice.value !== null ? Number(estimatedPrice.value) : 0,
    expiration_date: expirationDate.value || null,
    notes: notes.value.trim() || null,
  })

  resetForm()
  emit('added')
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingCart class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Novo Item Avulso</h3>
            <p class="text-xs text-slate-500 font-medium">
              Ficará na lista e será cadastrado no estoque ao finalizar a compra
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

      <!-- Form Body (matches InventoryItemModal) -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto space-y-4 text-xs font-medium">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Name & Brand -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Nome do Item *</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ex: Arroz Branco, Detergente"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Marca (opcional)</label>
            <input
              v-model="brand"
              type="text"
              placeholder="Ex: Tio João, Ypê"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
        </div>

        <!-- Category -->
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Categoria</label>
          <select
            v-model="selectedCategoryId"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white transition"
          >
            <option :value="null">Sem Categoria</option>
            <option
              v-for="cat in (props.categories.length > 0 ? props.categories : inventoryStore.categories)"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Quantity, Unit & Min Quantity -->
        <div class="grid grid-cols-3 gap-2.5">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Qtd a Comprar *</label>
            <input
              v-model.number="quantity"
              type="number"
              step="any"
              min="0.1"
              required
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Unidade</label>
            <select
              v-model="unit"
              class="w-full px-2 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white transition"
            >
              <option v-for="u in unitOptions" :key="u.value" :value="u.value">
                {{ u.label }}
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Estoque Mín.</label>
            <input
              v-model.number="minQuantity"
              type="number"
              step="any"
              min="0"
              placeholder="1"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>
        </div>

        <!-- Reference Price & Expiration Date -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Preço de Referência (R$)</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">R$</span>
              <input
                v-model.number="estimatedPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
              />
            </div>
            <p class="text-[10px] text-slate-400">Usado para estimativas e lista de compras.</p>
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Data de Validade (opcional)</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Calendar class="w-4 h-4" />
              </span>
              <input
                v-model="expirationDate"
                type="date"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white transition"
              />
            </div>
          </div>
        </div>

        <!-- Automatic duration cycle info notice -->
        <div class="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-[11px]">
          <Sparkles class="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Ciclo de consumo automático:</strong> O tempo médio de duração será calculado pelo sistema com base no intervalo entre suas últimas 5 compras.
          </span>
        </div>

        <!-- Notes -->
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Observações / Detalhes</label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Ex: Preferência por grão longo, comprar no mercado X..."
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition resize-none"
          ></textarea>
        </div>

        <!-- Footer Actions -->
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
            class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            <Plus class="w-4 h-4" />
            <span>Adicionar à Lista</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
