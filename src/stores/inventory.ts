import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inventoryService } from '@/services/inventoryService'
import type { InventoryItem, StockCategory, InventorySummary } from '@/types/inventory'

export const useInventoryStore = defineStore('market_inventory', () => {
  const items = ref<InventoryItem[]>([])
  const categories = ref<StockCategory[]>([])
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  const summary = ref<InventorySummary>({
    total_items: 0,
    low_stock_count: 0,
    expired_count: 0,
    expiring_soon_count: 0,
    total_estimated_value: 0,
  })

  // Computed: Average monthly spend on inventory items
  const estimatedMonthlySpend = computed(() => {
    return items.value.reduce((acc, item) => {
      if (item.estimated_monthly_cost !== null && item.estimated_monthly_cost !== undefined) {
        return acc + Number(item.estimated_monthly_cost)
      }
      const price = Number(item.average_price ?? item.last_price ?? 0)
      if (item.duration_days && item.duration_days > 0 && price > 0) {
        return acc + (price / item.duration_days) * 30
      }
      return acc
    }, 0)
  })

  // Computed: Next 5 items to be bought based on urgency
  const nextItemsToBuy = computed(() => {
    const today = new Date()

    const scored = items.value.map((item) => {
      let score = 0
      let reason = 'Estoque normal'
      let daysRemaining: number | null = null

      // Check cycle duration remaining
      if (item.last_purchased_at && item.duration_days) {
        try {
          const lastDate = new Date(`${item.last_purchased_at}T00:00:00`)
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          daysRemaining = Math.max(-99, item.duration_days - diffDays)
        } catch {
          daysRemaining = null
        }
      }

      const qty = Number(item.quantity ?? 0)
      const minQty = item.min_quantity !== null && item.min_quantity !== undefined ? Number(item.min_quantity) : 1

      if (qty <= 0) {
        score += 1000
        reason = 'Esgotado (0 unidades)'
      } else if (qty <= minQty) {
        score += 800 + (minQty - qty) * 10
        reason = `Estoque baixo (${qty} de ${minQty})`
      } else if (item.status === 'expired') {
        score += 600
        reason = 'Produto vencido'
      } else if (item.status === 'expiring_soon') {
        score += 400
        reason = 'Vencendo nos próximos dias'
      } else if (daysRemaining !== null && daysRemaining <= 3) {
        score += 300 + (3 - daysRemaining) * 20
        reason = daysRemaining <= 0 ? 'Ciclo de consumo esgotado' : `Ciclo acaba em ${daysRemaining}d`
      } else if (item.is_regular_expense) {
        score += 100
      }

      return {
        item,
        score,
        reason,
        daysRemaining,
      }
    })

    // Filter only items with a real buying need (score > 100) or sort all and pick top 5
    const needingBuy = scored.filter((s) => s.score >= 200)

    if (needingBuy.length >= 5) {
      return needingBuy.sort((a, b) => b.score - a.score).slice(0, 5)
    }

    // Fallback: take top scored
    return scored.sort((a, b) => b.score - a.score).slice(0, 5)
  })

  // Stock status counts
  const stockStats = computed(() => {
    let outOfStock = 0
    let lowStock = 0
    let normal = 0
    let expiring = 0
    let expired = 0

    items.value.forEach((item) => {
      const qty = Number(item.quantity ?? 0)
      const minQty = item.min_quantity !== null && item.min_quantity !== undefined ? Number(item.min_quantity) : 0

      if (item.status === 'expired') {
        expired++
      } else if (item.status === 'expiring_soon') {
        expiring++
      }

      if (qty <= 0) {
        outOfStock++
      } else if (minQty > 0 && qty <= minQty) {
        lowStock++
      } else {
        normal++
      }
    })

    const total = items.value.length
    const healthyPercent = total > 0 ? Math.round((normal / total) * 100) : 100

    return {
      total,
      outOfStock,
      lowStock,
      normal,
      expiring,
      expired,
      healthyPercent,
      estimatedValue: summary.value.total_estimated_value || items.value.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.last_price || it.average_price || 0)), 0)
    }
  })

  // Category distribution
  const categoryStats = computed(() => {
    const map = new Map<string, { id: number; name: string; color: string; count: number; value: number }>()

    categories.value.forEach((cat) => {
      map.set(String(cat.id), {
        id: cat.id,
        name: cat.name,
        color: cat.color_hex || '#10b981',
        count: 0,
        value: 0,
      })
    })

    items.value.forEach((item) => {
      const catId = item.stock_category_id ? String(item.stock_category_id) : 'none'
      const price = Number(item.last_price ?? item.average_price ?? 0)
      const qty = Number(item.quantity ?? 0)
      const itemVal = qty * price

      if (map.has(catId)) {
        const c = map.get(catId)!
        c.count++
        c.value += itemVal
      } else {
        const name = item.category?.name || 'Sem Categoria'
        const color = item.category?.color_hex || '#94a3b8'
        map.set(catId, {
          id: item.stock_category_id || 0,
          name,
          color,
          count: 1,
          value: itemVal,
        })
      }
    })

    return Array.from(map.values()).filter((c) => c.count > 0)
  })

  // Actions
  const fetchCategories = async () => {
    try {
      const res = await inventoryService.getCategories()
      if (res?.data) {
        categories.value = res.data
      }
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err)
    }
  }

  const fetchItems = async (params: Record<string, any> = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const queryParams = {
        per_page: 100,
        ...params,
      }
      const res = await inventoryService.getItems(queryParams)
      if (res?.data) {
        items.value = res.data
        if (res.meta?.summary) {
          summary.value = res.meta.summary
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar itens'
      console.error('Erro ao buscar itens de estoque:', err)
    } finally {
      isLoading.value = false
    }
  }

  const refreshAll = async () => {
    isRefreshing.value = true
    try {
      await Promise.all([fetchCategories(), fetchItems(), fetchStores()])
    } finally {
      isRefreshing.value = false
    }
  }

  const createItem = async (data: Partial<InventoryItem>) => {
    const res = await inventoryService.createItem(data)
    if (res?.data) {
      items.value.unshift(res.data)
      await fetchItems()
    }
    return res
  }

  const updateItem = async (id: number, data: Partial<InventoryItem>) => {
    const res = await inventoryService.updateItem(id, data)
    if (res?.data) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = res.data
      }
    }
    return res
  }

  const deleteItem = async (id: number) => {
    await inventoryService.deleteItem(id)
    items.value = items.value.filter((i) => i.id !== id)
  }

  const consumeItem = async (id: number, quantity: number = 1) => {
    const res = await inventoryService.consumeItem(id, quantity)
    if (res?.data) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = res.data
      }
    }
    return res
  }

  const recordPurchase = async (
    id: number,
    payload: {
      purchased_at: string
      quantity: number
      unit_price: number
      duration_days?: number | null
      store_name?: string | null
      notes?: string | null
    }
  ) => {
    const res = await inventoryService.recordPurchase(id, payload)
    if (res?.data) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = res.data
      }
      if (payload.store_name && !stores.value.includes(payload.store_name)) {
        stores.value.push(payload.store_name)
      }
    }
    return res
  }

  const stores = ref<string[]>([])

  const fetchStores = async () => {
    try {
      const res = await inventoryService.getStores()
      if (res?.data) {
        stores.value = res.data
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de estabelecimentos:', e)
    }
  }

  const createCategory = async (data: { name: string; color_hex?: string; icon?: string }) => {
    const res = await inventoryService.createCategory(data)
    if (res?.data) {
      categories.value.push(res.data)
    }
    return res
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('market:space-changed', () => {
      refreshAll()
    })
  }

  return {
    items,
    categories,
    isLoading,
    isRefreshing,
    error,
    summary,
    estimatedMonthlySpend,
    nextItemsToBuy,
    stockStats,
    categoryStats,
    fetchCategories,
    fetchItems,
    refreshAll,
    createItem,
    updateItem,
    deleteItem,
    consumeItem,
    recordPurchase,
    stores,
    fetchStores,
    createCategory,
  }
})
