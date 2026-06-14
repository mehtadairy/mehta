import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mehtadairy.com'

  const { data: products } = await supabase.from('products').select('id, updated_at');
  
  const productEntries = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(product.updated_at || Date.now()),
    changeFrequency: 'weekly' as any,
    priority: 0.8,
  }))

  const { data: categories } = await supabase.from('categories').select('slug, updated_at');
  
  const categoryEntries = (categories || []).map((cat) => ({
    url: `${baseUrl}/shop?category=${cat.slug}`,
    lastModified: new Date(cat.updated_at || Date.now()),
    changeFrequency: 'weekly' as any,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productEntries,
    ...categoryEntries,
  ]
}
