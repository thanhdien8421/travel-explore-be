import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!url && 
         url !== 'your_supabase_url_here' &&
         url.startsWith('http') &&
         !!key && 
         key !== 'your_supabase_anon_key_here';
};

// Lazy client creation - only create when Supabase is configured
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  }
  
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseClient;
};

// Storage bucket name
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'images';

/**
 * Convert a filename to full Supabase public URL
 */
export const getImageUrl = (filename: string | null): string | null => {
  if (!filename) return null;
  
  // If it's already a full URL, return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

/**
 * Upload an image buffer to Supabase Storage
 */
export const uploadImageToSupabase = async (
  imageBuffer: Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<string> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, imageBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  return data.path; // Return the filename/path
};

/**
 * Download an image from a URL
 */
export const downloadImageFromUrl = async (url: string): Promise<Buffer> => {
  // Add proper headers to avoid being blocked by Wikipedia and other sites
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.wikipedia.org/'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
