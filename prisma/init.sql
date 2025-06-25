-- Initial SQL for setting up the database
-- This file can be used to initialize the database schema

-- Create the database (if using manual setup)
-- CREATE DATABASE alohawaii_dev;
-- CREATE DATABASE alohawaii_test;

-- Basic initialization (Prisma will handle the rest)
SELECT 'Database initialization script';

-- The user and database are already created by Docker from environment variables
-- We just need to ensure proper permissions are granted

-- Grant schema privileges to the user
GRANT ALL PRIVILEGES ON DATABASE alohawaii_db TO alohawaii_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO alohawaii_user;
ALTER USER alohawaii_user WITH SUPERUSER;  -- Only for development purposes

-- Enable extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a Postgres user that matches your Mac username for easier connections
-- This will only be executed on development machines
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
      CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';
   END IF;
END
$do$;
