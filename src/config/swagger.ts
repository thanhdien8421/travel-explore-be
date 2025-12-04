/**
 * Swagger/OpenAPI Configuration
 * Interactive API documentation for Travel Explore Backend
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Travel Explore API",
      version: "1.0.0",
      description: "API documentation for Travel Explore - A travel location discovery platform for Ho Chi Minh City",
      contact: {
        name: "Travel Explore Team",
        email: "support@travelexplore.com",
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:8000', // Dùng biến môi trường
        description: 'Server',
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Server health check endpoints",
      },
      {
        name: "Authentication",
        description: "User authentication endpoints (register, login)",
      },
      {
        name: "Places",
        description: "Travel places discovery and information endpoints",
      },
      {
        name: "Reviews",
        description: "User reviews and ratings for places",
      },
      {
        name: "Visits",
        description: "User visit tracking endpoints",
      },
      {
        name: "Admin",
        description: "Admin endpoints for managing places (create, update, delete)",
      },
      {
        name: "Locations",
        description: "Location management endpoints",
      },
    ],
    components: {
      schemas: {
        PlaceSummary: {
          type: "object",
          required: ["id", "name", "slug", "average_rating"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Place ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              description: "Place name",
              example: "Chợ Bến Thành",
            },
            slug: {
              type: "string",
              description: "URL-friendly identifier",
              example: "cho-ben-thanh",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Place description",
              example: "Ngôi chợ lâu đời ở Sài Gòn",
            },
            ward: {
              type: "string",
              nullable: true,
              description: "Ward/Phường",
              example: "Sài Gòn",
            },
            cover_image_url: {
              type: "string",
              nullable: true,
              format: "uri",
              description: "Cover image URL",
              example: "https://example.com/images/cho-ben-thanh.jpg",
            },
            average_rating: {
              type: "number",
              format: "float",
              description: "Average rating based on all reviews",
              minimum: 0,
              maximum: 5,
              example: 4.2,
            },
          },
        },
        PlaceDetail: {
          type: "object",
          required: ["id", "name", "slug", "is_featured", "average_rating", "created_at", "updated_at", "images"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Place ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              description: "Place name",
              example: "Chợ Bến Thành",
            },
            slug: {
              type: "string",
              description: "URL-friendly identifier",
              example: "cho-ben-thanh",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Place description",
              example: "Ngôi chợ lâu đời ở Sài Gòn. Phù hợp với trải nghiệm ẩm thực địa phương và quà lưu niệm.",
            },
            address_text: {
              type: "string",
              nullable: true,
              description: "Full address",
              example: "Lê Lợi, Phường Bến Thành, Quận 1",
            },
            district: {
              type: "string",
              nullable: true,
              description: "District",
              example: "Quận 1",
            },
            city: {
              type: "string",
              nullable: true,
              description: "City",
              example: "Hồ Chí Minh",
            },
            latitude: {
              type: "number",
              format: "double",
              nullable: true,
              description: "Latitude coordinate",
              example: 10.772461,
            },
            longitude: {
              type: "number",
              format: "double",
              nullable: true,
              description: "Longitude coordinate",
              example: 106.698055,
            },
            cover_image_url: {
              type: "string",
              nullable: true,
              format: "uri",
              description: "Cover image URL",
            },
            opening_hours: {
              type: "string",
              nullable: true,
              description: "Opening hours information",
              example: "6:00 - 18:00 hàng ngày",
            },
            price_info: {
              type: "string",
              nullable: true,
              description: "Price information",
              example: "Miễn phí vào cửa",
            },
            contact_info: {
              type: "string",
              nullable: true,
              description: "Contact information",
              example: "(028) 3829 9274",
            },
            tips_notes: {
              type: "string",
              nullable: true,
              description: "Tips and notes for visitors",
              example: "Nên đi vào buổi sáng để tránh đông đúc",
            },
            is_featured: {
              type: "boolean",
              description: "Whether this is a featured place",
              example: true,
            },
            average_rating: {
              type: "number",
              format: "float",
              description: "Average rating based on all reviews",
              minimum: 0,
              maximum: 5,
              example: 4.2,
            },
            visited: {
              type: "boolean",
              nullable: true,
              description: "Whether the authenticated user has visited this place (only present if user is authenticated)",
              example: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
            images: {
              type: "array",
              description: "Place images",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                    description: "Image ID",
                  },
                  image_url: {
                    type: "string",
                    format: "uri",
                    description: "Image URL",
                  },
                  caption: {
                    type: "string",
                    nullable: true,
                    description: "Image caption",
                  },
                },
              },
            },
          },
        },
        Location: {
          type: "object",
          required: ["id", "name", "description", "location", "image", "rating"],
          properties: {
            id: {
              type: "integer",
              description: "Location ID",
              example: 1,
            },
            name: {
              type: "string",
              description: "Location name",
              example: "Chợ Bến Thành",
            },
            description: {
              type: "string",
              description: "Location description",
              example: "Ngôi chợ lâu đời ở Sài Gòn. Phù hợp với trải nghiệm ẩm thực địa phương và quà lưu niệm.",
            },
            location: {
              type: "string",
              description: "Location address",
              example: "Quận 1, TP. Hồ Chí Minh",
            },
            image: {
              type: "string",
              format: "uri",
              description: "Image URL",
              example: "/images/ben-thanh-market.jpg",
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              description: "Location rating",
              example: 4.5,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        CreateLocationDto: {
          type: "object",
          required: ["name", "description", "location", "image"],
          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 255,
              description: "Location name",
              example: "Bảo tàng Mỹ thuật",
            },
            description: {
              type: "string",
              minLength: 10,
              description: "Location description",
              example: "Bảo tàng nghệ thuật đương đại với nhiều tác phẩm nổi tiếng",
            },
            location: {
              type: "string",
              description: "Location address",
              example: "Quận 3, TP. Hồ Chí Minh",
            },
            image: {
              type: "string",
              format: "uri",
              description: "Image URL",
              example: "https://example.com/image.jpg",
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              description: "Location rating (optional, default: 5.0)",
              example: 4.2,
            },
          },
        },
        UpdateLocationDto: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 255,
              description: "Location name",
            },
            description: {
              type: "string",
              minLength: 10,
              description: "Location description",
            },
            location: {
              type: "string",
              description: "Location address",
            },
            image: {
              type: "string",
              format: "uri",
              description: "Image URL",
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              description: "Location rating",
            },
          },
        },
        Statistics: {
          type: "object",
          properties: {
            totalLocations: {
              type: "integer",
              description: "Total number of locations",
              example: 6,
            },
            averageRating: {
              type: "number",
              format: "float",
              description: "Average rating across all locations",
              example: 4.55,
            },
            highQualityLocations: {
              type: "integer",
              description: "Number of locations with rating >= 4.5",
              example: 3,
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: {
                    type: "string",
                  },
                  param: {
                    type: "string",
                  },
                  location: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 6,
            },
            totalPages: {
              type: "integer",
              example: 1,
            },
          },
        },
        User: {
          type: "object",
          required: ["id", "email", "fullName", "role", "createdAt"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            fullName: {
              type: "string",
              nullable: true,
              description: "User full name",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              description: "User role",
              example: "USER",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
          },
        },
        AuthResponse: {
          type: "object",
          required: ["user", "token"],
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            token: {
              type: "string",
              description: "JWT authentication token",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        Review: {
          type: "object",
          required: ["id", "placeId", "userId", "rating", "createdAt"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Review ID",
            },
            placeId: {
              type: "string",
              format: "uuid",
              description: "Place ID",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "User ID",
            },
            rating: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "Rating from 1 to 5",
              example: 5,
            },
            comment: {
              type: "string",
              nullable: true,
              description: "Review comment",
              example: "Tuyệt vời! Nơi này quá đáng để ghé thăm",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Review creation timestamp",
            },
          },
        },
        UserVisit: {
          type: "object",
          required: ["id", "userId", "placeId", "visitedAt"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Visit record ID",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "User ID",
            },
            placeId: {
              type: "string",
              format: "uuid",
              description: "Place ID",
            },
            visitedAt: {
              type: "string",
              format: "date-time",
              description: "Visit timestamp",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
