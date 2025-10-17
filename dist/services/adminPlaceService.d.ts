import { Prisma } from "@prisma/client";
interface CreatePlaceInput {
    name: string;
    description?: string;
    addressText: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    coverImageUrl?: string;
    openingHours?: string;
    priceInfo?: string;
    contactInfo?: string;
    tipsNotes?: string;
    isFeatured?: boolean;
}
export declare const getAdminPlaces: () => Promise<{
    id: string;
    name: string;
    district: string | null;
}[]>;
export declare const createPlace: (data: CreatePlaceInput) => Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    addressText: string | null;
    district: string | null;
    city: string;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    coverImageUrl: string | null;
    openingHours: string | null;
    priceInfo: string | null;
    contactInfo: string | null;
    tipsNotes: string | null;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export {};
//# sourceMappingURL=adminPlaceService.d.ts.map