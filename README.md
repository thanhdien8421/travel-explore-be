# Travel Explore Backend 🌍

A modern, scalable REST API for a travel location discovery platform focused on Ho Chi Minh City, built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Development](#development)
- [Features Implementation Sources](#features-implementation-sources)
- [Future Enhancements](#future-enhancements)

## ✨ Features

- **CRUD Operations**: Create, read, update, and delete locations
- **Search & Filter**: Search by name/description/location, filter by rating
- **Pagination**: Configurable page size with metadata
- **Validation**: Request validation using express-validator
- **Error Handling**: Centralized error handling middleware
- **Security**: CORS, Helmet security headers
- **Type Safety**: Full TypeScript implementation
- **API Documentation**: Interactive Swagger/OpenAPI docs
- **Statistics**: Admin dashboard statistics endpoint

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Documentation**: Swagger/OpenAPI
- **Dev Tools**: tsx (TypeScript execution)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travel-explore-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/travel_explore"
   PORT=8000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up the database**
   
   Create the PostgreSQL database:
   ```sql
   CREATE DATABASE travel_explore;
   ```

5. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Seed the database** (optional)
   
   Run the SQL script in `database.sql` to populate with sample Ho Chi Minh City locations.

7. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## 📖 API Documentation

Interactive API documentation is available via Swagger UI:

**Swagger UI**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)

### Quick API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/locations` | Get all locations (with search/filter) |
| GET | `/api/locations/:id` | Get location by ID |
| POST | `/api/locations` | Create new location |
| PUT | `/api/locations/:id` | Update location |
| DELETE | `/api/locations/:id` | Delete location |
| GET | `/api/locations/statistics` | Get statistics (admin) |

### Example Requests

**Get all locations with search:**
```bash
curl "http://localhost:8000/api/locations?search=Chợ&minRating=4"
```

**Create a new location:**
```bash
curl -X POST http://localhost:8000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bảo tàng Mỹ thuật",
    "description": "Bảo tàng nghệ thuật đương đại với nhiều tác phẩm nổi tiếng",
    "location": "Quận 3, TP. Hồ Chí Minh",
    "image": "https://example.com/image.jpg",
    "rating": 4.2
  }'
```

## 📁 Project Structure

```
travel-explore-be/
├── src/
│   ├── config/
│   │   └── swagger.ts           # Swagger/OpenAPI configuration
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── routes/
│   │   └── locations.ts         # Location routes with Swagger docs
│   ├── services/
│   │   └── locationService.ts   # Business logic layer
│   ├── types/
│   │   └── location.types.ts    # TypeScript interfaces
│   ├── validators/
│   │   └── locationValidator.ts # Request validation rules
│   └── index.ts                 # Application entry point
├── prisma/
│   └── schema.prisma            # Database schema
├── .env                         # Environment variables
├── database.sql                 # Database setup script
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🗄 Database Schema

```prisma
model Location {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  location    String
  image       String
  rating      Float    @default(5.0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Code Quality

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting (optional)
- **Prettier** for code formatting (optional)

### Testing API Endpoints

Use the Swagger UI at `/api-docs` or tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

## 📚 Features Implementation Sources

This backend was built by combining best practices from multiple open-source projects:

### 1. **quendp/g4-mini-project-2**
- ✅ RESTful API structure
- ✅ CRUD operations pattern
- ✅ Error handling middleware
- ✅ Route organization

### 2. **rameshraman86/travel-buddy**
- ✅ Service layer architecture
- ✅ Centralized error handling with custom AppError
- ✅ Async handler wrapper for routes
- ✅ Statistics endpoint for admin dashboard

### 3. **shsarv/TravelYaari-react**
- ✅ Request validation patterns
- ✅ Form validation rules (min/max length, required fields)
- ✅ Validation middleware structure

### 4. **XuanYing0915/KH_Travel_Project**
- ✅ Search functionality (by name, description, location)
- ✅ Filter by rating
- ✅ Pagination support
- ✅ Query parameter handling

### 5. **JuditKaramazov/TakeYouThere**
- ✅ Clean API response structure
- ✅ Consistent status/data format
- ✅ Proper HTTP status codes

## 🔐 Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Configured cross-origin resource sharing
- **Input Validation**: All inputs validated before processing
- **Error Handling**: Sensitive errors not exposed to client
- **Type Safety**: TypeScript for compile-time checks

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

For production, ensure:
1. Set `NODE_ENV=production`
2. Use strong database credentials
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use process managers (PM2, systemd)

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
```

## 🔮 Future Enhancements

- [ ] User authentication & authorization (JWT)
- [ ] Image upload functionality (AWS S3, Cloudinary)
- [ ] Location comments and reviews
- [ ] Location categories and tags
- [ ] Map integration with coordinates
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Logging system (Winston/Morgan)
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] API versioning
- [ ] WebSocket for real-time updates

## 📝 License

This project is licensed under the ISC License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Troubleshooting

### Server won't start
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Run `npx prisma generate`
- Check if port 8000 is available

### Database connection fails
- Verify PostgreSQL credentials
- Check if database `travel_explore` exists
- Run `npx prisma db push` to sync schema

### TypeScript errors
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` configuration
- Ensure `@types/*` packages are installed

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Made with ❤️ for travelers exploring Ho Chi Minh City**
