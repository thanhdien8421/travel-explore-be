import { Prisma } from "@prisma/client";
import axios from "axios";
import { prisma } from "../lib/prisma.js";

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
    streetAddress?: string;
    ward: string;
    district?: string;
    provinceCity?: string;
    locationDescription?: string;
    latitude?: number;
    longitude?: number;
    coverImageUrl?: string;
    openingHours?: string;
    priceInfo?: string;
    contactInfo?: string;
    tipsNotes?: string;
    isFeatured?: boolean;
    categoryIds?: string[];
}

/**
 * Helper function to generate full_address_generated from address parts
 */
const generateFullAddress = (
    streetAddress?: string | null,
    ward?: string,
    district?: string | null,
    provinceCity?: string,
    locationDescription?: string | null
): string => {
    const parts = [];

    // Prioritize locationDescription if streetAddress is not available
    if (streetAddress) {
        parts.push(streetAddress);
    } else if (locationDescription) {
        parts.push(locationDescription);
    }

    if (ward) parts.push(ward);
    if (district) parts.push(district);
    if (provinceCity) parts.push(provinceCity);

    return parts.filter(Boolean).join(', ');
};

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
    const {
        name,
        streetAddress,
        ward,
        district,
        provinceCity = "TP. Hồ Chí Minh",
        locationDescription,
        categoryIds = [],
        ...restOfData
    } = data;

    const slug = generateSlug(name);

    // Use provided coordinates if available, otherwise geocode
    let latitude: number | null = data.latitude ?? null;
    let longitude: number | null = data.longitude ?? null;

    // Only geocode if coordinates are not provided
    if (latitude === null || longitude === null) {
        try {
            // Build search query: prioritize streetAddress or locationDescription
            const searchQuery = streetAddress || locationDescription || name;
            const encodedAddress = encodeURIComponent(`${searchQuery}, ${ward}, ${provinceCity}`);
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
            }
        } catch (error) {
            console.error("Error fetching from OpenStreetMap Nominatim API:", error);
        }
    }

    // Generate full_address_generated
    const fullAddressGenerated = generateFullAddress(
        streetAddress,
        ward,
        district,
        provinceCity,
        locationDescription
    );

    const newPlace = await prisma.place.create({
        data: {
            ...restOfData,
            name,
            slug,
            streetAddress: streetAddress || null,
            ward,
            district: district || null,
            provinceCity,
            locationDescription: locationDescription || null,
            fullAddressGenerated,
            latitude: latitude ? new Prisma.Decimal(latitude) : null,
            longitude: longitude ? new Prisma.Decimal(longitude) : null,
            // Add categories if provided
            ...(categoryIds.length > 0 && {
                categories: {
                    create: categoryIds.map(categoryId => ({
                        category: {
                            connect: { id: categoryId }
                        }
                    }))
                }
            }),
        },
    });

    return newPlace;
};

interface UpdatePlaceInput {
    name?: string;
    description?: string;
    streetAddress?: string;
    ward?: string;
    district?: string;
    provinceCity?: string;
    locationDescription?: string;
    latitude?: number;
    longitude?: number;
    coverImageUrl?: string;
    openingHours?: string;
    priceInfo?: string;
    contactInfo?: string;
    tipsNotes?: string;
    isFeatured?: boolean;
    categoryIds?: string[];
}

export const updatePlace = async (id: string, data: UpdatePlaceInput) => {
    const updateData: any = {};

    // Only update fields that are provided
    if (data.name) {
        updateData.name = data.name;
        updateData.slug = generateSlug(data.name);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.streetAddress !== undefined) updateData.streetAddress = data.streetAddress || null;
    if (data.ward !== undefined) updateData.ward = data.ward;
    if (data.district !== undefined) updateData.district = data.district || null;
    if (data.provinceCity !== undefined) updateData.provinceCity = data.provinceCity;
    if (data.locationDescription !== undefined) updateData.locationDescription = data.locationDescription || null;
    if (data.openingHours !== undefined) updateData.openingHours = data.openingHours;
    if (data.priceInfo !== undefined) updateData.priceInfo = data.priceInfo;
    if (data.contactInfo !== undefined) updateData.contactInfo = data.contactInfo;
    if (data.tipsNotes !== undefined) updateData.tipsNotes = data.tipsNotes;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;

    // Update coordinates
    if (data.latitude !== undefined) {
        updateData.latitude = data.latitude ? new Prisma.Decimal(data.latitude) : null;
    }
    if (data.longitude !== undefined) {
        updateData.longitude = data.longitude ? new Prisma.Decimal(data.longitude) : null;
    }

    // Regenerate full_address_generated if any address field changed
    if (
        data.streetAddress !== undefined ||
        data.ward !== undefined ||
        data.district !== undefined ||
        data.provinceCity !== undefined ||
        data.locationDescription !== undefined
    ) {
        // Get current place to get unchanged fields
        const currentPlace = await prisma.place.findUnique({ where: { id } });
        if (currentPlace) {
            updateData.fullAddressGenerated = generateFullAddress(
                updateData.streetAddress ?? currentPlace.streetAddress,
                updateData.ward ?? currentPlace.ward,
                updateData.district ?? currentPlace.district,
                updateData.provinceCity ?? currentPlace.provinceCity,
                updateData.locationDescription ?? currentPlace.locationDescription
            );
        }
    }

    // Handle categories update
    if (data.categoryIds !== undefined) {
        // Delete all existing category associations
        await prisma.placeCategory.deleteMany({
            where: { placeId: id }
        });

        // Create new associations
        if (data.categoryIds.length > 0) {
            updateData.categories = {
                create: data.categoryIds.map(categoryId => ({
                    category: {
                        connect: { id: categoryId }
                    }
                }))
            };
        }
    }

    const updatedPlace = await prisma.place.update({
        where: { id },
        data: updateData,
    });

    return updatedPlace;
};

export const deletePlace = async (id: string) => {
    // Soft delete: just set isActive to false
    const deletedPlace = await prisma.place.update({
        where: { id },
        data: { isActive: false },
    });

    return deletedPlace;
};
