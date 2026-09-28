export interface ShoppingItem {
  id: number | string
  workspace_id?: number
  inventory_item_id?: number | null
  is_custom_item?: boolean
  stock_category_id?: number | null
  name: string
  brand?: string | null
  category_name?: string | null
  category_color?: string | null
  quantity: number
  unit: string
  min_quantity?: number | null
  estimated_price: number
  actual_price?: number | null
  expiration_date?: string | null
  is_checked: boolean
  notes?: string | null
  added_at?: string
  created_at?: string
  updated_at?: string
}

export interface ShoppingTripSummary {
  total_items: number
  checked_items: number
  pending_items: number
  estimated_total: number
  checked_total: number
}
