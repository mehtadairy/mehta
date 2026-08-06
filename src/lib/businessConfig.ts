/**
 * ═══════════════════════════════════════════════════════════════
 * CENTRALIZED BUSINESS CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * All business details are defined here. Every page, component,
 * email template, and invoice pulls from this single source.
 * 
 * To update any business info, change it ONLY here.
 * ═══════════════════════════════════════════════════════════════
 */

export const BUSINESS = {
  name: "Mehta Dairy & Sweet Mart",
  shortName: "Mehta Dairy",
  tagline: "Since 1972",
  foundedYear: 1972,
  
  // Primary contact
  phone: "+91 99132 52232",
  phoneRaw: "919913252232",       // For tel: and wa.me links (no spaces/dashes)
  phoneTel: "+919913252232",      // For tel: href
  email: "support@mehtadairy.com",
  
  // Main address
  address: {
    full: "Taleti Rd, Navagadh, Palitana, Gujarat 364270",
    street: "Taleti Rd, Navagadh",
    city: "Palitana",
    state: "Gujarat",
    pincode: "364270",
    country: "India",
  },

  // Google Maps
  googleMapsUrl: "https://maps.app.goo.gl/Q2rW2t8pqS1QxZucA",
  googleMapsShareUrl: "https://maps.app.goo.gl/Q2rW2t8pqS1QxZucA",
  googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d237545.60169829684!2d71.51726099453124!3d21.521424000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be20691efb7b001%3A0x543151aaecae06!2sMEHTA%20SWEET%20MART!5e0!3m2!1sen!2sin!4v1786034276113!5m2!1sen!2sin",

  // WhatsApp
  whatsappUrl: (message?: string) =>
    `https://wa.me/919913252232${message ? `?text=${encodeURIComponent(message)}` : ""}`,

  // Store hours
  storeHours: "Daily: 9:00 AM – 10:00 PM IST",
  openHour: 9,
  closeHour: 22,

  // Branches / Pickup Locations
  branches: {
    navagadh: {
      name: "Navagadh Main Branch",
      label: "Navagadh Main Branch (Since 1972)",
      address: "Taleti Rd, Navagadh, Palitana, Gujarat 364270",
      shortAddress: "Navagadh, Palitana, Gujarat",
      phone: "+91 99132 52232",
      mapsUrl: "https://share.google/vDvLY4bVoKkqdhoQu",
      googleMapsUrl: "https://share.google/vDvLY4bVoKkqdhoQu",
      coords: { lat: 21.5126, lng: 71.8315 },
    },
    taleti: {
      name: "Taleti Road Branch",
      label: "Taleti Road Branch",
      address: "Taleti Rd, Navagadh, Palitana, Gujarat 364270",
      shortAddress: "Taleti Rd, Palitana, Gujarat",
      phone: "+91 99132 52232",
      mapsUrl: "https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Palitana,+Gujarat+364270",
      googleMapsUrl: "https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Palitana,+Gujarat+364270",
      coords: { lat: 21.5175, lng: 71.8290 },
    },
  },

  // SEO / Meta
  seo: {
    title: "Mehta Dairy & Sweet Mart | Premium Sweets, Farsan, Namkeen & Gift Boxes",
    description: "Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, crispy farsan, and premium gift boxes from Mehta Dairy & Sweet Mart since 1972.",
    siteName: "Mehta Dairy & Sweet Mart",
  },

  // Invoice / Email footer
  invoiceFooter: "Mehta Dairy & Sweet Mart\nTaleti Rd, Navagadh, Palitana, Gujarat 364270\n+91 99132 52232",

  // Razorpay display name
  razorpayName: "Mehta Dairy & Sweet Mart",
  razorpayDescription: "Premium Sweets Transaction",
} as const;
