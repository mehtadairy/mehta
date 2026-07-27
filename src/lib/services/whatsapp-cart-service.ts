import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { createWhatsAppOrder } from './whatsapp-order-service';

export interface CartSummary {
  success: boolean;
  items: number; // total quantity of all items in cart
  subtotal: number;
}

export interface CartItemDetail {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  image: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface GetCartResult {
  success: boolean;
  items: CartItemDetail[];
  totalQuantity: number;
  subtotal: number;
}

export async function addToCart(payload: {
  phone: string;
  productId: string;
  productName: string;
  image?: string | null;
  price: number;
  quantity: number;
}): Promise<CartSummary> {
  const { phone, productId, productName, image = null, price, quantity } = payload;
  const cleanPhone = phone.replace(/\D/g, '');

  // 1. Get or create cart
  let { data: cart, error: cartError } = await supabase
    .from('whatsapp_carts')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (cartError) {
    throw new Error(`Failed to check cart: ${cartError.message}`);
  }

  let cartId: string;
  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from('whatsapp_carts')
      .insert({ phone: cleanPhone })
      .select('id')
      .single();

    if (createError || !newCart) {
      throw new Error(`Failed to create cart: ${createError?.message || 'Unknown error'}`);
    }
    cartId = newCart.id;
  } else {
    cartId = cart.id;
  }

  // 2. Check if product already exists in cart
  const { data: existingItem, error: itemError } = await supabase
    .from('whatsapp_cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();

  if (itemError) {
    throw new Error(`Failed to check cart items: ${itemError.message}`);
  }

  if (existingItem) {
    // Increase quantity and update subtotal
    const newQty = existingItem.quantity + quantity;
    const { error: updateError } = await supabase
      .from('whatsapp_cart_items')
      .update({
        quantity: newQty,
        subtotal: newQty * price
      })
      .eq('id', existingItem.id);

    if (updateError) {
      throw new Error(`Failed to update cart item: ${updateError.message}`);
    }
  } else {
    // Append new item
    const { error: insertError } = await supabase
      .from('whatsapp_cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        product_name: productName,
        image,
        price,
        quantity,
        subtotal: price * quantity
      });

    if (insertError) {
      throw new Error(`Failed to insert cart item: ${insertError.message}`);
    }
  }

  // 3. Return summary
  return getCartSummary(cartId);
}

export async function getCart(phone: string): Promise<GetCartResult> {
  const cleanPhone = phone.replace(/\D/g, '');

  const { data: cart, error: cartError } = await supabase
    .from('whatsapp_carts')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (cartError) {
    throw new Error(`Failed to fetch cart: ${cartError.message}`);
  }

  if (!cart) {
    return {
      success: true,
      items: [],
      totalQuantity: 0,
      subtotal: 0
    };
  }

  const { data: dbItems, error: itemsError } = await supabase
    .from('whatsapp_cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (itemsError || !dbItems) {
    throw new Error(`Failed to fetch cart items: ${itemsError?.message || 'Unknown error'}`);
  }

  const items: CartItemDetail[] = dbItems.map(item => ({
    id: item.id,
    cartId: item.cart_id,
    productId: item.product_id,
    productName: item.product_name,
    image: item.image,
    price: Number(item.price),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    createdAt: item.created_at
  }));

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    success: true,
    items,
    totalQuantity,
    subtotal
  };
}

export async function removeFromCart(phone: string, productId: string) {
  const cleanPhone = phone.replace(/\D/g, '');

  const { data: cart, error: cartError } = await supabase
    .from('whatsapp_carts')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (cartError) {
    throw new Error(`Failed to fetch cart: ${cartError.message}`);
  }

  if (!cart) {
    return { success: true, subtotal: 0 };
  }

  const { error: deleteError } = await supabase
    .from('whatsapp_cart_items')
    .delete()
    .eq('cart_id', cart.id)
    .eq('product_id', productId);

  if (deleteError) {
    throw new Error(`Failed to delete cart item: ${deleteError.message}`);
  }

  const summary = await getCartSummary(cart.id);
  return {
    success: true,
    subtotal: summary.subtotal
  };
}

export async function clearCart(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');

  // Deleting from whatsapp_carts will cascade delete items from whatsapp_cart_items
  const { error: deleteError } = await supabase
    .from('whatsapp_carts')
    .delete()
    .eq('phone', cleanPhone);

  if (deleteError) {
    throw new Error(`Failed to clear cart: ${deleteError.message}`);
  }

  return { success: true };
}

export async function checkoutCart(payload: {
  phone: string;
  customerName: string;
  customerAddress: string;
  customerPincode: string;
}) {
  const { phone, customerName, customerAddress, customerPincode } = payload;
  console.log("Incoming phone:", phone);
  
  const normalizedPhone = phone.replace(/\D/g, '');
  console.log("Normalized phone:", normalizedPhone);

  // 1. Get Cart
  const { data: cart, error: cartError } = await supabase
    .from('whatsapp_carts')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  console.log("Cart lookup:", cart);
  console.log("Cart error:", cartError);

  if (cartError) {
    throw new Error(`Failed to fetch cart for checkout: ${cartError.message}`);
  }

  if (!cart) {
    throw new Error('Cart not found');
  }

  const { data: dbItems, error: itemsError } = await supabase
    .from('whatsapp_cart_items')
    .select('*')
    .eq('cart_id', cart.id);

  if (itemsError || !dbItems || dbItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // 2. Call createWhatsAppOrder service
  const orderItems = dbItems.map(item => ({
    productIdOrName: item.product_id,
    quantity: item.quantity
  }));

  const result = await createWhatsAppOrder({
    customerName,
    customerMobile: normalizedPhone,
    customerAddress,
    customerPincode,
    items: orderItems
  });

  // 3. Mark the order source as 'whatsapp'
  try {
    await supabase
      .from('orders')
      .update({ source: 'whatsapp' })
      .eq('id', result.orderId);
  } catch (dbErr) {
    console.error("Exception setting order source in cart checkout:", dbErr);
  }

  // 4. Delete cart (only on success!)
  const { error: deleteCartError } = await supabase
    .from('whatsapp_carts')
    .delete()
    .eq('id', cart.id);

  if (deleteCartError) {
    console.error("Failed to delete cart after successful checkout:", deleteCartError);
  }

  return {
    orderId: result.orderId, // UUID primary key
    amount: result.amount,   // Grand total
    razorpayOrderId: result.rzpOrderId // Razorpay order ID
  };
}

async function getCartSummary(cartId: string): Promise<CartSummary> {
  const { data: items, error } = await supabase
    .from('whatsapp_cart_items')
    .select('quantity, subtotal')
    .eq('cart_id', cartId);

  if (error || !items) {
    return { success: true, items: 0, subtotal: 0 };
  }

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return {
    success: true,
    items: totalQuantity,
    subtotal
  };
}
