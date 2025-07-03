
-- PostGIS Migration for Hospitals Table
-- This script updates the hospitals table to use PostGIS geography type

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the new hospitals table with PostGIS geography
DROP TABLE IF EXISTS hospitals_new;
CREATE TABLE hospitals_new (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    specialty TEXT[] NOT NULL DEFAULT '{}',
    opening_hours TEXT,
    rating DECIMAL(2,1) DEFAULT 0,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for efficient location queries
CREATE INDEX idx_hospitals_location ON hospitals_new USING GIST (location);

-- Create a function to insert hospitals with location
CREATE OR REPLACE FUNCTION insert_hospital_with_location(
    hospital_name VARCHAR(255),
    hospital_address TEXT,
    hospital_phone VARCHAR(50),
    hospital_specialty TEXT[],
    hospital_opening_hours TEXT,
    hospital_longitude DECIMAL(10,8),
    hospital_latitude DECIMAL(10,8),
    hospital_rating DECIMAL(2,1) DEFAULT 0
) RETURNS TABLE(id INTEGER) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO hospitals_new (name, address, phone, specialty, opening_hours, rating, location)
    VALUES (
        hospital_name,
        hospital_address,
        hospital_phone,
        hospital_specialty,
        hospital_opening_hours,
        hospital_rating,
        ST_GeogFromText('SRID=4326;POINT(' || hospital_longitude || ' ' || hospital_latitude || ')')
    )
    RETURNING hospitals_new.id;
END;
$$ LANGUAGE plpgsql;

-- If you have existing data in hospitals table, migrate it
-- (Uncomment the following lines if you have existing data)
/*
INSERT INTO hospitals_new (name, address, phone, specialty, opening_hours, rating, location)
SELECT 
    name, 
    address, 
    phone, 
    specialty, 
    opening_hours, 
    rating,
    ST_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')')
FROM hospitals 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
*/

-- Drop old table and rename new one
-- (Uncomment these lines after verifying the migration)
/*
DROP TABLE IF EXISTS hospitals;
ALTER TABLE hospitals_new RENAME TO hospitals;
*/

-- Sample data insertion (for testing)
-- INSERT INTO hospitals (name, address, phone, specialty, opening_hours, rating, location)
-- VALUES (
--     'City General Hospital',
--     '123 Main St, Mumbai, Maharashtra 400001',
--     '+91-22-1234-5678',
--     ARRAY['Emergency Medicine', 'General Medicine', 'Surgery'],
--     'Open 24/7',
--     4.2,
--     ST_GeogFromText('SRID=4326;POINT(72.8777 19.0760)')
-- );
