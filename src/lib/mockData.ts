export interface Product {
  id: string;
  name: string;
  category: string; // matches Category.id
  description: string;
  images: string[];
  prices: { [weight: string]: number }; // e.g. { "250g": 180, "500g": 360, "1kg": 720 }
  popular: boolean;
  festivalSpecial: boolean;
  rating: number;
  reviewsCount: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string; // Lucide icon name
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  description: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  weight: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharge: number;
  total: number;
  shippingAddress: Address;
  paymentMethod: 'Razorpay' | 'WhatsApp' | 'COD';
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentId?: string;
  userName: string;
  userPhone: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  savedAddresses: Address[];
}

// --- STATIC CATEGORIES ---
export const CATEGORIES: Category[] = [
  { id: 'traditional', name: 'Traditional Sweets', description: 'Timeless classics made with pure ghee and milk khoya', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', icon: 'Award' },
  { id: 'dryfruit', name: 'Dry Fruit Sweets', description: 'Rich, luxurious bites crafted with premium cashews, almonds, and figs', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80', icon: 'Sparkles' },
  { id: 'bengali', name: 'Bengali Sweets', description: 'Soft, spongy chhena delicacies dipped in aromatic syrup', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80', icon: 'Heart' },
  { id: 'farsan', name: 'Premium Farsan', description: 'Freshly fried hot Gujarati snacks for tea-time cravings', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80', icon: 'Flame' },
  { id: 'namkeen', name: 'Crispy Namkeen', description: 'Savory, crunchy elements spiced with authentic spice blends', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80', icon: 'Smile' },
  { id: 'gifts', name: 'Gift Boxes & Hampers', description: 'Luxurious gift arrangements ideal for family and corporate events', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80', icon: 'Gift' },
  { id: 'specials', name: 'Festival Specials', description: 'Exclusive traditional recipes crafted only during celebrations', image: 'https://images.unsplash.com/photo-1605884812678-831e7c5b161c?w=600&auto=format&fit=crop&q=80', icon: 'CalendarDays' }
];

// --- 50+ STATIC PRODUCTS ---
const INITIAL_PRODUCTS: Product[] = [
  // --- SWEET OF PURE MILK ---
  {
    id: 't6',
    name: 'Kesar Penda (No Artificial Colour & Flavour)',
    category: 'traditional',
    popular: true,
    festivalSpecial: true,
    rating: 4.8,
    reviewsCount: 110,
    stock: 120,
    description: 'Delectable traditional milk peda made from thickened milk solids (khoya), flavored with genuine saffron threads and cardamom.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 210, '500g': 420, '1kg': 840 }
  },
  {
    id: 't3',
    name: 'White Penda (Malai Penda)',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 78,
    stock: 95,
    description: 'Soft, creamy white peda crafted with rich fresh malai and condensed milk solids, offering a melt-in-the-mouth texture.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 200, '500g': 400, '1kg': 800 }
  },
  {
    id: 't4',
    name: 'Brown Penda (Paka Penda)',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 65,
    stock: 100,
    description: 'Caramelized milk solids penda with a deeper brown color, rich roasted flavor, and spiced with a pinch of fresh cardamom.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 210, '500g': 420, '1kg': 840 }
  },
  {
    id: 't5',
    name: 'Mithomavo (Thabadi)',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 54,
    stock: 110,
    description: 'Authentic Kathiyawadi Thabdi Peda made from caramelized grainy milk solids. Sweet, rich, and highly aromatic.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 210, '500g': 420, '1kg': 840 }
  },
  {
    id: 't7',
    name: 'Gulab Halvo',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 42,
    stock: 85,
    description: 'Specialty sweet milk halwa cooked with real rose petals, rose water, and pure ghee for a royal fragrant dessert.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 215, '500g': 430, '1kg': 860 }
  },
  {
    id: 't8',
    name: 'Kesar Barfi',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 49,
    stock: 90,
    description: 'Square-cut rich fudge blocks made of pure milk solids, infused with premium saffron threads and cardamoms.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 205, '500g': 410, '1kg': 820 }
  },
  {
    id: 't9',
    name: 'Cadburi Roll',
    category: 'traditional',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 132,
    stock: 150,
    description: 'Delicious double-layered sweet roll consisting of rich chocolate cocoa fudge on the inside and sweet mawa on the outside.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 210, '500g': 420, '1kg': 840 }
  },
  {
    id: 't10',
    name: 'Coconut Sweet (Toparapak)',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 71,
    stock: 115,
    description: 'Delicious traditional coconut fudge square made with freshly grated coconut, milk, sugar, and hints of cardamom.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 190, '500g': 380, '1kg': 760 }
  },
  {
    id: 't11',
    name: 'White Kalakand',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 88,
    stock: 100,
    description: 'Grainy, moist traditional milk cake prepared by reducing milk and cottage cheese, sweetened mildly.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 200, '500g': 400, '1kg': 800 }
  },
  {
    id: 't1',
    name: 'Kaju Katri',
    category: 'traditional',
    popular: true,
    festivalSpecial: true,
    rating: 4.9,
    reviewsCount: 245,
    stock: 200,
    description: 'Our signature melt-in-your-mouth cashew fudge diamond shapes, prepared using premium cashews and pure sugar, garnished with traditional silver leaf.',
    images: ['/prod_kaju_katli_1781172877393.png'],
    prices: { '250g': 245, '500g': 490, '1kg': 980 }
  },

  // --- SWEET OF PURE GHEE ---
  {
    id: 't2',
    name: 'Motichur Ladu',
    category: 'traditional',
    popular: true,
    festivalSpecial: true,
    rating: 4.9,
    reviewsCount: 210,
    stock: 180,
    description: 'Fine pearls of gram flour fried in pure cow ghee, sweetened with syrup, and shaped into delicious laddoos with dry fruits.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 140, '500g': 280, '1kg': 560 }
  },
  {
    id: 't12',
    name: 'Bundi Ladu',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 94,
    stock: 140,
    description: 'Classic round chickpea flour bundi laddoos fried in pure cow ghee and infused with cardamom and saffron flavor.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 115, '500g': 230, '1kg': 460 }
  },
  {
    id: 't13',
    name: 'Maisur (Mesub)',
    category: 'traditional',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 154,
    stock: 120,
    description: 'Porous, rich and crispy honeycomb sweet made of slow-roasted gram flour, sugar, and generous amounts of pure cow ghee.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 190, '500g': 380, '1kg': 760 }
  },
  {
    id: 't14',
    name: 'Sata (Devda, Thor, Balushahi)',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 68,
    stock: 110,
    description: 'Flaky, deep-fried layered sweet pastry soaked in rich sugar syrup, cardamom, and garnished with pistachios.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 130, '500g': 260, '1kg': 520 }
  },
  {
    id: 't15',
    name: 'Magas',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 85,
    stock: 130,
    description: 'Traditional Gujarati sweet made from coarsely ground chickpea flour cooked in pure cow ghee, sugar, and cardamom.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 130, '500g': 260, '1kg': 520 }
  },
  {
    id: 't16',
    name: 'Mohanthal',
    category: 'traditional',
    popular: true,
    festivalSpecial: true,
    rating: 4.8,
    reviewsCount: 176,
    stock: 140,
    description: 'Fudge-like dessert made of gram flour, milk, and ghee, generously flavored with saffron, cardamom, and sliced almonds.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 130, '500g': 260, '1kg': 520 }
  },
  {
    id: 't17',
    name: 'Gulab Jambu',
    category: 'traditional',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 112,
    stock: 160,
    description: 'Soft, golden-fried milk solid balls soaked in sweet rose and cardamom flavored sugar syrup.',
    images: ['/prod_mix_sweet_1781172828788.png'],
    prices: { '250g': 135, '500g': 270, '1kg': 540 }
  },

  // --- TASTY & CHAT-PATTA FARSAN ---
  {
    id: 'n3',
    name: 'Sp. Dry Bhel',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 92,
    stock: 180,
    description: 'Crunchy dry mix of puffed rice, savory sev, peanuts, papadi, and our unique chat-patta spice blend.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n1',
    name: 'Gathiya',
    category: 'namkeen',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 189,
    stock: 250,
    description: 'Crispy, soft-textured gram flour snack sticks spiced lightly with carom seeds (ajwain) and black pepper.',
    images: ['/namkeen_ganthia_1781172443622.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n4',
    name: 'Makhniya',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 54,
    stock: 130,
    description: 'Delicate, butter-soft gram flour melt-in-your-mouth crisps seasoned with dynamic local spices.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n2',
    name: 'Mari Jada Gathiya',
    category: 'namkeen',
    popular: true,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 142,
    stock: 200,
    description: 'Thick-cut, crunchy gram flour sticks spiced heavily with crushed whole black pepper (mari) and sea salt.',
    images: ['/namkeen_ganthia_1781172443622.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n5',
    name: 'Papadi',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 85,
    stock: 220,
    description: 'Crispy, flat gram flour ribbons seasoned with carom seeds. Perfect pairing with fresh papaya sambharo and fried green chilies.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n6',
    name: 'Sp. Wheat Khakhra',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 79,
    stock: 150,
    description: 'Crispy, hand-roasted flatbreads made of whole wheat flour, spiced with local turmeric, chili, and oil.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n7',
    name: 'Banana Chevdo',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 61,
    stock: 140,
    description: 'Sweet and savory mixture containing crispy banana sticks, raisins, cashew halves, and red chili flakes.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 110, '500g': 220, '1kg': 440 }
  },
  {
    id: 'n8',
    name: 'Banana Wafer',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 75,
    stock: 190,
    description: 'Thinly sliced crispy raw banana wafers fried in clean oil and sprinkled with black pepper and rock salt.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n9',
    name: 'Soya Stik',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.4,
    reviewsCount: 68,
    stock: 160,
    description: 'Crispy, protein-rich sticks made from soya flour and loaded with spicy, chat-patta masala seasoning.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n10',
    name: 'Masala Mag',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 41,
    stock: 120,
    description: 'Crispy, dry-roasted whole mung beans seasoned with local red chili, dry mango powder, and black salt.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n11',
    name: 'Dabela Mag',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.3,
    reviewsCount: 33,
    stock: 130,
    description: 'Slightly pressed, crispy fried mung beans containing clean, mild salt and black pepper seasoning.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n12',
    name: 'Dabela Chana (Chana Jorgaram)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 95,
    stock: 170,
    description: 'Traditional pressed black gram chickpeas fried crispy and tossed in a tangy chat-patta spice blend.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n13',
    name: 'Khajali',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 77,
    stock: 110,
    description: 'Classic flaky, layered wheat pastry fried crispy, available in sweet or salty flavor profiles.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n14',
    name: 'Farsi Puri',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 114,
    stock: 200,
    description: 'Crisp, flaky circular dynamic flour crackers flavored with carom seeds and whole black pepper.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n15',
    name: 'Masala Puri',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 82,
    stock: 190,
    description: 'Crispy deep-fried flour crackers seasoned with local red chilies, turmeric, cumin, and dry mango.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n16',
    name: 'Chat Puri',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 91,
    stock: 220,
    description: 'Bite-sized crispy pooris, ideal for preparing custom home chaat or dahi poori snacks.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n17',
    name: 'Papad Chevdo',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.4,
    reviewsCount: 52,
    stock: 150,
    description: 'Unique teatime mixture combining crushed roasted papad, puffed rice, sev, and local spices.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n18',
    name: 'Mix Chavanu',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 125,
    stock: 260,
    description: 'A traditional spicy Gujarati mixture consisting of sev, gathia, boondi, peanuts, and lentil flakes.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'f5',
    name: 'Dry Kachori (Dryfruit Kachori)',
    category: 'namkeen',
    popular: true,
    festivalSpecial: true,
    rating: 4.9,
    reviewsCount: 198,
    stock: 140,
    description: 'Deep-fried golden pastry balls stuffed with a rich, spicy, and sweet mixture of crushed cashews, almonds, raisins, and aromatic spices. Long shelf life.',
    images: ['/dry_fruit_kachori_1781172416985.png'],
    prices: { '250g': 110, '500g': 220, '1kg': 440 }
  },
  {
    id: 'n19',
    name: 'Dry Bhakharvadi',
    category: 'namkeen',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 165,
    stock: 180,
    description: 'Spiraled crunchy pinwheel biscuits stuffed with a complex sweet, tangy, and spicy coconut-poppy seed masala.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n20',
    name: 'Wheat Puff (Wheat Chevdo)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.4,
    reviewsCount: 47,
    stock: 130,
    description: 'Healthy diet snack made of roasted puffed wheat grains, tossed with light turmeric, salt, and curry leaves.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n21',
    name: 'Spicy Sev',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 83,
    stock: 240,
    description: 'Crispy gram flour noodles flavored with high heat red pepper, clove powder, and garlic essence.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n22',
    name: 'Sev Mamri (Sev Pakodi)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 99,
    stock: 210,
    description: 'Crunchy combination of crispy puffed rice (mamra) and thin gram flour sev, seasoned with turmeric.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n23',
    name: 'Sev Mamra (Khata-Mitha)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 74,
    stock: 230,
    description: 'A sweet-and-sour crunchy mix of puffed rice and sev, finished with roasted peanuts and lemon acid.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 70, '500g': 140, '1kg': 280 }
  },
  {
    id: 'n24',
    name: 'Tamtam (Khata-Mitha Gathiya)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 81,
    stock: 170,
    description: 'Sweet and tangy chickpea flour gathia rings seasoned with chat-patta masala and citric acid.',
    images: ['/namkeen_ganthia_1781172443622.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n25',
    name: 'Time Pass (Lakdiya Spicy Gathiya)',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 112,
    stock: 200,
    description: 'Extremely popular long, wood-shaped gathia sticks loaded with hot red chilies and carom seeds.',
    images: ['/namkeen_ganthia_1781172443622.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n26',
    name: 'Fulvadi',
    category: 'namkeen',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 135,
    stock: 160,
    description: 'Crispy cylindrical gram flour logs spiced with whole black pepper, coriander seeds, and sesame.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n27',
    name: 'Shing Bhujiya',
    category: 'namkeen',
    popular: true,
    festivalSpecial: false,
    rating: 4.8,
    reviewsCount: 162,
    stock: 250,
    description: 'Crunchy peanuts coated in a heavily spiced gram flour batter and fried to ultimate crispness.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n28',
    name: 'Sweet Chevdo',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 63,
    stock: 140,
    description: 'Mild, sweet mixture of crispy gram flour strands, raisins, and roasted sweet cashew nuts.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 100, '500g': 200, '1kg': 400 }
  },
  {
    id: 'n29',
    name: 'Spicy Chevdo',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 92,
    stock: 180,
    description: 'Classic crunchy, spicy mixture loaded with chilies, turmeric, curry leaves, and gram flour sev.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n30',
    name: 'Sakkarpara',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 78,
    stock: 150,
    description: 'Traditional bite-sized diamond cuts of fried flour dough sweetened with organic sugar syrup.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n31',
    name: "Choco's Cube",
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.4,
    reviewsCount: 39,
    stock: 110,
    description: 'Bite-sized premium sweet chocolate square chips, perfect sweet treatment for children.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 75, '500g': 150, '1kg': 300 }
  },
  {
    id: 'n32',
    name: 'Chanadal',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.5,
    reviewsCount: 81,
    stock: 200,
    description: 'Fried split Bengal gram (chana dal) seasoned with dynamic chili powder, dry mango, and black salt.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 80, '500g': 160, '1kg': 320 }
  },
  {
    id: 'n33',
    name: 'Magdal',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.6,
    reviewsCount: 67,
    stock: 130,
    description: 'Fried split yellow mung lentils, lightly salted and extremely crispy. A delicious high-protein snack.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  },
  {
    id: 'n34',
    name: 'Dalmuth',
    category: 'namkeen',
    popular: false,
    festivalSpecial: false,
    rating: 4.7,
    reviewsCount: 88,
    stock: 150,
    description: 'Traditional crisp fried brown lentils mixed with tiny gram flour sev and seasoned with black pepper.',
    images: ['/prod_mixture_1781172861017.png'],
    prices: { '250g': 90, '500g': 180, '1kg': 360 }
  }
];

const INITIAL_COUPONS: Coupon[] = [
  { code: 'WELCOME50', discountType: 'fixed', value: 50, minOrderValue: 300, description: 'Get flat ₹50 off on your first order above ₹300' },
  { code: 'FESTIVE15', discountType: 'percentage', value: 15, minOrderValue: 1000, description: 'Get 15% off on orders above ₹1000' },
  { code: 'MEHTASWEET', discountType: 'percentage', value: 10, minOrderValue: 500, description: 'Get 10% off on your sweet orders above ₹500' }
];

const INITIAL_REVIEWS: Review[] = [
  { id: 'r1', productId: 't1', userName: 'Rajesh Sharma', rating: 5, comment: 'The Kaju Katri was extremely fresh and melted in my mouth. Standard packaging was outstanding.', date: '2026-05-15' },
  { id: 'r2', productId: 't1', userName: 'Amit Patel', rating: 4, comment: 'Very good flavor. Perfect level of sweetness, not too high.', date: '2026-05-20' },
  { id: 'r3', productId: 't2', userName: 'Surbhi Shah', rating: 5, comment: 'Authentic pure ghee taste. Reminded me of my childhood laddoos. Highly recommended!', date: '2026-05-18' },
  { id: 'r4', productId: 't6', userName: 'Vikram Singh', rating: 5, comment: 'Premium quality Kesar Penda. Rich saffron fragrance and taste.', date: '2026-06-01' }
];

const INITIAL_ADDRESSES: Address[] = [
  { id: 'addr1', name: 'Aarya Mehta', phone: '9876543210', street: '402, Royal Residency, SG Highway', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', isDefault: true },
  { id: 'addr2', name: 'Aarya Mehta (Office)', phone: '9876543210', street: '901, Corporate Heights, Ashram Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', isDefault: false }
];

// --- MOCK DATABASE PERSISTENCE LAYER ---
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveLocalStorageData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// --- DATA ACCESS METHODS ---
export const getProducts = (): Product[] => {
  return getLocalStorageData<Product[]>('mehta_products', INITIAL_PRODUCTS);
};

export const saveProducts = (products: Product[]) => {
  saveLocalStorageData('mehta_products', products);
};

export const getCoupons = (): Coupon[] => {
  return getLocalStorageData<Coupon[]>('mehta_coupons', INITIAL_COUPONS);
};

export const saveCoupons = (coupons: Coupon[]) => {
  saveLocalStorageData('mehta_coupons', coupons);
};

export const getReviews = (productId?: string): Review[] => {
  const reviews = getLocalStorageData<Review[]>('mehta_reviews', INITIAL_REVIEWS);
  if (productId) {
    return reviews.filter(r => r.productId === productId);
  }
  return reviews;
};

export const addReview = (review: Omit<Review, 'id' | 'date'>) => {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    date: new Date().toISOString().split('T')[0]
  };
  const updatedReviews = [newReview, ...reviews];
  saveLocalStorageData('mehta_reviews', updatedReviews);

  // Update product aggregate ratings
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === review.productId);
  if (productIndex > -1) {
    const productReviews = updatedReviews.filter(r => r.productId === review.productId);
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    products[productIndex].rating = parseFloat(avgRating.toFixed(1));
    products[productIndex].reviewsCount = productReviews.length;
    saveProducts(products);
  }
  return newReview;
};

export const getAddresses = (): Address[] => {
  return getLocalStorageData<Address[]>('mehta_addresses', INITIAL_ADDRESSES);
};

export const saveAddresses = (addresses: Address[]) => {
  saveLocalStorageData('mehta_addresses', addresses);
};

export const getOrders = (): Order[] => {
  return getLocalStorageData<Order[]>('mehta_orders', []);
};

export const saveOrders = (orders: Order[]) => {
  saveLocalStorageData('mehta_orders', orders);
};

export const addOrder = (order: Omit<Order, 'id' | 'orderNumber' | 'date'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ord-${Date.now()}`,
    orderNumber: `MSM-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split('T')[0]
  };
  const updatedOrders = [newOrder, ...orders];
  saveOrders(updatedOrders);
  return newOrder;
};

export const getProfile = (): UserProfile => {
  const defaultProfile: UserProfile = {
    name: 'Aarya Mehta',
    email: 'aarya.mehta@example.com',
    phone: '9876543210',
    savedAddresses: INITIAL_ADDRESSES
  };
  return getLocalStorageData<UserProfile>('mehta_profile', defaultProfile);
};

export const saveProfile = (profile: UserProfile) => {
  saveLocalStorageData('mehta_profile', profile);
};
