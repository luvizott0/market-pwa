export interface ShoppingItem {
  id: string
  inventory_item_id?: number
  name: string
  brand?: string | null
  category_name?: string | null
  category_color?: string | null
  quantity: number
  unit: string
  estimated_price: number
  actual_price?: number | null
  is_checked: boolean
  notes?: string | null
  added_at: string
}

export interface ShoppingTripSummary {
  total_items: number
  checked_items: number
  pending_items: number
  estimated_total: number
  checked_total: number
}
