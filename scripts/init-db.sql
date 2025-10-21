-- Database initialization script for PostgreSQL
-- This script runs when the database container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional indexes for performance
-- These will be created by TypeORM migrations, but we can add them here for initial setup

-- Set default timezone
SET timezone = 'UTC';

-- Create custom functions if needed
-- Example: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';