import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import sharp from 'sharp';

// Maximum allowed upload size (5 MB raw)
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
// Maximum output width in pixels — images wider than this are downscaled
const MAX_WIDTH_PX = 1200;
// WebP output quality (0–100)
const WEBP_QUALITY = 82;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'products';
    const filePath = formData.get('filePath') as string;

    if (!file || !filePath) {
      return NextResponse.json({ error: 'File and filePath are required' }, { status: 400 });
    }

    // Reject oversized raw uploads before processing
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // ─── Server-side compression with sharp ────────────────────────────────
    // 1. Resize to max 1200px wide (preserving aspect ratio)
    // 2. Convert to WebP format
    // 3. Strip EXIF metadata (reduces privacy risk + file size)
    // 4. Compress at quality 82 (excellent quality, ~70% smaller than JPEG original)
    let compressedBuffer: Buffer;
    let contentType = 'image/webp';

    try {
      compressedBuffer = await sharp(inputBuffer)
        .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .withMetadata({}) // strips EXIF but preserves ICC colour profile
        .toBuffer();
    } catch (sharpErr: any) {
      console.warn('[Upload] Sharp compression failed, uploading original:', sharpErr.message);
      // Fallback: upload original without compression
      compressedBuffer = inputBuffer;
      contentType = file.type || 'application/octet-stream';
    }

    const originalKB = Math.round(inputBuffer.length / 1024);
    const compressedKB = Math.round(compressedBuffer.length / 1024);
    console.log(`[Upload] Compressed ${originalKB} KB → ${compressedKB} KB (${Math.round((1 - compressedKB / originalKB) * 100)}% reduction)`);

    // Upload using service role key (bypasses RLS)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedBuffer, {
        cacheControl: '31536000', // 1-year browser cache for immutable images
        upsert: true,
        contentType,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      originalKB,
      compressedKB,
      reduction: `${Math.round((1 - compressedKB / originalKB) * 100)}%`,
    });
  } catch (err: any) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
