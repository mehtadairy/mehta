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

export const CATEGORIES: Category[] = [];
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
