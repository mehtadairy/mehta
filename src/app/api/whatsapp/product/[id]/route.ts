import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Safely unwrap params for Next.js 15+ compatibility
    const params = await context.params;
    const id = params.id;

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Start building the query for a single active product
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        category,
        description,
        short_description,
        image,
        gallery_images,
        price,
        original_price,
        stock,
        in_stock,
        unit,
        sku,
        weight,
        tags
      `)
      .eq('is_active', true);

    // Filter by either slug (if provided) or ID
    if (slug) {
      query = query.eq('slug', slug);
    } else if (id && id !== 'undefined' && id !== 'find') {
      query = query.eq('id', id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Product ID or slug is required' },
        { status: 400 }
      );
    }

    const { data: product, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching product details:', error);
      return NextResponse.json(
        { success: false, error: `Database Error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    }, { status: 200 });

  } catch (error: any) {
    console.error('WhatsApp Product Details API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
