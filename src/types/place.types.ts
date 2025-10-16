export interface PlaceSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  district: string | null;
  cover_image_url: string | null;
}

export interface PlaceDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address_text?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image_url?: string | null;
  opening_hours?: string | null;
  price_info?: string | null;
  contact_info?: string | null;
  tips_notes?: string | null;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  images: {
    id: string;
    image_url: string | null;
    caption?: string | null;
  }[];
}
