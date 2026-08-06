import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mehtadairy.com';

  // Dynamic Products
  const { data: products } = await supabase.from('products').select('id, updated_at');
  const productEntries = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(product.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Dynamic Categories
  const { data: categories } = await supabase.from('categories').select('slug, updated_at');
  const categoryEntries = (categories || []).map((cat) => ({
    url: `${baseUrl}/shop?category=${cat.slug}`,
    lastModified: new Date(cat.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic Blogs
  const { data: blogs } = await supabase.from('blogs').select('id, updated_at');
  const blogEntries = (blogs || []).map((blog) => ({
    url: `${baseUrl}/blogs/${blog.id}`,
    lastModified: new Date(blog.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Static Pages
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/shop`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/about`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/gallery`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/gift-boxes`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/faq`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blogs`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/policy/privacy`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/policy/terms`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/policy/refund`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/policy/payment`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/tracking`, priority: 0.6, changeFrequency: 'weekly' as const },
  ].map((page) => ({
    ...page,
    lastModified: new Date(),
  }));

  return [...staticPages, ...productEntries, ...categoryEntries, ...blogEntries];
}
