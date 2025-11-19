export interface PlaceSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  average_rating: number;
}

export interface PlaceDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address_text?: string | null;
  street_address?: string | null;
  ward?: string | null;
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
  average_rating: number;
  visited?: boolean;
  created_at: Date;
  updated_at: Date;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  images: {
    id: string;
    image_url: string | null;
    caption?: string | null;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: Date;
    user: {
      full_name: string;
    };
  }[];
}
