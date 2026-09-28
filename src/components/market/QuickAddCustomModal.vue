<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X, ShoppingCart, Tag } from 'lucide-vue-next'
import { useShoppingListStore } from '@/stores/shoppingList'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'added'): void
}>()

const shoppingStore = useShoppingListStore()

const name = ref('')
const brand = ref('')
const categoryName = ref('Geral')
const quantity = ref(1)
const unit = ref('un')
const estimatedPrice = ref<number | null>(null)
const notes = ref('')

const unitOptions = ['un', 'pct', 'kg', 'g', 'L', 'ml', 'cx', 'rolo', 'lata', 'gf']

const resetForm = () => {
  name.value = ''
  brand.value = ''
  categoryName.value = 'Geral'
  quantity.value = 1
  unit.value = 'un'
  estimatedPrice.value = null
  notes.value = ''
}

const handleSubmit = () => {
  if (!name.value.trim()) return

  shoppingStore.addCustomItem({
    name: name.value,
    brand: brand.value,
    category_name: categoryName.value,
    quantity: Number(quantity.value || 1),
    unit: unit.value,
    estimated_price: estimatedPrice.value !== null ? Number(estimatedPrice.value) : 0,
    notes: notes.value,
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
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingCart class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Item Avulso para o Mercado</h3>
            <p class="text-xs text-slate-500 font-medium">Adicione rapidamente algo fora do estoque</p>
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
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Nome do Item *</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Ex: Pão de Forma, Frango, Maçã..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Marca (opcional)</label>
            <input
              v-model="brand"
              type="text"
              placeholder="Ex: Wickbold"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Categoria</label>
            <input
              v-model="categoryName"
              type="text"
              placeholder="Ex: Padaria, Hortifrúti"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2.5">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Qtd a Comprar</label>
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
              <option v-for="u in unitOptions" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Preço Est. (R$)</label>
            <input
              v-model.number="estimatedPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Observação (opcional)</label>
          <input
            v-model="notes"
            type="text"
            placeholder="Ex: Pegar o mais fresco"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
          />
        </div>

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
