const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const newProducts = [
  { name: 'Kesar Penda', priceKg: 840 },
  { name: 'White Penda (Malai Penda)', priceKg: 800 },
  { name: 'Brown Penda (Paka Penda)', priceKg: 840 },
  { name: 'Mithomavo (Thabadi)', priceKg: 840 },
  { name: 'Gulab Halvo', priceKg: 860 },
  { name: 'Kesar Barfi', priceKg: 820 },
  { name: 'Cadburi Roll', priceKg: 840 },
  { name: 'Coconut Sweet (Toparapak)', priceKg: 760 },
  { name: 'White Kalakand', priceKg: 800 },
  { name: 'Kaju Katri', priceKg: 980 }
];

const productsToInsert = newProducts.map(p => {
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    name: p.name,
    slug: slug,
    category_slug: 'milk-sweets',
    description: `Premium ${p.name} made from pure milk. Authentic heritage recipe.`,
    images: ['/mix_sweet_rolls_1781172915749.png'],
    stock: 50,
    popular: true,
    festival_special: false,
    rating: 5,
    reviews_count: 0,
    prices: { '500g': p.priceKg / 2, '1kg': p.priceKg }
  };
});

async function seed() {
  console.log("Seeding new pure milk products...");
  
  const { data, error } = await supabase
    .from('products')
    .upsert(productsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error("Error inserting products:", error);
  } else {
    console.log(`Successfully added ${data.length} products!`);
  }
}

seed();
