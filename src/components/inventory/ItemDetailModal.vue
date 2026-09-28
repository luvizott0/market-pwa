<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Package,
  Calendar,
  DollarSign,
  Clock,
  Store,
  ShoppingCart,
  Plus,
  Pencil,
  Tag,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  History,
  Info,
  RefreshCw,
} from 'lucide-vue-next'
import { formatCurrency, formatFullDate, formatDate, formatRelativeDays } from '@/utils/formatters'
import { inventoryService } from '@/services/inventoryService'
import type { InventoryItem } from '@/types/inventory'

const props = defineProps<{
  isOpen: boolean
  item: InventoryItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', item: InventoryItem): void
  (e: 'restock', item: InventoryItem): void
  (e: 'add-to-list', item: InventoryItem): void
}>()

const detailedItem = ref<InventoryItem | null>(props.item)
const isLoadingDetails = ref(false)

const activeItem = computed(() => detailedItem.value || props.item)

const loadItemDetails = async (id: number) => {
  isLoadingDetails.value = true
  try {
    const res = await inventoryService.getItem(id)
    if (res?.data) {
      detailedItem.value = res.data
    }
  } catch (e) {
    console.warn('Erro ao carregar detalhes completos do item:', e)
  } finally {
    isLoadingDetails.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.item) {
      detailedItem.value = props.item
      loadItemDetails(props.item.id)
    }
  }
)

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      detailedItem.value = newItem
      if (props.isOpen) {
        loadItemDetails(newItem.id)
      }
    }
  }
)

