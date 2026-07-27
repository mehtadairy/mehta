import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // Start building the query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        category,
        short_description,
        price,
        original_price,
        image,
        stock,
        in_stock,
        unit
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: `Database Error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No products found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products
    }, { status: 200 });

  } catch (error: any) {
    console.error('WhatsApp Products API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
