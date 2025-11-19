# 🚀 Frontend Integration Guide

## API Endpoints Overview

### **Base URL**
```
http://localhost:8000/api
```

---

## 📍 Places Endpoints

### **Search & Filter Places**
```http
GET /api/places?q=coffee&category=Ẩm thực&ward=Phường Bến Thành&sortBy=rating_desc&limit=10&page=1
```

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `q` | string | `coffee` | Search by name, description, or address |
| `category` | string | `di-tich-lich-su` | Filter by category slug |
| `ward` | string | `Phường Bến Thành` | Filter by ward/sub-district |
| `district` | string | `Quận 1` | Filter by district (optional) |
| `sortBy` | string | `rating_desc` | Sort by: `name_asc`, `name_desc`, `rating_asc`, `rating_desc` |
| `limit` | number | `10` | Results per page (default: 10) |
| `page` | number | `1` | Page number for pagination |
| `featured` | boolean | `true` | Show only featured places |

**Response Example:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Chùa Ngọc Hoàng",
      "slug": "chua-ngoc-hoang",
      "ward": "Phường Đa Kao",
      "district": "Quận 1",
      "cover_image_url": "https://example.com/image.jpg",
      "average_rating": 4.8,
      "latitude": 10.7924,
      "longitude": 106.6976
    }
  ],
  "pagination": {
    "totalItems": 26,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

---

### **Get Place Details**
```http
GET /api/places/{slug}
```

**Example:**
```http
GET /api/places/chua-ngoc-hoang
```

**Response:**
```json
{
  "id": "...",
  "name": "Chùa Ngọc Hoàng",
  "description": "Ngôi chùa Đạo giáo cổ kính...",
  "street_address": "73 Mai Thị Lựu",
  "ward": "Phường Đa Kao",
  "district": "Quận 1",
  "province_city": "TP. Hồ Chí Minh",
  "location_description": "Near Ben Thanh Market",
  "latitude": 10.7924,
  "longitude": 106.6976,
  "cover_image_url": "...",
  "opening_hours": "8:00 AM - 5:00 PM",
  "price_info": "Free",
  "contact_info": "...",
  "categories": [
    { "id": "...", "name": "Tôn giáo", "slug": "ton-giao" },
    { "id": "...", "name": "Di tích lịch sử", "slug": "di-tich-lich-su" }
  ],
  "average_rating": 4.8,
  "reviews": [...]
}
```

---

## 🏆 Categories Endpoint

### **Get All Categories**
```http
GET /api/categories
```

**Response:**
```json
{
  "data": [
    { "id": "...", "name": "Ẩm thực", "slug": "am-thuc" },
    { "id": "...", "name": "Tham quan", "slug": "tham-quan" },
    { "id": "...", "name": "Mua sắm", "slug": "mua-sam" },
    ...
  ]
}
```

**Use Cases:**
- Populate filter dropdowns
- Display category badges on place cards
- Multi-select category filters

---

## 📍 Wards Endpoint

### **Get All Wards**
```http
GET /api/wards
```

**Response:**
```json
{
  "data": [
    "Phường Bến Thành",
    "Phường Đa Kao",
    "Phường Bến Nghé",
    "Phường Tân Định"
  ]
}
```

**Use Cases:**
- Autocomplete ward selection in search
- Ward filter dropdown
- Faceted search sidebar

---

## 👤 Admin Endpoints

### **Create Place** (Admin only - requires JWT token)
```http
POST /api/admin/places
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Chùa Ngọc Hoàng",
  "description": "Ngôi chùa Đạo giáo cổ kính...",
  "streetAddress": "73 Mai Thị Lựu",
  "ward": "Phường Đa Kao",
  "district": "Quận 1",
  "provinceCity": "TP. Hồ Chí Minh",
  "locationDescription": "Near Ben Thanh Market",
  "latitude": 10.7924,
  "longitude": 106.6976,
  "categoryIds": ["uuid-1", "uuid-2"],
  "coverImageUrl": "https://example.com/image.jpg",
  "openingHours": "8:00 AM - 5:00 PM",
  "priceInfo": "Free",
  "contactInfo": "...",
  "isFeatured": true
}
```

### **Update Place** (Admin only - requires JWT token)
```http
PUT /api/admin/places/{id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description...",
  "streetAddress": "New address",
  "ward": "Phường Bến Thành",
  "district": "Quận 1",
  "categoryIds": ["uuid-1", "uuid-3"],
  ...
}
```

### **Delete Place** (Soft delete - Admin only)
```http
DELETE /api/admin/places/{id}
Authorization: Bearer {JWT_TOKEN}
```

**Response:** HTTP 204 No Content

---

## 🔐 Authentication

### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

**Use:** Include token in subsequent requests:
```
Authorization: Bearer {token}
```

---

## 🗺️ Frontend Implementation Examples

### **Search Bar with Dropdown (TK-003)**
```javascript
// As user types...
async function search(query) {
  const response = await fetch(
    `/api/places?q=${query}&limit=5`
  );
  const data = await response.json();
  // Display data.data as dropdown suggestions
}
```

### **Search Results Page (TK-004)**
```javascript
async function getFilteredPlaces(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.append('q', filters.query);
  if (filters.category) params.append('category', filters.category);
  if (filters.ward) params.append('ward', filters.ward);
  params.append('sortBy', filters.sortBy || 'rating_desc');
  
  const response = await fetch(`/api/places?${params}`);
  return response.json();
}
```

### **Map Search (TK-005)**
```javascript
async function loadMapMarkers(searchQuery) {
  const response = await fetch(
    `/api/places?q=${searchQuery}&limit=50`
  );
  const { data } = await response.json();
  
  // Create markers for each place
  data.forEach(place => {
    addMarker(place.latitude, place.longitude, place.name);
  });
}
```

### **Admin Create/Update Form**
```javascript
async function createPlace(formData) {
  const response = await fetch('/api/admin/places', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      name: formData.name,
      description: formData.description,
      streetAddress: formData.street,
      ward: formData.ward,
      district: formData.district,
      categoryIds: formData.selectedCategories,
      latitude: formData.lat,
      longitude: formData.lng
    })
  });
  return response.json();
}
```

### **Category Filter Dropdown**
```javascript
async function populateCategoryFilter() {
  const response = await fetch('/api/categories');
  const { data } = await response.json();
  
  // Create dropdown options from data
  // Each option has: id, name, slug
}
```

### **Ward Filter Dropdown**
```javascript
async function populateWardFilter() {
  const response = await fetch('/api/wards');
  const { data } = await response.json();
  
  // Create dropdown options from data
  // Each option is a ward name string
}
```

---

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "status": "error"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (success with no response body)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid JWT)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## 🔗 Related Files

- **Swagger Docs:** `http://localhost:8000/api-docs`
- **Routes:** `src/routes/places.ts`, `src/routes/adminPlaceRoutes.ts`
- **Services:** `src/services/placeService.ts`, `src/services/adminPlaceService.ts`
- **Types:** `src/types/place.types.ts`

---

## 📞 Support Notes

- All coordinates are in `latitude` (9,6 precision) and `longitude` (10,6 precision)
- Category `slug` is used for API queries (e.g., `?category=di-tich-lich-su`)
- Ward names must be URL-encoded if containing special characters
- Search is case-insensitive and supports partial matches
- Pagination starts at page 1, not page 0

