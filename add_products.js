const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback to anon if service role not set
);

const productsToInsert = [
  {
    name: 'Surati Ghari',
    slug: 'surati-ghari',
    category: 'ghee-sweets',
    description: 'Authentic Surati Ghari made with pure ghee, premium pistachios, and rich mawa.',
    price: 850,
    images: ['/prod_ghari_1781172844424.png'],
    stock: 50,
    popular: true,
    festival_special: true,
    prices: { '500g': 425, '1kg': 850 }
  },
  {
    name: 'Kaju Katli',
    slug: 'kaju-katli',
    category: 'milk-sweets',
    description: 'Premium cashew fudge with silver varq (vark). Made from hand-picked cashews.',
    price: 1100,
    images: ['/prod_kaju_katli_1781172877393.png'],
    stock: 100,
    popular: true,
    festival_special: false,
    prices: { '250g': 275, '500g': 550, '1kg': 1100 }
  },
  {
    name: 'Premium Mix Sweets',
    slug: 'premium-mix-sweets',
    category: 'milk-sweets',
    description: 'A delicate assortment of milk-based sweets including pedas, barfis, and rolls.',
    price: 900,
    images: ['/prod_mix_sweet_1781172828788.png'],
    stock: 30,
    popular: true,
    festival_special: false,
    prices: { '500g': 450, '1kg': 900 }
  },
  {
    name: 'Special Mixture Farsan',
    slug: 'special-mixture-farsan',
    category: 'farsan',
    description: 'A crunchy, chat-patta mix of sev, boondi, and fried nuts.',
    price: 350,
    images: ['/prod_mixture_1781172861017.png'],
    stock: 150,
    popular: false,
    festival_special: false,
    prices: { '250g': 90, '500g': 175, '1kg': 350 }
  },
  {
    name: 'Mix Sweet Rolls',
    slug: 'mix-sweet-rolls',
    category: 'milk-sweets',
    description: 'Delicious anjeer, pista, and kaju sweet rolls.',
    price: 1200,
    images: ['/mix_sweet_rolls_1781172915749.png'],
    stock: 25,
    popular: true,
    festival_special: true,
    prices: { '500g': 600, '1kg': 1200 }
  },
  {
    name: 'Thandai Milkshake Mix',
    slug: 'thandai-milkshake-mix',
    category: 'beverages',
    description: 'Rich Thandai powder with saffron, cardamom, and premium nuts.',
    price: 500,
    images: ['/milkshake_mix_1781172899700.png'],
    stock: 80,
    popular: false,
    festival_special: true,
    prices: { '250g': 150, '500g': 250, '1kg': 500 }
  },
  {
    name: 'Dry Fruit Kachori',
    slug: 'dry-fruit-kachori',
    category: 'farsan',
    description: 'Crispy bite-sized kachoris stuffed with sweet and spicy dry fruits.',
    price: 450,
    images: ['/dry_fruit_kachori_1781172416985.png'],
    stock: 60,
    popular: true,
    festival_special: false,
    prices: { '250g': 115, '500g': 225, '1kg': 450 }
  },
  {
    name: 'Bhavnagari Ganthia',
    slug: 'bhavnagari-ganthia',
    category: 'farsan',
    description: 'Authentic Gujarati thick namkeen ganthia made with besan and spices.',
    price: 320,
    images: ['/namkeen_ganthia_1781172443622.png'],
    stock: 200,
    popular: false,
    festival_special: false,
    prices: { '500g': 160, '1kg': 320 }
  },
  {
    name: 'Assorted Sweets Platter',
    slug: 'assorted-sweets-platter',
    category: 'hampers',
    description: 'A luxurious assortment of premium sweets for any special occasion.',
    price: 1500,
    images: ['/assorted_sweets_1781172431124.png'],
    stock: 20,
    popular: true,
    festival_special: true,
    prices: { '1 Box': 1500 }
  },
  {
    name: 'Premium Gift Combo',
    slug: 'premium-gift-combo',
    category_id: 'hampers',
    description: 'An elegant gift hamper featuring sweets and premium dry fruits.',
    price: 2500,
    images: ['/gift_combo_1781172458512.png'],
    stock: 15,
    popular: true,
    festival_special: true,
    prices: { '1 Box': 2500 }
  }
];

async function seed() {
  console.log("Seeding products...");
  
  // RLS policies might prevent anon from inserting. Let's try inserting via API or check if anon has permissions
  // For the sake of the script, we will insert them into the DB.
  // Because we don't have SERVICE_ROLE_KEY handy, we'll try to insert anyway.
  
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