const purchases = computed(() => {
  if (!activeItem.value?.purchases) return []
  return [...activeItem.value.purchases].sort(
    (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
  )
})

const lowestPrice = computed(() => {
  if (!purchases.value.length) return null
  return Math.min(...purchases.value.map((p) => p.unit_price))
})

const highestPrice = computed(() => {
  if (!purchases.value.length) return null
  return Math.max(...purchases.value.map((p) => p.unit_price))
})
</script>

<template>
  <div
    v-if="isOpen && activeItem"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div class="flex items-center gap-3 min-w-0 pr-2">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-slate-900 truncate">
                {{ activeItem.name }}
              </h2>
              <span
                class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg shrink-0"
                :style="{
                  backgroundColor: `${activeItem.category?.color_hex || '#10b981'}15`,
                  color: activeItem.category?.color_hex || '#10b981',
                }"
              >
                {{ activeItem.category?.name || 'Geral' }}
              </span>
            </div>
            <p v-if="activeItem.brand" class="text-xs text-slate-400 font-medium truncate">
              Marca: {{ activeItem.brand }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            v-if="isLoadingDetails"
            type="button"
            class="p-2 rounded-xl text-slate-400"
            title="Atualizando..."
          >
            <RefreshCw class="w-4 h-4 animate-spin text-emerald-600" />
          </button>

          <button
            type="button"
            @click="emit('close')"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="p-6 overflow-y-auto space-y-6 text-xs font-medium">
        <!-- Stock & Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Estoque Atual -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Estoque Atual</span>
            <div class="text-lg font-extrabold text-slate-900">
              {{ activeItem.quantity }} <span class="text-xs font-semibold text-slate-500">{{ activeItem.unit }}</span>
            </div>
            <span v-if="activeItem.min_quantity" class="text-[10px] text-slate-400 block">
              Mínimo: {{ activeItem.min_quantity }} {{ activeItem.unit }}
            </span>
          </div>

          <!-- Preço Médio (últimas compras) -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Preço Médio</span>
            <div class="text-lg font-extrabold text-slate-900">
              {{ formatCurrency(activeItem.average_price || activeItem.last_price) }}
            </div>
            <span class="text-[10px] text-slate-400 block">
              {{ purchases.length > 0 ? `Últimas ${Math.min(5, purchases.length)} compras` : 'Preço de cadastro' }}
            </span>
          </div>

          <!-- Ciclo de Duração -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Ciclo Médio</span>
            <div class="text-lg font-extrabold text-slate-900">
              {{ activeItem.duration_days ? `~${activeItem.duration_days} dias` : 'Calculando' }}
            </div>
            <span class="text-[10px] text-slate-400 block">Intervalo de reposição</span>
          </div>

          <!-- Gasto Mensal Estimado -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <span class="text-[10px] uppercase font-bold text-emerald-700 block">Custo Mensal Est.</span>
            <div class="text-lg font-extrabold text-emerald-900">
              {{ formatCurrency(activeItem.estimated_monthly_cost) }}
            </div>
            <span class="text-[10px] text-emerald-700/80 block">Baseado no ciclo</span>
          </div>
        </div>

        <!-- Expiration / Notes Banner if present -->
        <div
          v-if="activeItem.expiration_date || activeItem.notes"
          class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
        >
          <div v-if="activeItem.expiration_date" class="flex items-center justify-between text-slate-600">
            <div class="flex items-center gap-1.5 font-semibold">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Data de Validade: {{ formatDate(activeItem.expiration_date) }}</span>
            </div>
            <span
              v-if="activeItem.days_until_expiration !== null && activeItem.days_until_expiration !== undefined"
              :class="[
                'font-bold text-[11px]',
                activeItem.days_until_expiration < 0
                  ? 'text-rose-600'
                  : activeItem.days_until_expiration <= 7
                  ? 'text-amber-600'
                  : 'text-slate-500'
              ]"
            >
              {{ formatRelativeDays(activeItem.days_until_expiration).text }}
            </span>
          </div>

          <p v-if="activeItem.notes" class="text-slate-500 font-normal italic">
            "{{ activeItem.notes }}"
          </p>
        </div>

        <!-- Histórico de Compras Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <History class="w-4 h-4 text-emerald-600" />
              <h3 class="text-sm font-bold text-slate-900">Histórico de Compras & Estabelecimentos</h3>
            </div>
            <span class="text-[11px] font-bold text-slate-400">
              {{ purchases.length }} {{ purchases.length === 1 ? 'registro' : 'registros' }}
            </span>
          </div>

          <!-- Empty Purchases State -->
          <div
            v-if="purchases.length === 0"
            class="p-6 text-center bg-slate-50 border border-slate-100 rounded-2xl space-y-2"
          >
            <p class="text-slate-500">Nenhuma compra registrada para este produto ainda.</p>
            <button
              type="button"
              @click="emit('restock', activeItem)"
              class="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
            >
              Registrar Primeira Compra
            </button>
          </div>

          <!-- Purchases List -->
          <div v-else class="space-y-2.5">
            <div
              v-for="p in purchases"
              :key="p.id"
              class="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition space-y-2 shadow-2xs"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-800 text-xs">
                      {{ formatFullDate(p.purchased_at) }}
                    </span>
                    <span class="text-[11px] text-slate-400 font-medium">
                      ({{ p.quantity }} {{ activeItem.unit }})
                    </span>
                  </div>

                  <!-- Estabelecimento badge -->
                  <div class="flex items-center gap-1.5 pt-0.5">
                    <Store class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span
                      v-if="p.store_name"
                      class="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md text-[11px] font-extrabold"
                    >
                      {{ p.store_name }}
                    </span>
                    <span v-else class="text-[11px] text-slate-400 font-normal">
                      Local não informado
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-extrabold text-slate-900 block">
                    {{ formatCurrency(p.unit_price) }} <span class="text-[10px] font-normal text-slate-400">/{{ activeItem.unit }}</span>
                  </span>
                  <span class="text-[11px] text-slate-500 font-medium">
                    Total: {{ formatCurrency(p.total_price) }}
                  </span>
                </div>
              </div>

              <!-- Extra notes or cycle info if present -->
              <div
                v-if="p.duration_days || p.notes"
                class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500"
              >
                <span v-if="p.duration_days" class="text-emerald-700 font-semibold flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  <span>Durou {{ p.duration_days }} dias até a próxima compra</span>
                </span>
                <span v-else></span>

                <span v-if="p.notes" class="text-slate-400 italic truncate max-w-[200px]">
                  {{ p.notes }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Action Buttons -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-between gap-2.5 bg-slate-50/60">
        <button
          type="button"
          @click="emit('edit', activeItem)"
          class="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <Pencil class="w-3.5 h-3.5" />
          <span>Editar</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('add-to-list', activeItem)"
            class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <ShoppingCart class="w-3.5 h-3.5 text-slate-600" />
            <span>Colocar na Lista</span>
          </button>

          <button
            type="button"
            @click="emit('restock', activeItem)"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 text-xs"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Registrar Compra</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
