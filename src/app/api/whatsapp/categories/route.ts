import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

type CategoryInfo = {
  name: string;
  slug: string;
  image: string;
  productCount: number;
};

export async function GET() {
  try {
    // Fetch all active products, retrieving only necessary fields to keep it highly optimized
    const { data: products, error } = await supabase
      .from('products')
      .select('category, image')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { success: false, error: `Database Error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No categories found.' },
        { status: 404 }
      );
    }

    // Aggregate products into distinct categories in-memory
    const categoryMap = new Map<string, CategoryInfo>();

    for (const product of products) {
      const catName = product.category;
      
      // Skip if category is falsy/empty
      if (!catName || typeof catName !== 'string') continue;
      
      if (categoryMap.has(catName)) {
        const catInfo = categoryMap.get(catName)!;
        catInfo.productCount += 1;
        // Assign the first valid image encountered as the category cover image
        if (!catInfo.image && product.image) {
          catInfo.image = product.image;
        }
      } else {
        // Generate a URL-friendly slug
        const slug = catName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        categoryMap.set(catName, {
          name: catName,
          slug,
          image: product.image || '',
          productCount: 1
        });
      }
    }

    // Convert to array and sort alphabetically by category name
    const categories = Array.from(categoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No categories found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories
    }, { status: 200 });

  } catch (error: any) {
    console.error('WhatsApp Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
