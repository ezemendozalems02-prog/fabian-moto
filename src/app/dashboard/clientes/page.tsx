'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Users, Plus, Search, Edit, Trash2, X, Loader2, Phone, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Customer } from '@/types'

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q))
  }, [customers, search])

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditing(customer)
      setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '', notes: customer.notes || '' })
    } else {
      setEditing(null)
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { error } = await supabase.from('customers').update(form).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
      toast.success('Cliente actualizado')
    } else {
      const { error } = await supabase.from('customers').insert(form)
      if (error) { toast.error('Error al crear el cliente'); setSaving(false); return }
      toast.success('Cliente creado')
    }
    setSaving(false)
    setShowModal(false)
    fetchCustomers()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al cliente "${name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast.error('No se puede eliminar, tiene ventas asociadas'); return }
    setCustomers(prev => prev.filter(c => c.id !== id))
    toast.success('Cliente eliminado')
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{customers.length} clientes registrados</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="card flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card hover:border-[#333] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-400 font-bold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(c)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-white font-semibold">{c.name}</h3>
              {c.phone && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Phone className="w-3 h-3 text-neutral-500" />
                  <span className="text-neutral-400 text-xs">{c.phone}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-neutral-500" />
                  <span className="text-neutral-500 text-xs">{c.address}</span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[#252525]">
                <p className="text-neutral-600 text-xs">Desde: {formatDate(c.created_at)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-600 card">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-neutral-500">Sin clientes</p>
              <button onClick={() => openModal()} className="btn-primary mt-4"><Plus className="w-4 h-4" />Agregar cliente</button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="label">Nombre completo <span className="text-red-500">*</span></label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Nombre y apellido" required /></div>
              <div><label className="label">Teléfono</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="Ej: 11 1234-5678" /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="correo@ejemplo.com" /></div>
              <div><label className="label">Dirección</label><input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" placeholder="Calle y número" /></div>
              <div><label className="label">Observaciones</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input min-h-[60px] resize-none" placeholder="Notas internas..." /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : (editing ? 'Actualizar' : 'Crear cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
