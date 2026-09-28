import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ShoppingItem } from '@/types/market'
import type { InventoryItem } from '@/types/inventory'
import { useInventoryStore } from './inventory'

const STORAGE_KEY = 'market_shopping_list_v1'

export const useShoppingListStore = defineStore('market_shopping_list', () => {
  const inventoryStore = useInventoryStore()

  // Load from LocalStorage
  const loadStoredItems = (): ShoppingItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.error('Erro ao ler lista de compras local:', e)
    }
    return []
  }

  const items = ref<ShoppingItem[]>(loadStoredItems())

  // Persist whenever items change
  watch(
    items,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
      } catch (e) {
        console.error('Erro ao salvar lista de compras local:', e)
      }
    },
    { deep: true }
  )

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
      return acc + (Number(it.quantity || 1) * Number(price || 0))
    }, 0)
  })

  // Total estimated for the whole list
  const estimatedTotal = computed(() => {
    return items.value.reduce((acc, it) => {
      const price = it.actual_price !== null && it.actual_price !== undefined ? it.actual_price : it.estimated_price
      return acc + (Number(it.quantity || 1) * Number(price || 0))
    }, 0)
  })

  // Check if an inventory item is already in the list
  const isItemInList = (inventoryItemId: number) => {
    return items.value.some((i) => i.inventory_item_id === inventoryItemId)
  }

  const getItemByInventoryId = (inventoryItemId: number) => {
    return items.value.find((i) => i.inventory_item_id === inventoryItemId)
  }

  // Actions
  const addFromInventory = (invItem: InventoryItem, qty: number = 1) => {
    const existing = items.value.find((i) => i.inventory_item_id === invItem.id)
    if (existing) {
      existing.quantity += qty
      return existing
    }

    const price = Number(invItem.last_price ?? invItem.average_price ?? 0)
    const newItem: ShoppingItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      inventory_item_id: invItem.id,
      name: invItem.name,
      brand: invItem.brand || null,
      category_name: invItem.category?.name || 'Geral',
      category_color: invItem.category?.color_hex || '#10b981',
      quantity: qty > 0 ? qty : 1,
      unit: invItem.unit || 'un',
      estimated_price: price,
      actual_price: null,
      is_checked: false,
      notes: invItem.notes || null,
      added_at: new Date().toISOString(),
    }

    items.value.unshift(newItem)
    return newItem
  }

  const addCustomItem = (params: {
    name: string
    brand?: string
    category_name?: string
    quantity?: number
    unit?: string
    estimated_price?: number
    notes?: string
  }) => {
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: params.name.trim(),
      brand: params.brand?.trim() || null,
      category_name: params.category_name || 'Diversos',
      category_color: '#64748b',
      quantity: params.quantity && params.quantity > 0 ? params.quantity : 1,
      unit: params.unit || 'un',
      estimated_price: params.estimated_price || 0,
      actual_price: null,
      is_checked: false,
      notes: params.notes || null,
      added_at: new Date().toISOString(),
    }

    items.value.unshift(newItem)
    return newItem
  }

  const toggleCheck = (id: string) => {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.is_checked = !item.is_checked
    }
  }

  const updateQuantity = (id: string, newQty: number) => {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.quantity = Math.max(0.1, Math.round(newQty * 100) / 100)
    }
  }

  const updateActualPrice = (id: string, price: number | null) => {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.actual_price = price
    }
  }

  const removeItem = (id: string) => {
    items.value = items.value.filter((i) => i.id !== id)
  }

  const removeChecked = () => {
    items.value = items.value.filter((i) => !i.is_checked)
  }

  const clearAll = () => {
    items.value = []
  }

  const uncheckAll = () => {
    items.value.forEach((i) => {
      i.is_checked = false
    })
  }

  // Finalize shopping trip: records purchases in inventory for checked items and cleans up
  const finishShopping = async (updateInventoryStock: boolean = true, storeName?: string | null) => {
    const boughtItems = [...checkedItems.value]
    const today = new Date().toISOString().split('T')[0] || ''
    const restockedNames: string[] = []

    if (updateInventoryStock) {
      for (const item of boughtItems) {
        if (item.inventory_item_id) {
          const unitPrice =
            item.actual_price !== null && item.actual_price !== undefined
              ? item.actual_price
              : item.estimated_price

          try {
            await inventoryStore.recordPurchase(item.inventory_item_id, {
              purchased_at: today,
              quantity: item.quantity,
              unit_price: unitPrice,
              store_name: storeName?.trim() || null,
              notes: storeName ? `Compra em ${storeName}` : 'Compra via Lista de Mercado PWA',
            })
            restockedNames.push(item.name)
          } catch (err) {
            console.error(`Falha ao registrar compra de ${item.name}:`, err)
          }
        }
      }
      // Refresh inventory
      await inventoryStore.fetchItems()
    }

    // Remove checked items
    removeChecked()

    return {
      restockedCount: restockedNames.length,
      restockedNames,
      totalSpent: checkedTotal.value,
      storeName: storeName || null,
    }
  }

  return {
    items,
    pendingItems,
    checkedItems,
    totalItemsCount,
    checkedCount,
    pendingCount,
    checkedTotal,
    estimatedTotal,
    isItemInList,
    getItemByInventoryId,
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
  }
})
