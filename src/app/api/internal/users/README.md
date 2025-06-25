# Users API Documentation

## Overview
The Users API provides endpoints for managing users within the system. Access to these endpoints is restricted to users with admin permissions.

## Authentication & Authorization

### API Key Authentication
All requests must include a valid API key in the header:
```
X-API-Key: <your-api-key>
```

### User Authentication
Users must be authenticated via NextAuth.js session and have admin permissions (`ADMIN` or `SUPER_ADMIN` role).

### Permission Levels
The system supports the following permission levels (in order of authority):

1. **CUSTOMER** - Basic user with minimal permissions
2. **STAFF** - Basic employee with limited access
3. **MANAGER** - Middle management with elevated permissions  
4. **ADMIN** - Administrative access to most features
5. **SUPER_ADMIN** - Full system access

## Endpoints

### GET /api/internal/users

Retrieves a paginated list of users in the system.

**Access Level**: Admin only (`ADMIN` or `SUPER_ADMIN`)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 50 | Number of users per page (max 100) |
| `role` | UserRole | - | Filter by specific user role |
| `search` | string | - | Search by email or name (case-insensitive) |
| `isActive` | boolean | - | Filter by active status |

#### Response Format

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clm123...",
        "email": "user@example.com",
        "name": "John Doe",
        "avatar": "https://...",
        "role": "STAFF",
        "domain": "example.com",
        "isActive": true,
        "language": "en",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "lastLoginAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 250,
      "limit": 50,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Retrieved 50 users successfully"
}
```

#### Example Requests

```bash
# Get first page of all users
curl -H "X-API-Key: your-key" \
     -H "Cookie: next-auth.session-token=..." \
     http://localhost:4000/api/internal/users

# Get users with STAFF role
curl -H "X-API-Key: your-key" \
     -H "Cookie: next-auth.session-token=..." \
     "http://localhost:4000/api/internal/users?role=STAFF"

# Search for users by email/name
curl -H "X-API-Key: your-key" \
     -H "Cookie: next-auth.session-token=..." \
     "http://localhost:4000/api/internal/users?search=john&page=1&limit=25"

# Get only active users
curl -H "X-API-Key: your-key" \
     -H "Cookie: next-auth.session-token=..." \
     "http://localhost:4000/api/internal/users?isActive=true"
```

#### Error Responses

**401 Unauthorized - Invalid API Key**
```json
{
  "success": false,
  "error": "API key required. Please include X-API-Key header.",
  "code": "UNAUTHORIZED_API"
}
```

**403 Forbidden - Insufficient Permissions**
```json
{
  "success": false,
  "error": "Admin permissions required. Your role does not have access to this resource.",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to fetch users. Please try again later.",
  "code": "INTERNAL_ERROR"
}
```

## Implementation Details

### File Structure
- `/api/src/app/api/internal/users/route.ts` - Main API route handler
- `/api/src/lib/admin-auth.ts` - Admin authentication helpers
- `/api/src/types/auth.ts` - Type definitions

### Security Features
1. **Double Authentication**: Both API key and user session validation
2. **Role-based Access Control**: Only admin users can access endpoints
3. **Input Validation**: Query parameters are validated and sanitized
4. **Pagination Limits**: Maximum 100 users per page to prevent abuse
5. **Error Handling**: Detailed error responses without exposing sensitive information

### Database Queries
- Users are ordered by role (ascending) then creation date (descending)
- Sensitive fields are excluded from responses
- Efficient pagination using `skip` and `take`
- Search uses case-insensitive pattern matching

## Migration Notes

### Schema Changes
Added new user roles to the `UserRole` enum:
- `STAFF`
- `MANAGER`

### Default Role Assignment
New users from whitelisted domains now default to `STAFF` role instead of `CUSTOMER`.

### Database Migration
To apply the schema changes:
```bash
npx prisma migrate dev --name add-staff-manager-roles
# or
npx prisma db push
```
