import type { PlaceSummary, PlaceDetail } from "../types/place.types.js";
export declare const getFeaturedPlaces: (limit?: number) => Promise<PlaceSummary[]>;
export declare const getAllPlaces: (limit?: number) => Promise<PlaceSummary[]>;
/**
 * Lấy chi tiết một địa điểm theo slug
 */
export declare const getPlaceBySlug: (slug: string) => Promise<PlaceDetail | null>;
//# sourceMappingURL=placeService.d.ts.map