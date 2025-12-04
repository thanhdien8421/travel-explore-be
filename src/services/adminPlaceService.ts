import { Prisma, PlaceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import axios from "axios";
import { prisma } from "../lib/prisma.js";
import { generatePlaceSummary } from "./aiService.js";

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
    createdById?: string;
    isAdmin?: boolean;
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

interface GetAdminPlacesFilter {
    search?: string;
    category?: string;
    ward?: string;
    status?: PlaceStatus;
    sortBy?: "name" | "createdAt" | "featured";
    sortOrder?: "asc" | "desc";
    limit?: number;
    page?: number;
}

export const getAdminPlaces = async (
    filters: GetAdminPlacesFilter = {}
): Promise<{
    data: Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        district: string | null;
        ward: string;
        coverImageUrl: string | null;
        isFeatured: boolean;
        isActive: boolean;
        status: string;
        averageRating: Decimal;
        categories: Array<{ categoryId: string; category: { id: string; name: string } }>;
        createdAt: Date;
        createdBy?: { id: string; fullName: string | null; email: string } | null;
        images?: Array<{ id: string; image_url: string; is_cover: boolean }>;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    console.time('getAdminPlaces-total');
    const {
        search,
        category,
        ward,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
        limit = 10,
        page = 1,
    } = filters;

    // Build where clause
    const where: Prisma.PlaceWhereInput = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (ward) {
        where.ward = { equals: ward, mode: "insensitive" };
    }

    if (category) {
        where.categories = {
            some: {
                categoryId: category,
            },
        };
    }

    // Filter by status (PENDING, APPROVED, REJECTED)
    if (status) {
        where.status = status;
    }

    // Build orderBy
    let orderBy: Prisma.PlaceOrderByWithRelationInput = {};
    if (sortBy === "name") {
        orderBy = { name: sortOrder };
    } else if (sortBy === "featured") {
        orderBy = { isFeatured: sortOrder };
    } else {
        orderBy = { createdAt: sortOrder };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    console.time('getAdminPlaces-count');
    const total = await prisma.place.count({ where });
    console.timeEnd('getAdminPlaces-count');

    // Get places
    console.time('getAdminPlaces-findMany');
    const places = await prisma.place.findMany({
        where,
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            district: true,
            ward: true,
            coverImageUrl: true,
            isFeatured: true,
            isActive: true,
            status: true,
            averageRating: true,
            categories: {
                select: {
                    categoryId: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            images: {
                select: {
                    id: true,
                    imageUrl: true,
                    isCover: true,
                },
                orderBy: { createdAt: 'desc' as const },
            },
            createdAt: true,
            createdBy: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy,
        skip,
        take: limit,
    });
    console.timeEnd('getAdminPlaces-findMany');

    console.timeEnd('getAdminPlaces-total');

    // Transform response to snake_case for consistency with frontend
    const transformedPlaces = places.map((place) => ({
        ...place,
        images: place.images?.map((img) => ({
            id: img.id,
            image_url: img.imageUrl,
            is_cover: img.isCover,
        })),
    }));

    return {
        data: transformedPlaces,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
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
        createdById,
        isAdmin = false,
        ...restOfData
    } = data;

    const slug = generateSlug(name);

    // Status: APPROVED if admin, PENDING if regular user
    const status: PlaceStatus = isAdmin ? PlaceStatus.APPROVED : PlaceStatus.PENDING;

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
            status: status,
            createdById: createdById || null,
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
    isActive?: boolean;
    categoryIds?: string[];
}

export const updatePlace = async (id: string, data: UpdatePlaceInput) => {
    const updateData: Prisma.PlaceUpdateInput = {};

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
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

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
            const streetAddressValue = typeof updateData.streetAddress === 'string' ? updateData.streetAddress : (updateData.streetAddress === null ? null : currentPlace.streetAddress);
            const wardValue = typeof updateData.ward === 'string' ? updateData.ward : currentPlace.ward;
            const districtValue = typeof updateData.district === 'string' ? updateData.district : (updateData.district === null ? null : currentPlace.district);
            const provinceCityValue = typeof updateData.provinceCity === 'string' ? updateData.provinceCity : currentPlace.provinceCity;
            const locationDescriptionValue = typeof updateData.locationDescription === 'string' ? updateData.locationDescription : (updateData.locationDescription === null ? null : currentPlace.locationDescription);
            
            updateData.fullAddressGenerated = generateFullAddress(
                streetAddressValue,
                wardValue,
                districtValue,
                provinceCityValue,
                locationDescriptionValue
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

/**
 * Delete a place - soft or hard delete
 * Soft delete: Sets isActive to false (default)
 * Hard delete: Permanently removes from database
 */
export const deletePlace = async (id: string, permanent: boolean = false) => {
    if (permanent) {
        // Hard delete - permanently remove
        await prisma.place.delete({
            where: { id },
        });
        return null;
    } else {
        // Soft delete: just set isActive to false
        const deletedPlace = await prisma.place.update({
            where: { id },
            data: { isActive: false },
        });
        return deletedPlace;
    }
};

/**
 * Restore a soft-deleted place
 */
export const restorePlace = async (id: string) => {
    const place = await prisma.place.update({
        where: { id },
        data: { isActive: true },
    });
    return place;
};

/**
 * Approve a pending place
 */
export const approvePlace = async (id: string) => {
    const place = await prisma.place.update({
        where: { id },
        data: { status: PlaceStatus.APPROVED },
    });
    return place;
};

/**
 * Reject a pending place
 */
export const rejectPlace = async (id: string) => {
    const place = await prisma.place.update({
        where: { id },
        data: { status: PlaceStatus.REJECTED },
    });
    return place;
};

/**
 * Get pending places count (for admin dashboard)
 */
export const getPendingPlacesCount = async (): Promise<number> => {
    return prisma.place.count({
        where: { status: PlaceStatus.PENDING },
    });
};

export const generateAndSaveSummary = async (placeId: string) => {
    // 1. Get place and its reviews
    const place = await prisma.place.findUnique({
        where: { id: placeId },
        include: {
            reviews: {
                select: {
                    comment: true,
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50 // Limit to last 50 reviews to match AI service limit
            }
        }
    });

    if (!place) {
        throw new Error("Place not found");
    }

    // 2. Extract comments
    const comments = place.reviews
        .map(r => r.comment)
        .filter((c): c is string => c !== null && c !== undefined && c.trim() !== "");

    // 3. Generate summary
    const summary = await generatePlaceSummary(comments);

    // 4. Save summary to database
    const updatedPlace = await prisma.place.update({
        where: { id: placeId },
        data: { summary }
    });

    return updatedPlace;
};