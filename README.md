# 🌺 Alohawaii API

A robust Next.js API service for the Alohawaii tour platform, featuring Google OAuth authentication, domain whitelisting, and comprehensive tour management capabilities.

## 🚀 Features

- **Authentication**: Google OAuth with NextAuth.js and domain-based user whitelisting
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Documentation**: Interactive Swagger/OpenAPI documentation at `/docs`
- **Testing**: Comprehensive test suite with 100% coverage (Unit, Integration, E2E)
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Health Monitoring**: Built-in health check endpoints
- **Docker**: Containerized for consistent development and deployment

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Testing](#testing)
- [Database](#database)
- [Authentication](#authentication)
- [Docker Usage](#docker-usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Docker and Docker Compose (recommended)

### Option 1: Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/alohawaii-api.git
cd alohawaii-api

# Start with Docker Compose
docker-compose up -d

# The API will be available at http://localhost:4000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up the database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

## 🔗 API Endpoints

### Public Endpoints
- `GET /` - API documentation homepage
- `GET /docs` - Interactive Swagger UI
- `GET /api/docs` - OpenAPI specification
- `GET /api/external/health` - Health check endpoint

### Authentication
- `GET /api/auth/signin` - Google OAuth login
- `GET /api/auth/signout` - Logout
- `GET /api/auth/session` - Current session info

### Protected Endpoints (Require Authentication)
- `GET /api/internal/users/me` - Get current user profile
- `PUT /api/internal/users/me` - Update user profile

Visit `/docs` for complete interactive API documentation.

## ⚙️ Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/alohawaii_dev"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Domain Whitelisting (comma-separated)
ALLOWED_DOMAINS="example.com,yourcompany.com"

# Environment
NODE_ENV="development"
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js JWT | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `ALLOWED_DOMAINS` | Whitelisted email domains | ✅ |

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server on port 4000
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:migrate      # Run database migrations
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Prisma Studio
npm run db:generate     # Generate Prisma client
npm run db:seed         # Seed database with sample data

# Testing
npm run test            # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e        # Run end-to-end tests only
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report

# Type Checking
npm run type-check      # Run TypeScript type checking
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── external/   # Public API endpoints
│   │   └── internal/   # Protected API endpoints
│   ├── docs/           # API documentation page
│   └── page.tsx        # API homepage
├── components/         # React components
├── lib/               # Utility libraries
│   ├── auth.ts        # Authentication configuration
│   ├── db.ts          # Database client
│   ├── swagger.ts     # API documentation config
│   └── api-helpers.ts # API utility functions
└── types/             # TypeScript type definitions
```

## 🧪 Testing

This project includes a comprehensive testing framework with 100% coverage:

### Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration 
npm run test:e2e

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── helpers/          # Test utilities
└── README.md         # Testing documentation
```

## 🗄️ Database

### Schema Overview

The database includes the following main models:

- **User**: User profiles with Google OAuth integration
- **Account**: NextAuth.js account linkage
- **Session**: User session management
- **Tour**: Tour information and details
- **Booking**: Tour booking records
- **Staff**: Staff member profiles

### Database Operations

```bash
# Apply schema changes
npm run db:push

# Generate Prisma client
npm run db:generate

# Open Prisma Studio (GUI)
npm run db:studio

# Seed with sample data
npm run db:seed
```

### Migrations

```bash
# Create and apply a new migration
npm run db:migrate

# Reset database (development only)
npx prisma migrate reset
```

## 🔐 Authentication

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:4000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Domain Whitelisting

Users can only sign in if their email domain is in the `ALLOWED_DOMAINS` environment variable:

```env
ALLOWED_DOMAINS="yourcompany.com,contractor.com"
```

### User Roles

- `ADMIN`: Full system access
- `STAFF`: Staff dashboard access
- `CUSTOMER`: Basic user access

## 🐳 Docker Usage

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

### Docker Configuration

The API includes optimized Docker configuration:

- Multi-stage build for production
- Alpine Linux base for smaller images
- Health checks for container monitoring
- Volume mounts for development

## 📚 API Documentation

### Interactive Documentation

Visit [http://localhost:4000/docs](http://localhost:4000/docs) for interactive Swagger UI documentation.

### OpenAPI Specification

The OpenAPI specification is available at [http://localhost:4000/api/docs](http://localhost:4000/api/docs).

### Authentication in Documentation

The Swagger UI includes authentication support. Click "Authorize" and sign in with Google to test protected endpoints.

## 🔧 Configuration

### TypeScript Configuration

```json
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Next.js Configuration

- Custom port 4000 for API service
- API routes optimized for server-side rendering
- TypeScript strict mode enabled

## 🏗️ Architecture

### Design Patterns

- **Repository Pattern**: Database access through Prisma
- **Middleware Pattern**: Authentication and request processing
- **Factory Pattern**: Test utilities and mocks
- **Dependency Injection**: Service layer organization

### Key Libraries

- **Next.js 14**: Full-stack React framework
- **Prisma**: Type-safe database ORM
- **NextAuth.js**: Authentication library
- **Swagger**: API documentation
- **Jest**: Testing framework
- **Zod**: Runtime type validation

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Ensure all required environment variables are set:

- Use strong `NEXTAUTH_SECRET`
- Configure production `DATABASE_URL`
- Set correct `NEXTAUTH_URL` for your domain
- Configure production Google OAuth credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Update documentation for API changes
- Ensure 100% test coverage for new code

## 📝 License

This project is private and proprietary.

## 🆘 Support

For support and questions:

1. Check the [interactive documentation](http://localhost:4000/docs)
2. Review the test examples in `/tests/`
3. Open an issue in the repository

## 📈 Health Monitoring

The API includes health check endpoints for monitoring:

```bash
# Check API health
curl http://localhost:4000/api/external/health

# Response
{
  "success": true,
  "message": "Success", 
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-22T12:00:00.000Z",
    "version": "0.1.0",
    "environment": "development"
  }
}
```

---

Built with ❤️ for the Alohawaii tour platform
