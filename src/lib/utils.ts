import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { StockStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: es })
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy HH:mm")
}

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return 'out'
  if (stock <= minStock) return 'low'
  return 'ok'
}

export function stockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    ok: 'En stock',
    low: 'Stock bajo',
    out: 'Sin stock',
  }
  return labels[status]
}

export function stockStatusColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    ok: 'text-green-400 bg-green-400/10',
    low: 'text-yellow-400 bg-yellow-400/10',
    out: 'text-red-400 bg-red-400/10',
  }
  return colors[status]
}

export function movementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ingreso: 'Ingreso',
    egreso: 'Egreso',
    ajuste: 'Ajuste',
    venta: 'Venta',
    devolucion: 'Devolución',
    correccion: 'Corrección',
    compra: 'Compra',
  }
  return labels[type] || type
}

export function movementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    ingreso: 'text-green-400 bg-green-400/10',
    egreso: 'text-red-400 bg-red-400/10',
    ajuste: 'text-blue-400 bg-blue-400/10',
    venta: 'text-orange-400 bg-orange-400/10',
    devolucion: 'text-purple-400 bg-purple-400/10',
    correccion: 'text-yellow-400 bg-yellow-400/10',
    compra: 'text-emerald-400 bg-emerald-400/10',
  }
  return colors[type] || 'text-gray-400 bg-gray-400/10'
}

export function saleStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    entregada: 'Entregada',
    cancelada: 'Cancelada',
  }
  return labels[status] || status
}

export function saleStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendiente: 'text-yellow-400 bg-yellow-400/10',
    confirmada: 'text-blue-400 bg-blue-400/10',
    entregada: 'text-green-400 bg-green-400/10',
    cancelada: 'text-red-400 bg-red-400/10',
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    debito: 'Débito',
    credito: 'Crédito',
    mixto: 'Mixto',
    mercadopago: 'Mercado Pago',
  }
  return labels[method] || method
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateSKU(name: string, id?: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
  const suffix = id ? id.slice(-4).toUpperCase() : Math.random().toString(36).slice(-4).toUpperCase()
  return `${prefix}-${suffix}`
}
