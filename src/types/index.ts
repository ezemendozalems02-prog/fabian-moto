export type UserRole = 'admin' | 'vendedor' | 'empleado'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  subcategories?: Category[]
  product_count?: number
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  category_id: string
  subcategory_id?: string
  brand?: string
  compatible_model?: string
  short_description?: string
  description?: string
  cost_price: number
  sale_price: number
  promo_price?: number
  stock: number
  min_stock: number
  unit: string
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  image_url?: string
  technical_notes?: string
  location?: string
  created_at: string
  updated_at: string
  category?: Category
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type StockMovementType =
  | 'ingreso'
  | 'egreso'
  | 'ajuste'
  | 'venta'
  | 'devolucion'
  | 'correccion'
  | 'compra'

export interface StockMovement {
  id: string
  product_id: string
  type: StockMovementType
  quantity: number
  stock_before: number
  stock_after: number
  reference_id?: string
  reference_type?: string
  notes?: string
  user_id: string
  created_at: string
  product?: Product
  user?: User
}

export type SaleStatus = 'pendiente' | 'confirmada' | 'entregada' | 'cancelada'
export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'debito'
  | 'credito'
  | 'mixto'
  | 'mercadopago'

export interface Sale {
  id: string
  sale_number: string
  customer_id?: string
  status: SaleStatus
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
  customer?: Customer
  items?: SaleItem[]
  user?: User
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
  sales?: Sale[]
  total_purchases?: number
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  brand?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  purchase_number: string
  supplier_id?: string
  total_cost: number
  notes?: string
  user_id: string
  created_at: string
  supplier?: Supplier
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
  subtotal: number
  product?: Product
}

export interface Settings {
  id: string
  business_name: string
  phone?: string
  address?: string
  email?: string
  logo_url?: string
  whatsapp?: string
  tax_id?: string
  currency: string
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_products: number
  total_stock_units: number
  low_stock_products: number
  out_of_stock_products: number
  today_sales: number
  today_revenue: number
  month_sales: number
  month_revenue: number
}

export type StockStatus = 'ok' | 'low' | 'out'

export interface ProductWithStockStatus extends Product {
  stock_status: StockStatus
}

export interface Alert {
  id: string
  product_id: string
  type: 'low_stock' | 'out_of_stock'
  is_read: boolean
  created_at: string
  product?: Product
}
