'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Plus, Search, Edit, Trash2, X, Loader2, Phone, Mail, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Supplier } from '@/types'

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', brand: '', notes: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const fetchSuppliers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSuppliers() }, [])

  const filtered = useMemo(() => {
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || (s.brand || '').toLowerCase().includes(q))
  }, [suppliers, search])

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditing(supplier)
      setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '', brand: supplier.brand || '', notes: supplier.notes || '', is_active: supplier.is_active })
    } else {
      setEditing(null)
      setForm({ name: '', phone: '', email: '', address: '', brand: '', notes: '', is_active: true })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('suppliers').update(form).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
      toast.success('Proveedor actualizado')
    } else {
      const { error } = await supabase.from('suppliers').insert(form)
      if (error) { toast.error('Error al crear'); setSaving(false); return }
      toast.success('Proveedor creado')
    }
    setSaving(false)
    setShowModal(false)
    fetchSuppliers()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al proveedor "${name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) { toast.error('No se puede eliminar, tiene compras asociadas'); return }
    setSuppliers(prev => prev.filter(s => s.id !== id))
    toast.success('Proveedor eliminado')
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">{suppliers.length} proveedores registrados</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </button>
      </div>

      <div className="card flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Buscar por nombre o marca..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className={`card hover:border-[#333] transition-all group ${!s.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-sm">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(s)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-white font-semibold">{s.name}</h3>
              {s.brand && <p className="text-red-400 text-xs font-medium mt-0.5">{s.brand}</p>}
              {s.phone && (
                <div className="flex items-center gap-1.5 mt-2"><Phone className="w-3 h-3 text-neutral-500" /><span className="text-neutral-400 text-xs">{s.phone}</span></div>
              )}
              {s.email && (
                <div className="flex items-center gap-1.5 mt-1"><Mail className="w-3 h-3 text-neutral-500" /><span className="text-neutral-500 text-xs">{s.email}</span></div>
              )}
              {s.notes && <p className="text-neutral-600 text-xs mt-2">{s.notes}</p>}
              <div className="mt-3 pt-3 border-t border-[#252525]">
                <span className={`text-xs font-medium ${s.is_active ? 'text-green-400' : 'text-neutral-500'}`}>
                  {s.is_active ? '● Activo' : '● Inactivo'}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-600 card">
              <Building2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-neutral-500">Sin proveedores</p>
              <button onClick={() => openModal()} className="btn-primary mt-4"><Plus className="w-4 h-4" />Agregar proveedor</button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="label">Nombre <span className="text-red-500">*</span></label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Nombre del proveedor" required /></div>
              <div><label className="label">Marca / Rubro</label><input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="input" placeholder="Ej: Honda, Yamaha, Multimark..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Teléfono</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
                <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></div>
              </div>
              <div><label className="label">Dirección</label><input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" /></div>
              <div><label className="label">Observaciones</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input min-h-[60px] resize-none" /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${form.is_active ? 'bg-red-600' : 'bg-[#333]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-neutral-400 text-sm">Proveedor activo</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : (editing ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
