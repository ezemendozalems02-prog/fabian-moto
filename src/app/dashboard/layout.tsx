import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Traer perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // Contar alertas de stock bajo
  const { count: alertCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .or('stock.eq.0,stock.lte.min_stock')

  return (
    <DashboardLayoutClient
      userName={profile?.name || user.email || 'Admin'}
      alertCount={alertCount || 0}
    >
      {children}
    </DashboardLayoutClient>
  )
}
