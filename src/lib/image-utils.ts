/**
 * Supabase Image Transformation Utility
 *
 * Converts Supabase Storage `object/public` URLs into `render/image/public` URLs
 * which serve WebP at the requested width and quality via Supabase's built-in CDN.
 *
 * Usage:
 *   import { img, BLUR_PLACEHOLDER } from '@/lib/image-utils';
 *
 *   <img src={img.thumbnail(product.images[0])} loading="lazy" />
 *   <img src={img.card(product.images[0])} loading="lazy" />
 *   <img src={img.detail(product.images[0])} priority />
 *   <img src={img.banner(banner.image_url)} priority />
 */

const SUPABASE_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_RENDER_PATH = '/storage/v1/render/image/public/';

const FALLBACK_IMAGE = '/assorted_sweets_1781172431124.png';

/**
 * Core transformer — converts a Supabase Storage URL to an optimized render URL.
 * Non-Supabase URLs (Unsplash, external CDNs) are returned unchanged.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  width: number = 400,
  quality: number = 80,
  height?: number
): string {
  if (!src) return FALLBACK_IMAGE;

  const cleanSrc = src.trim();

  if (cleanSrc.includes('.supabase.co' + SUPABASE_OBJECT_PATH)) {
    const renderUrl = cleanSrc.replace(SUPABASE_OBJECT_PATH, SUPABASE_RENDER_PATH);
    const url = new URL(renderUrl);
    url.searchParams.set('width', String(width));
    if (height) {
      url.searchParams.set('height', String(height));
      url.searchParams.set('resize', 'contain');
    }
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('format', 'webp');
    return url.toString();
  }

  return cleanSrc;
}

// ─── Named presets matching the target sizes from the brief ─────────────────

/** Product thumbnail in lists, carts, order history — target <40 KB */
export const img = {
  thumbnail: (src?: string | null) => getOptimizedImageUrl(src, 200, 70),
  /** Product card in shop grid — target 80–120 KB */
  card: (src?: string | null) => getOptimizedImageUrl(src, 400, 80),
  /** Product detail hero image — target 120–180 KB */
  detail: (src?: string | null) => getOptimizedImageUrl(src, 800, 85),
  /** Homepage banner images — target 150–250 KB */
  banner: (src?: string | null) => getOptimizedImageUrl(src, 1200, 85),
  /** Admin preview (full-res for editing context) */
  admin: (src?: string | null) => getOptimizedImageUrl(src, 600, 85),
};

/**
 * Generates a srcset string for responsive images served from Supabase CDN.
 * Use in combination with `sizes` attribute on <img> or next/image.
 *
 * @example
 * <img
 *   src={img.card(product.images[0])}
 *   srcSet={getImageSrcSet(product.images[0])}
 *   sizes="(max-width: 640px) 200px, (max-width: 1024px) 400px, 600px"
 * />
 */
export function getImageSrcSet(
  src: string | undefined | null,
  widths: number[] = [200, 400, 600, 800],
  quality = 80
): string {
  if (!src) return '';
  return widths
    .map(w => `${getOptimizedImageUrl(src, w, quality)} ${w}w`)
    .join(', ');
}

/**
 * Blur data URL placeholder for smooth layout loading (CLS prevention).
 * Use as `blurDataURL` in next/image or as a CSS background before the image loads.
 */
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNFQUUwRDMiLz48L3N2Zz4=';
