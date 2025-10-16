import { PrismaClient, Prisma } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
};

interface CreatePlaceInput {
    name: string;
    description?: string;
    addressText: string;
    district?: string;
    city?: string;
    latitude?: number;  // Optional - if provided, skip geocoding
    longitude?: number;  // Optional - if provided, skip geocoding
    coverImageUrl?: string;
    openingHours?: string;
    priceInfo?: string;
    contactInfo?: string;
    tipsNotes?: string;
    isFeatured?: boolean;
}

export const getAdminPlaces = async () => {
    return prisma.place.findMany({
        select: {
            id: true,
            name: true,
            district: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const createPlace = async (data: CreatePlaceInput) => {
    const { name, addressText, ...restOfData } = data;

    const slug = generateSlug(name);

    // Use provided coordinates if available, otherwise geocode the address
    let latitude: number | null = data.latitude ?? null;
    let longitude: number | null = data.longitude ?? null;
    let district: string | null = data.district || null;

    // Only geocode if coordinates are not provided
    if (latitude === null || longitude === null) {
        try {
            const encodedAddress = encodeURIComponent(addressText);
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1`;

            const response = await axios.get(nominatimUrl, {
                headers: {
                    "User-Agent": "TravelExploreApp/1.0 (contact@travelexplore.com)",
                },
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                latitude = parseFloat(result.lat);
                longitude = parseFloat(result.lon);

                if (!district && result.address) {
                    district =
                        result.address.city_district ||
                        result.address.suburb ||
                        result.address.county ||
                        null;
                }
            }
        } catch (error) {
            console.error("Error fetching from OpenStreetMap Nominatim API:", error);
        }
    } else {
        console.log(`Using provided coordinates: lat=${latitude}, lng=${longitude}`);
    }

    const newPlace = await prisma.place.create({
        data: {
            ...restOfData,
            name,
            slug,
            addressText,
            latitude: latitude ? new Prisma.Decimal(latitude) : null,
            longitude: longitude ? new Prisma.Decimal(longitude) : null,
            district,
        },
    });

    return newPlace;
};
