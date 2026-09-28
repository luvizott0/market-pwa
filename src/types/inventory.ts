export interface StockCategory {
  id: number
  workspace_id?: number
  name: string
  color_hex: string
  icon?: string | null
  is_active: boolean
  items_count?: number
  created_at?: string
}

export interface InventoryPurchase {
  id: number
  workspace_id: number
  inventory_item_id: number
  purchased_at: string
  quantity: number
  unit_price: number
  total_price: number
  duration_days?: number | null
  store_name?: string | null
  notes?: string | null
  created_at?: string
}

export type InventoryItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'

export interface InventoryItem {
  id: number
  workspace_id?: number
  stock_category_id?: number | null
  category?: StockCategory | null
  name: string
  brand?: string | null
  quantity: number
  unit: string
  min_quantity?: number | null
  last_price?: number | null
  average_price?: number | null
  expiration_date?: string | null
  duration_days?: number | null
  last_purchased_at?: string | null
  is_regular_expense: boolean
  notes?: string | null
  status: InventoryItemStatus
  days_until_expiration?: number | null
  estimated_monthly_cost?: number | null
  purchases?: InventoryPurchase[]
  created_at?: string
  updated_at?: string
}

export interface InventorySummary {
  total_items: number
  low_stock_count: number
  expired_count: number
  expiring_soon_count: number
  total_estimated_value: number
}

export interface InventoryMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  summary: InventorySummary
}

export interface InventoryResponse {
  data: InventoryItem[]
  meta: InventoryMeta
}

export interface StockMember {
  id: number
  name: string
  email: string
  is_owner: boolean
}

export interface StockShareStatus {
  is_shared: boolean
  is_owner: boolean
  owner: {
    id?: number
    name?: string
    email?: string
  }
  members: StockMember[]
  pending_invitation: {
    token: string
    expires_at: string
    created_at: string
  } | null
  items_count: number
}
