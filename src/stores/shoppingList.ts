import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ShoppingItem } from '@/types/market'
import type { InventoryItem } from '@/types/inventory'
import { shoppingService } from '@/services/shoppingService'
import { useInventoryStore } from './inventory'

export const useShoppingListStore = defineStore('market_shopping_list', () => {
  const inventoryStore = useInventoryStore()

  const items = ref<ShoppingItem[]>([])
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const lastSyncedAt = ref<Date | null>(null)
  let pollIntervalId: any = null

  // Computeds
  const pendingItems = computed(() => items.value.filter((i) => !i.is_checked))
  const checkedItems = computed(() => items.value.filter((i) => i.is_checked))

  const totalItemsCount = computed(() => items.value.length)
  const checkedCount = computed(() => checkedItems.value.length)
  const pendingCount = computed(() => pendingItems.value.length)

  // Total calculated for the items in cart (marked as checked)
  const checkedTotal = computed(() => {
    return checkedItems.value.reduce((acc, it) => {
      const price = it.actual_price !== null && it.actual_price !== undefined ? it.actual_price : it.estimated_price
      return acc + Number(it.quantity || 1) * Number(price || 0)
    }, 0)
  })

  // Total estimated for the whole list
  const estimatedTotal = computed(() => {
    return items.value.reduce((acc, it) => {
      const price = it.actual_price !== null && it.actual_price !== undefined ? it.actual_price : it.estimated_price
      return acc + Number(it.quantity || 1) * Number(price || 0)
    }, 0)
  })

  // Check if an inventory item is already in the list
  const isItemInList = (inventoryItemId: number) => {
    return items.value.some((i) => i.inventory_item_id === inventoryItemId)
  }

  const getItemByInventoryId = (inventoryItemId: number) => {
    return items.value.find((i) => i.inventory_item_id === inventoryItemId)
  }

  // Fetch items from backend API for current active space
  const fetchItems = async (silent: boolean = false) => {
    if (!silent) {
      isLoading.value = true
    } else {
      isSyncing.value = true
    }

    try {
      const res = await shoppingService.getItems()
      if (res?.data) {
        items.value = res.data
        lastSyncedAt.value = new Date()
      }
    } catch (e) {
      console.warn('Falha ao sincronizar lista de compras com servidor:', e)
    } finally {
      isLoading.value = false
      isSyncing.value = false
    }
  }

  // Actions
  const addFromInventory = async (invItem: InventoryItem, qty: number = 1) => {
    const existing = items.value.find((i) => i.inventory_item_id === invItem.id)
    const quantity = qty > 0 ? qty : 1
    const price = Number(invItem.last_price ?? invItem.average_price ?? 0)

    if (existing) {
      existing.quantity += quantity
      try {
        await shoppingService.updateItem(existing.id, { quantity: existing.quantity })
      } catch (err) {
        console.error('Falha ao atualizar quantidade do item na lista:', err)
      }
      return existing
    }

    // Optimistic item
    const tempId = `temp-${Date.now()}`
    const tempItem: ShoppingItem = {
      id: tempId,
      inventory_item_id: invItem.id,
      is_custom_item: false,
      stock_category_id: invItem.stock_category_id || null,
      name: invItem.name,
      brand: invItem.brand || null,
      category_name: invItem.category?.name || 'Geral',
      category_color: invItem.category?.color_hex || '#10b981',
      quantity,
      unit: invItem.unit || 'un',
      min_quantity: invItem.min_quantity !== null && invItem.min_quantity !== undefined ? invItem.min_quantity : 1,
      estimated_price: price,
      actual_price: null,
      is_checked: false,
      notes: invItem.notes || null,
    }

    items.value.unshift(tempItem)

    try {
      const res = await shoppingService.addItem({
        inventory_item_id: invItem.id,
        is_custom_item: false,
        stock_category_id: invItem.stock_category_id || null,
        name: invItem.name,
        brand: invItem.brand || null,
        category_name: invItem.category?.name || 'Geral',
        category_color: invItem.category?.color_hex || '#10b981',
        quantity,
        unit: invItem.unit || 'un',
        min_quantity: invItem.min_quantity !== null && invItem.min_quantity !== undefined ? invItem.min_quantity : 1,
        estimated_price: price,
        notes: invItem.notes || null,
      })

      if (res?.data) {
        const idx = items.value.findIndex((i) => i.id === tempId)
        if (idx !== -1) {
          items.value[idx] = res.data
        }
      }
    } catch (err) {
      console.error('Falha ao salvar item da lista no servidor:', err)
    }

    return tempItem
  }

  const addCustomItem = async (params: {
    name: string
    brand?: string | null
    stock_category_id?: number | null
    category_name?: string | null
    category_color?: string | null
    quantity?: number
    unit?: string
    min_quantity?: number | null
    estimated_price?: number | null
    expiration_date?: string | null
    notes?: string | null
  }) => {
    const tempId = `temp-${Date.now()}`
    const tempItem: ShoppingItem = {
      id: tempId,
      is_custom_item: true,
      stock_category_id: params.stock_category_id || null,
      name: params.name.trim(),
      brand: params.brand?.trim() || null,
      category_name: params.category_name || 'Geral',
      category_color: params.category_color || '#10b981',
      quantity: params.quantity && params.quantity > 0 ? params.quantity : 1,
      unit: params.unit || 'un',
      min_quantity: params.min_quantity !== null && params.min_quantity !== undefined ? params.min_quantity : 1,
      estimated_price: params.estimated_price || 0,
      actual_price: null,
      expiration_date: params.expiration_date || null,
      is_checked: false,
      notes: params.notes?.trim() || null,
    }

    items.value.unshift(tempItem)

    try {
      const res = await shoppingService.addItem({
        is_custom_item: true,
        stock_category_id: params.stock_category_id || null,
        name: params.name.trim(),
        brand: params.brand?.trim() || null,
        category_name: params.category_name || 'Geral',
        category_color: params.category_color || '#10b981',
        quantity: tempItem.quantity,
        unit: tempItem.unit,
        min_quantity: tempItem.min_quantity,
        estimated_price: tempItem.estimated_price,
        expiration_date: tempItem.expiration_date,
        notes: tempItem.notes,
      })

      if (res?.data) {
        const idx = items.value.findIndex((i) => i.id === tempId)
        if (idx !== -1) {
          items.value[idx] = res.data
        }
      }
    } catch (err) {
      console.error('Falha ao salvar item avulso no servidor:', err)
    }

    return tempItem
  }

  const toggleCheck = async (id: number | string) => {
    const item = items.value.find((i) => String(i.id) === String(id))
    if (item) {
      item.is_checked = !item.is_checked
      try {
        await shoppingService.updateItem(id, { is_checked: item.is_checked })
      } catch (err) {
        console.error('Falha ao atualizar status de compra:', err)
      }
    }
  }

  const updateQuantity = async (id: number | string, newQty: number) => {
    const item = items.value.find((i) => String(i.id) === String(id))
    if (item) {
      const val = Math.max(0.1, Math.round(newQty * 100) / 100)
      item.quantity = val
      try {
        await shoppingService.updateItem(id, { quantity: val })
      } catch (err) {
        console.error('Falha ao atualizar quantidade:', err)
      }
    }
  }

  const updateActualPrice = async (id: number | string, price: number | null) => {
    const item = items.value.find((i) => String(i.id) === String(id))
    if (item) {
      item.actual_price = price
      try {
        await shoppingService.updateItem(id, { actual_price: price })
      } catch (err) {
        console.error('Falha ao atualizar preço:', err)
      }
    }
  }

  const removeItem = async (id: number | string) => {
    items.value = items.value.filter((i) => String(i.id) !== String(id))
    try {
      await shoppingService.deleteItem(id)
    } catch (err) {
      console.error('Falha ao remover item da lista:', err)
    }
  }

  const removeChecked = async () => {
    items.value = items.value.filter((i) => !i.is_checked)
    try {
      await shoppingService.clearChecked()
    } catch (err) {
      console.error('Falha ao limpar itens concluídos:', err)
    }
  }

  const clearAll = () => {
    items.value = []
  }

  const uncheckAll = async () => {
    for (const item of items.value) {
      if (item.is_checked) {
        item.is_checked = false
        shoppingService.updateItem(item.id, { is_checked: false }).catch(() => {})
      }
    }
  }

  // Finalize shopping trip: processed on backend in one transaction
  const finishShopping = async (storeName?: string | null) => {
    try {
      const res = await shoppingService.finishShopping(storeName)
      // Remove checked items locally
      items.value = items.value.filter((i) => !i.is_checked)
      // Refresh inventory items
      await inventoryStore.fetchItems()

      return {
        restockedCount: res?.data?.restocked_count ?? 0,
        restockedNames: res?.data?.restocked_names ?? [],
        totalSpent: res?.data?.total_spent ?? checkedTotal.value,
        storeName: res?.data?.store_name ?? storeName ?? null,
      }
    } catch (err) {
      console.error('Falha ao finalizar compras no servidor:', err)
      throw err
    }
  }

  // Synchronization helpers (polling disabled in favor of manual refresh until websocket is added)
  const startPolling = (_intervalMs: number = 4000) => {
    stopPolling()
    // No automatic interval
  }

  const stopPolling = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId)
      pollIntervalId = null
    }
  }

  // Listen to space switch event to refresh automatically
  if (typeof window !== 'undefined') {
    window.addEventListener('market:space-changed', () => {
      fetchItems(false)
    })
  }

  return {
    items,
    isLoading,
    isSyncing,
    lastSyncedAt,
    pendingItems,
    checkedItems,
    totalItemsCount,
    checkedCount,
    pendingCount,
    checkedTotal,
    estimatedTotal,
    isItemInList,
    getItemByInventoryId,
    fetchItems,
    addFromInventory,
    addCustomItem,
    toggleCheck,
    updateQuantity,
    updateActualPrice,
    removeItem,
    removeChecked,
    clearAll,
    uncheckAll,
    finishShopping,
    startPolling,
    stopPolling,
  }
})
