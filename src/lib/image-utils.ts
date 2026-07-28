/**
 * Helper to generate optimized Supabase Storage image URLs with WebP format, target width, and quality parameters.
 * If the image URL is a Supabase Storage URL, it converts it to render via the image transformation service.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  width: number = 400,
  quality: number = 80
): string {
  if (!src) return '/assorted_sweets_1781172431124.png';

  const cleanSrc = src.trim();

  // Handle Supabase storage URLs: convert `/storage/v1/object/public/` to `/storage/v1/render/image/public/`
  if (cleanSrc.includes('.supabase.co/storage/v1/object/public/')) {
    const renderUrl = cleanSrc.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    const url = new URL(renderUrl);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('format', 'webp');
    return url.toString();
  }

  return cleanSrc;
}

/**
 * Blur data URL placeholder for smooth layout loading (CLS prevention)
 */
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNFQUUwRDMiLz48L3N2Zz4=';
