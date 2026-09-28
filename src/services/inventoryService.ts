import { api } from './api'
import type {
  InventoryItem,
  InventoryResponse,
  StockCategory,
  StockShareStatus,
} from '@/types/inventory'

export const inventoryService = {
  // Stock Categories
  getCategories: async (): Promise<{ data: StockCategory[] }> => {
    return api.get('/stock-categories')
  },

  createCategory: async (data: {
    name: string
    color_hex?: string
    icon?: string
    is_active?: boolean
  }): Promise<{ data: StockCategory }> => {
    return api.post('/stock-categories', data)
  },

  updateCategory: async (
    id: number,
    data: Partial<{
      name: string
      color_hex: string
      icon: string
      is_active: boolean
    }>
  ): Promise<{ data: StockCategory }> => {
    return api.put(`/stock-categories/${id}`, data)
  },

  deleteCategory: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/stock-categories/${id}`)
  },

  // Inventory Items
  getItems: async (params?: Record<string, any>): Promise<InventoryResponse> => {
    if (!params) return api.get('/inventory-items')
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    }
    const query = searchParams.toString()
    return api.get(`/inventory-items${query ? `?${query}` : ''}`)
  },

  getItem: async (id: number): Promise<{ data: InventoryItem }> => {
    return api.get(`/inventory-items/${id}`)
  },

  createItem: async (data: Partial<InventoryItem>): Promise<{ data: InventoryItem }> => {
    return api.post('/inventory-items', data)
  },

  updateItem: async (id: number, data: Partial<InventoryItem>): Promise<{ data: InventoryItem }> => {
    return api.put(`/inventory-items/${id}`, data)
  },

  deleteItem: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/inventory-items/${id}`)
  },

  consumeItem: async (
    id: number,
    quantity: number = 1
  ): Promise<{ data: InventoryItem; message: string }> => {
    return api.post(`/inventory-items/${id}/consume`, { quantity })
  },

  recordPurchase: async (
    id: number,
    data: {
      purchased_at: string
      quantity: number
      unit_price: number
      duration_days?: number | null
      store_name?: string | null
      notes?: string | null
    }
  ): Promise<{ data: InventoryItem }> => {
    return api.post(`/inventory-items/${id}/purchases`, data)
  },

  getStores: async (): Promise<{ data: string[] }> => {
    return api.get('/inventory-items/stores')
  },

  // Stock Sharing
  getStockShareStatus: async (): Promise<StockShareStatus> => {
    return api.get('/stock-shares/status')
  },
}
