import type { SupabaseClient } from '@supabase/supabase-js';
export declare const isSupabaseConfigured: () => boolean;
export declare const getSupabaseClient: () => SupabaseClient;
export declare const STORAGE_BUCKET: string;
/**
 * Convert a filename to full Supabase public URL
 */
export declare const getImageUrl: (filename: string | null) => string | null;
/**
 * Upload an image buffer to Supabase Storage
 */
export declare const uploadImageToSupabase: (imageBuffer: Buffer, filename: string, contentType?: string) => Promise<string>;
/**
 * Download an image from a URL
 */
export declare const downloadImageFromUrl: (url: string) => Promise<Buffer>;
//# sourceMappingURL=supabase.d.ts.map