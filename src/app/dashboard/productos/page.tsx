import { createClient } from '@/lib/supabase/server'
import { ProductosClient } from '@/components/products/ProductosClient'

export default async function ProductosPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('name'),
  ])

  return <ProductosClient products={products || []} categories={categories || []} />
}
