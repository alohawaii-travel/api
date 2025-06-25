# Database Management with Prisma

This document provides information on how to manage the database using Prisma directly from the API code.

## Prerequisites

Make sure the database is running. You can start it with:

```bash
cd ../../infra
make start-db
```

## Direct Database Operations

You can run database operations directly from this API directory:

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Create a new migration without applying it
npx prisma migrate dev --create-only --name your_migration_name

# Reset the database (caution: this will drop and recreate all tables)
npx prisma migrate reset

# Push schema changes without migrations
npx prisma db push
```

## Testing Environment

Tests now use mocked data instead of a real test database. This makes tests:

- Faster to run
- More reliable (no database-related flakiness)
- Easier to set up (no need for a separate test database)
- Suitable for CI/CD environments without database access

The `jest-mock-extended` package is used to create Prisma client mocks.

### Seed Data

```bash
# Seed the database with initial data
npx prisma db seed
```

### Schema Management

```bash
# Apply schema changes without generating migrations
npx prisma db push

# Generate Prisma client based on your schema
npx prisma generate
```

### Database UI

```bash
# Open Prisma Studio to view and edit data
npx prisma studio
```

## Connection String

When running these commands locally, the connection string from your `.env.local` or `.env` file will be used. Make sure it's correctly configured to connect to your database:

```
DATABASE_URL="postgresql://user:password@localhost:5432/alohawaii_db?schema=public"
```

## Docker Environment

Inside the Docker environment, the API container is configured to use:

```
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

Where `db` is the hostname of the database service in the Docker network.
