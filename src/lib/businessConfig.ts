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
    full: "Taleti Rd, Navagadh, Jeshar, Palitana, Gujarat 364270",
    street: "Taleti Rd, Navagadh, Jeshar",
    city: "Palitana",
    state: "Gujarat",
    pincode: "364270",
    country: "India",
  },

  // Google Maps
  googleMapsUrl: "https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Jeshar,+Palitana,+Gujarat+364270",
  googleMapsShareUrl: "https://share.google/5x2FPvCFeEAeFtI3N",
  googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118944.37520021966!2d71.74818987158223!3d21.51268686561168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3958bcda7611ffc1%3A0x643dc52f85bd8648!2sMehta%20Dairy!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",

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
      address: "Taleti Rd, Navagadh, Jeshar, Palitana, Gujarat 364270",
      shortAddress: "Navagadh, Palitana, Gujarat",
      phone: "+91 99132 52232",
      pickupTime: "10:00 AM – 9:00 PM Daily",
      mapsUrl: "https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Jeshar,+Palitana,+Gujarat+364270",
      coords: { lat: 21.5126, lng: 71.8315 },
    },
    taleti: {
      name: "Taleti Road Branch",
      label: "Taleti Road Branch",
      address: "Taleti Rd, Navagadh, Jeshar, Palitana, Gujarat 364270",
      shortAddress: "Taleti Rd, Palitana, Gujarat",
      phone: "+91 99132 52232",
      pickupTime: "10:00 AM – 9:00 PM Daily",
      mapsUrl: "https://maps.google.com/?q=Taleti+Rd,+Navagadh,+Jeshar,+Palitana,+Gujarat+364270",
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
  invoiceFooter: "Mehta Dairy & Sweet Mart\nTaleti Rd, Navagadh, Jeshar, Palitana, Gujarat 364270\n+91 99132 52232",

  // Razorpay display name
  razorpayName: "Mehta Dairy & Sweet Mart",
  razorpayDescription: "Premium Sweets Transaction",
} as const;
