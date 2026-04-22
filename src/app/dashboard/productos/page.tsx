export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'

import { ProductosClient } from '@/components/products/ProductosClient'

export default async function ProductosPage() {
  const supabase = await createClient()

  const [{ data: products, error: pError }, { data: categories, error: cError }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('name'),
  ])

  if (pError) console.error('Error fetching products:', pError)
  if (cError) console.error('Error fetching categories:', cError)
  
  console.log(`[Products Page] Fetched ${products?.length || 0} products`)

  return <ProductosClient products={products || []} categories={categories || []} />
}
