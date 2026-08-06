/**
 * GA4 (Google Analytics 4) Production Utility & Event Helper
 * Measurement ID: G-XDFRXBK5HN
 */

export const GA_MEASUREMENT_ID = 'G-XDFRXBK5HN';

// Check if GA is loaded and available
export const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
};

// Generic Event Sender
export const trackEvent = (action: string, params: Record<string, any> = {}): void => {
  if (isGAAvailable()) {
    const isDev = process.env.NODE_ENV !== 'production';
    (window as any).gtag('event', action, {
      ...params,
      ...(isDev ? { debug_mode: true } : {}),
    });
  }
};

// Page View Event
export const trackPageView = (url: string, title?: string): void => {
  trackEvent('page_view', {
    page_location: url,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
  });
};

// GA4 Ecommerce Interfaces
export interface GA4Item {
  item_id: string;
  item_name: string;
  currency?: string;
  item_category?: string;
  item_category2?: string;
  price?: number;
  quantity?: number;
  discount?: number;
  item_variant?: string;
}

export interface GA4EcommerceEvent {
  currency?: string;
  value?: number;
  coupon?: string;
  shipping?: number;
  tax?: number;
  transaction_id?: string;
  items: GA4Item[];
}

// GA4 Standard Ecommerce Events
export const trackViewItemList = (listName: string, items: GA4Item[]): void => {
  trackEvent('view_item_list', { item_list_name: listName, items });
};

export const trackSelectItem = (listName: string, item: GA4Item): void => {
  trackEvent('select_item', { item_list_name: listName, items: [item] });
};

export const trackViewItem = (item: GA4Item, value?: number): void => {
  trackEvent('view_item', {
    currency: item.currency || 'INR',
    value: value ?? item.price ?? 0,
    items: [item],
  });
};

export const trackAddToCart = (item: GA4Item, value?: number): void => {
  trackEvent('add_to_cart', {
    currency: item.currency || 'INR',
    value: value ?? ((item.price ?? 0) * (item.quantity ?? 1)),
    items: [item],
  });
};

export const trackRemoveFromCart = (item: GA4Item, value?: number): void => {
  trackEvent('remove_from_cart', {
    currency: item.currency || 'INR',
    value: value ?? ((item.price ?? 0) * (item.quantity ?? 1)),
    items: [item],
  });
};

export const trackViewCart = (data: GA4EcommerceEvent): void => {
  trackEvent('view_cart', {
    currency: data.currency || 'INR',
    value: data.value || 0,
    items: data.items,
  });
};

export const trackBeginCheckout = (data: GA4EcommerceEvent): void => {
  trackEvent('begin_checkout', {
    currency: data.currency || 'INR',
    value: data.value || 0,
    coupon: data.coupon || '',
    items: data.items,
  });
};

export const trackAddShippingInfo = (data: GA4EcommerceEvent, shippingTier = 'Standard Shipping'): void => {
  trackEvent('add_shipping_info', {
    currency: data.currency || 'INR',
    value: data.value || 0,
    shipping_tier: shippingTier,
    items: data.items,
  });
};

export const trackAddPaymentInfo = (data: GA4EcommerceEvent, paymentType = 'Razorpay'): void => {
  trackEvent('add_payment_info', {
    currency: data.currency || 'INR',
    value: data.value || 0,
    payment_type: paymentType,
    items: data.items,
  });
};

export const trackPurchase = (data: GA4EcommerceEvent): void => {
  trackEvent('purchase', {
    transaction_id: data.transaction_id,
    currency: data.currency || 'INR',
    value: data.value || 0,
    tax: data.tax || 0,
    shipping: data.shipping || 0,
    coupon: data.coupon || '',
    items: data.items,
  });
};

export const trackRefund = (transactionId: string, value?: number, items?: GA4Item[]): void => {
  trackEvent('refund', {
    transaction_id: transactionId,
    currency: 'INR',
    value: value || 0,
    items: items || [],
  });
};

// Custom Engagement & Auth Events
export const trackLogin = (method = 'otp'): void => {
  trackEvent('login', { method });
};

export const trackSignUp = (method = 'otp'): void => {
  trackEvent('sign_up', { method });
};

export const trackOtpVerified = (type: 'login' | 'signup'): void => {
  trackEvent('otp_verified', { auth_type: type });
};

export const trackWishlistAdd = (item: GA4Item): void => {
  trackEvent('add_to_wishlist', {
    currency: item.currency || 'INR',
    value: item.price || 0,
    items: [item],
  });
};

export const trackWishlistRemove = (item: GA4Item): void => {
  trackEvent('remove_from_wishlist', {
    currency: item.currency || 'INR',
    value: item.price || 0,
    items: [item],
  });
};

export const trackSearch = (searchTerm: string): void => {
  trackEvent('search', { search_term: searchTerm });
};

export const trackProductFilter = (category: string, filterName: string): void => {
  trackEvent('product_filter', { category, filter_name: filterName });
};

export const trackLanguageChange = (language: string): void => {
  trackEvent('language_change', { language });
};

export const trackContactFormSubmit = (): void => {
  trackEvent('contact_form_submit');
};

export const trackNewsletterSubscribe = (): void => {
  trackEvent('newsletter_subscribe');
};

export const trackWhatsAppClick = (source: string): void => {
  trackEvent('whatsapp_click', { click_source: source });
};

export const trackPhoneCallClick = (source: string): void => {
  trackEvent('phone_call_click', { click_source: source });
};

export const trackDownloadInvoice = (invoiceNumber: string): void => {
  trackEvent('download_invoice', { invoice_number: invoiceNumber });
};

export const trackOrderAction = (action: 'track' | 'cancel' | 'reorder', orderId: string): void => {
  trackEvent(`order_${action}`, { order_id: orderId });
};
