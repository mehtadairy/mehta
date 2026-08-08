export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  prices: { [weight: string]: number };
  popular: boolean;
  festivalSpecial: boolean;
  rating: number;
  reviewsCount: number;
  stock: number;
  isActive?: boolean;
  active?: boolean;
  ingredients?: string[];
  ingredientIds?: string[];
  shelfLife?: number;
  storageInstructions?: string;
  allergens?: string[];
  dietaryTags?: string[];
  highlights?: string[];
  badges?: string[];
  position?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
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
  landmark?: string;
  type?: 'Home' | 'Office' | 'Other';
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
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Preparing' | 'Ready For Pickup' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
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
  userEmail?: string;
  invoice?: any;
  createdAt?: string;
  payment_completed_at?: string;
  printed?: boolean;
  print_status?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  invoice_url?: string;
  paid_at?: string;
  paymentCompletedAt?: string;
  cancelledAt?: string;
  createdAtRaw?: string;
  schema_drift?: boolean;
  [key: string]: any;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  savedAddresses: Address[];
}

export const CATEGORY_ORDER = [
  "milk-sweets",
  "ghee-sweets",
  "farsan",
  "khakhra",
  "gulkand",
  "chikki",
  "masala",
  "chatni"
];

export function sortCategories<T extends { slug?: string; id?: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const slugA = (a.slug || a.id || "").toLowerCase();
    const slugB = (b.slug || b.id || "").toLowerCase();

    let indexA = CATEGORY_ORDER.findIndex(s => slugA === s || slugA.includes(s));
    let indexB = CATEGORY_ORDER.findIndex(s => slugB === s || slugB.includes(s));

    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;

    return indexA - indexB;
  });
}

export const CATEGORIES: Category[] = sortCategories([
  { id: 'milk-sweets', name: 'Sweets of Pure Milk', description: 'Fresh khoya and mawa delicacies', image: '', icon: '' },
  { id: 'ghee-sweets', name: 'Sweets of Pure Ghee', description: 'Timeless traditional desi ghee sweets', image: '', icon: '' },
  { id: 'farsan', name: 'Tasty & Chat-Patta Farsan', description: 'Crispy snacks and dry kachoris', image: '', icon: '' },
  { id: 'khakhra', name: 'Khakhra', description: 'Crispy whole wheat flatbreads', image: '', icon: '' },
  { id: 'gulkand', name: 'Gulkand', description: 'Rose petal jam with khadi sakar', image: '', icon: '' },
  { id: 'chikki', name: 'Chikki', description: 'Crunchy brittle sweets', image: '', icon: '' },
  { id: 'masala', name: 'Masala', description: 'Authentic Gujarati spice blends', image: '', icon: '' },
  { id: 'chatni', name: 'Chatni', description: 'Traditional chutneys and pickles', image: '', icon: '' }
]);
export const getOrders = (): Order[] => [];
export const saveOrders = (orders: Order[]) => {};
export const getCoupons = (): Coupon[] => [];
export const saveCoupons = (coupons: Coupon[]) => {};
export const getProfile = (): UserProfile => ({ name: '', email: '', phone: '', savedAddresses: [] });
export const saveProfile = (p: UserProfile) => {};
export const saveProducts = (p: Product[]) => {};
export const getProducts = (): Product[] => [];
export const getProductById = (id: string): Product | undefined => undefined;
export const getCategories = (): Category[] => [];
export const getReviews = (id: string): Review[] => [];
export const validateCoupon = (c: string): Coupon | undefined => undefined;
export const getAddresses = (): Address[] => [];
export const saveAddresses = (a: Address[]) => {};
export const addOrder = (o: Order) => {};

export const PREFERRED_WEIGHT_ORDER = ["1kg", "500g", "250g", "200g", "100g"];

export function sortWeights(weights: string[]): string[] {
  return [...weights].sort((a, b) => {
    const cleanA = a.trim().toLowerCase();
    const cleanB = b.trim().toLowerCase();
    const idxA = PREFERRED_WEIGHT_ORDER.findIndex(w => w.toLowerCase() === cleanA);
    const idxB = PREFERRED_WEIGHT_ORDER.findIndex(w => w.toLowerCase() === cleanB);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return cleanA.localeCompare(cleanB);
  });
}

export const generateSlug = (name: string) => {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};
