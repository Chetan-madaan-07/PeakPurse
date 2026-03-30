-- PeakPurse Database Initialization Script
-- This script runs when PostgreSQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS peakpurse_dev;

-- Connect to the database
\c peakpurse_dev;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by TypeORM but we can add them manually if needed

-- Create user permissions
GRANT ALL PRIVILEGES ON DATABASE peakpurse_dev TO peakpurse_user;

-- Log successful initialization
DO $$
BEGIN
   RAISE NOTICE 'PeakPurse database initialized successfully';
END $$;
