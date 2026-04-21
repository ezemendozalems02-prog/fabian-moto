'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Settings, Zap, Phone, MapPin, Mail, Save,
  Loader2, Globe, FileText, Info, Link as LinkIcon
} from 'lucide-react'

interface BusinessSettings {
  id: string
  business_name: string
  phone: string
  address: string
  email: string
  logo_url: string
  whatsapp: string
  tax_id: string
  fiscal_type: string
  currency: string
  low_stock_threshold: number
  invoice_prefix: string
  next_invoice_number: number
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [form, setForm] = useState<Partial<BusinessSettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'general' | 'facturacion' | 'web' | 'sistema'>('general')

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setSettings(data)
        setForm(data)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('settings').update(form).eq('id', settings.id)
    if (error) {
      toast.error('Error al guardar la configuración')
    } else {
      toast.success('Configuración guardada correctamente')
      setSettings({ ...settings, ...form } as BusinessSettings)
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'facturacion', label: 'Facturación', icon: FileText },
    { id: 'web', label: 'Integración web', icon: Globe },
    { id: 'sistema', label: 'Sistema', icon: Info },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes generales del sistema</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><Save className="w-4 h-4" />Guardar cambios</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.id ? 'text-red-400 border-red-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-5">
          {/* Logo / Identidad */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-red-600/15 border border-red-600/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-semibold">Identidad del negocio</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre del negocio</label>
                <input type="text" value={form.business_name || ''} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="input" placeholder="Ej: Moto Repuestos Fabián" />
              </div>
              <div>
                <label className="label">URL del logo</label>
                <input type="url" value={form.logo_url || ''} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} className="input" placeholder="https://... (link a la imagen del logo)" />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="card">
            <h3 className="text-white font-semibold mb-5">Datos de contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label"><Phone className="inline w-3 h-3 mr-1" />Teléfono</label>
                <input type="tel" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="Ej: (011) 1234-5678" />
              </div>
              <div>
                <label className="label"><Phone className="inline w-3 h-3 mr-1" />WhatsApp</label>
                <input type="tel" value={form.whatsapp || ''} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="input" placeholder="Ej: 5491112345678" />
              </div>
              <div>
                <label className="label"><Mail className="inline w-3 h-3 mr-1" />Email</label>
                <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="contacto@negocio.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="label"><MapPin className="inline w-3 h-3 mr-1" />Dirección</label>
                <input type="text" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" placeholder="Dirección del local" />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'facturacion' && (
        <div className="space-y-5">
          <div className="card border-yellow-900/20">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Facturación electrónica</h3>
                <p className="text-neutral-500 text-xs mt-0.5">Esta sección está preparada para integración con AFIP / ARCA en el futuro.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">CUIT del negocio</label>
                <input type="text" value={form.tax_id || ''} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} className="input" placeholder="XX-XXXXXXXX-X" />
              </div>
              <div>
                <label className="label">Condición fiscal</label>
                <select value={form.fiscal_type || 'monotributo'} onChange={e => setForm(f => ({ ...f, fiscal_type: e.target.value }))} className="input">
                  <option value="monotributo">Monotributista</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="exento">Exento</option>
                  <option value="no_categorizado">No Categorizado</option>
                </select>
              </div>
              <div>
                <label className="label">Prefijo de comprobantes</label>
                <input type="text" value={form.invoice_prefix || 'VTA'} onChange={e => setForm(f => ({ ...f, invoice_prefix: e.target.value }))} className="input" maxLength={5} />
              </div>
              <div>
                <label className="label">Próximo número de comprobante</label>
                <input type="number" value={form.next_invoice_number || 1} onChange={e => setForm(f => ({ ...f, next_invoice_number: Number(e.target.value) }))} className="input" min="1" />
              </div>
            </div>
            <div className="mt-4 bg-yellow-900/10 border border-yellow-900/20 rounded-xl p-4">
              <p className="text-yellow-600 text-xs font-medium mb-1">⚠ Módulo en preparación</p>
              <p className="text-neutral-600 text-xs">La integración con AFIP/ARCA requiere configuración adicional de certificados digitales y puntos de venta. El sistema está estructuralmente preparado para esta integración.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'web' && (
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Integración con página web</h3>
                <p className="text-neutral-500 text-xs mt-0.5">Sincronización de productos, stock y precios con el catálogo online.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                <h4 className="text-white font-medium text-sm">Endpoints disponibles (futuro)</h4>
                {[
                  { method: 'GET', path: '/api/products', desc: 'Lista pública de productos activos con stock' },
                  { method: 'GET', path: '/api/products/:sku', desc: 'Detalle de producto por SKU' },
                  { method: 'GET', path: '/api/categories', desc: 'Árbol de categorías activas' },
                  { method: 'GET', path: '/api/stock/:id', desc: 'Stock en tiempo real de un producto' },
                ].map(ep => (
                  <div key={ep.path} className="flex items-start gap-3">
                    <span className="bg-emerald-900/30 text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5">{ep.method}</span>
                    <div>
                      <code className="text-red-400 text-xs font-mono">{ep.path}</code>
                      <p className="text-neutral-600 text-xs mt-0.5">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-900/10 border border-blue-900/20 rounded-xl p-4">
                <p className="text-blue-400 text-xs font-medium mb-1">Sincronización automática</p>
                <p className="text-neutral-600 text-xs">Cuando se actualice el stock o precio de un producto marcado como "sync web", los cambios se reflejan automáticamente en la página pública. Los productos sin stock se marcan como no disponibles.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'sistema' && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-white font-semibold mb-5">Parámetros del sistema</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Moneda</label>
                <select value={form.currency || 'ARS'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input w-auto">
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar</option>
                </select>
              </div>
              <div>
                <label className="label">Umbral de stock bajo (alerta)</label>
                <div className="flex items-center gap-3">
                  <input type="number" value={form.low_stock_threshold || 5} onChange={e => setForm(f => ({ ...f, low_stock_threshold: Number(e.target.value) }))} className="input w-24" min="1" />
                  <span className="text-neutral-500 text-sm">unidades</span>
                </div>
                <p className="text-neutral-600 text-xs mt-1">Si un producto tiene stock igual o menor a este número, se considera "stock bajo"</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-3">Información del sistema</h3>
            <div className="space-y-2">
              {[
                { label: 'Versión', value: 'v1.0.0' },
                { label: 'Base de datos', value: 'Supabase PostgreSQL' },
                { label: 'Hosting', value: 'Vercel' },
                { label: 'Framework', value: 'Next.js 15' },
                { label: 'Desarrollado por', value: 'Sistema personalizado' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-[#1f1f1f] last:border-0">
                  <span className="text-neutral-500 text-sm">{label}</span>
                  <span className="text-neutral-300 text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-red-900/20 bg-red-900/5">
            <h3 className="text-red-400 font-semibold mb-2">Zona de peligro</h3>
            <p className="text-neutral-600 text-xs mb-4">Estas acciones son irreversibles. Solo el administrador puede realizarlas.</p>
            <button className="btn-danger" disabled>
              Restablecer datos de prueba (deshabilitado en producción)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
