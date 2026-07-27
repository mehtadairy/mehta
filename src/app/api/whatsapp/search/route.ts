import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json(
        { success: false, error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

    const lowerQ = q.toLowerCase();

    // Fetch all active products with minimal fields necessary for searching
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        category,
        short_description,
        tags,
        price,
        original_price,
        image,
        unit,
        stock,
        in_stock
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching search products:', error);
      return NextResponse.json(
        { success: false, error: `Database Error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching products found.' },
        { status: 404 }
      );
    }

    // Filter products in-memory to handle polymorphic types (e.g. if tags is array or string)
    // and to safely search across multiple fields without complex Postgres OR logic
    const matchedProducts = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const desc = (p.short_description || '').toLowerCase();
      
      let tagsStr = '';
      if (Array.isArray(p.tags)) {
        tagsStr = p.tags.join(' ').toLowerCase();
      } else if (typeof p.tags === 'string') {
        tagsStr = p.tags.toLowerCase();
      }

      return (
        name.includes(lowerQ) ||
        slug.includes(lowerQ) ||
        category.includes(lowerQ) ||
        desc.includes(lowerQ) ||
        tagsStr.includes(lowerQ)
      );
    });

    if (matchedProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching products found.' },
        { status: 404 }
      );
    }

    // Sort products based on strict relevance requirements
    matchedProducts.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();

      const aExact = aName === lowerQ;
      const bExact = bName === lowerQ;

      // 1. Exact match first
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(lowerQ);
      const bStarts = bName.startsWith(lowerQ);

      // 2. Starts with match second (better partial match)
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 3. Alphabetical fallback
      return aName.localeCompare(bName);
    });

    // Limit to 20 results and strip out `tags` and `short_description` as they were only needed for filtering
    const finalProducts = matchedProducts.slice(0, 20).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.price,
      original_price: p.original_price,
      image: p.image,
      unit: p.unit,
      stock: p.stock,
      in_stock: p.in_stock
    }));

    return NextResponse.json({
      success: true,
      count: finalProducts.length,
      products: finalProducts
    }, { status: 200 });

  } catch (error: any) {
    console.error('WhatsApp Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
