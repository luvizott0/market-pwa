import { api } from './api'
import type { ShoppingItem } from '@/types/market'

export interface ShoppingFinishResponse {
  message: string
  data: {
    restocked_count: number
    restocked_names: string[]
    total_spent: number
    store_name?: string | null
  }
}

export const shoppingService = {
  getItems: async () => {
    return api.get<{ data: ShoppingItem[] }>('/shopping-items')
  },

  addItem: async (payload: {
    name: string
    inventory_item_id?: number | null
    is_custom_item?: boolean
    stock_category_id?: number | null
    brand?: string | null
    category_name?: string | null
    category_color?: string | null
    quantity: number
    unit?: string
    min_quantity?: number | null
    estimated_price?: number | null
    actual_price?: number | null
    expiration_date?: string | null
    notes?: string | null
  }) => {
    return api.post<{ data: ShoppingItem; message: string }>('/shopping-items', payload)
  },

  updateItem: async (
    id: number | string,
    payload: Partial<{
      name: string
      brand: string | null
      stock_category_id: number | null
      quantity: number
      unit: string
      min_quantity: number | null
      estimated_price: number
      actual_price: number | null
      expiration_date: string | null
      is_checked: boolean
      notes: string | null
    }>
  ) => {
    return api.put<{ data: ShoppingItem; message: string }>(`/shopping-items/${id}`, payload)
  },

  deleteItem: async (id: number | string) => {
    return api.delete<{ message: string }>(`/shopping-items/${id}`)
  },

  clearChecked: async () => {
    return api.post<{ message: string; deleted_count: number }>('/shopping-items/clear-checked')
  },

  finishShopping: async (storeName?: string | null) => {
    return api.post<ShoppingFinishResponse>('/shopping-items/finish', {
      store_name: storeName?.trim() || null,
    })
  },
}
