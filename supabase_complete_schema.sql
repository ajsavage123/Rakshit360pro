-- =====================================================
-- CLEAN SUPABASE SQL SCHEMA FOR MEDICAL AI ASSISTANT
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create hospitals table with PostGIS geography type
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    specialty TEXT[] NOT NULL DEFAULT '{}',
    opening_hours TEXT,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    location GEOGRAPHY(POINT, 4326),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for efficient location-based queries
CREATE INDEX idx_hospitals_location ON hospitals USING GIST (location);

-- Create regular indexes for better performance
CREATE INDEX idx_hospitals_specialty ON hospitals USING GIN (specialty);
CREATE INDEX idx_hospitals_rating ON hospitals (rating DESC);
CREATE INDEX idx_hospitals_verified ON hospitals (verified);

-- Enable Row Level Security
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (hospitals are public data)
CREATE POLICY "Anyone can view hospitals" ON hospitals
    FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update hospitals
CREATE POLICY "Authenticated users can insert hospitals" ON hospitals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hospitals" ON hospitals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to insert hospital with location from lat/lng
CREATE OR REPLACE FUNCTION insert_hospital_with_location(
    hospital_name VARCHAR(255),
    hospital_address TEXT,
    hospital_phone VARCHAR(50),
    hospital_specialty TEXT[],
    hospital_opening_hours TEXT,
    hospital_longitude DECIMAL(10,8),
    hospital_latitude DECIMAL(10,8),
    hospital_rating DECIMAL(3,2) DEFAULT 0
) RETURNS TABLE(id INTEGER) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO hospitals (name, address, phone, specialty, opening_hours, rating, location)
    VALUES (
        hospital_name,
        hospital_address,
        hospital_phone,
        hospital_specialty,
        hospital_opening_hours,
        hospital_rating,
        ST_GeogFromText('SRID=4326;POINT(' || hospital_longitude || ' ' || hospital_latitude || ')')
    )
    RETURNING hospitals.id;
END;
$$ LANGUAGE plpgsql;

-- Function to search nearby hospitals using PostGIS
CREATE OR REPLACE FUNCTION search_nearby_hospitals(
    user_longitude DECIMAL(10,8),
    user_latitude DECIMAL(10,8),
    search_radius_meters INTEGER DEFAULT 25000,
    specialty_filter TEXT DEFAULT NULL
) RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    specialty TEXT[],
    opening_hours TEXT,
    rating DECIMAL(3,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(10,8),
    distance_meters DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.address,
        h.phone,
        h.specialty,
        h.opening_hours,
        h.rating,
        ST_Y(h.location::geometry)::DECIMAL(10,8) as latitude,
        ST_X(h.location::geometry)::DECIMAL(10,8) as longitude,
        ST_Distance(
            h.location,
            ST_GeogFromText('SRID=4326;POINT(' || user_longitude || ' ' || user_latitude || ')')
        )::DECIMAL(10,2) as distance_meters
    FROM hospitals h
    WHERE 
        h.location IS NOT NULL
        AND ST_DWithin(
            h.location,
            ST_GeogFromText('SRID=4326;POINT(' || user_longitude || ' ' || user_latitude || ')'),
            search_radius_meters
        )
        AND (specialty_filter IS NULL OR h.specialty @> ARRAY[specialty_filter])
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to update location coordinates
CREATE OR REPLACE FUNCTION update_hospital_location(
    hospital_id INTEGER,
    new_longitude DECIMAL(10,8),
    new_latitude DECIMAL(10,8)
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE hospitals 
    SET 
        location = ST_GeogFromText('SRID=4326;POINT(' || new_longitude || ' ' || new_latitude || ')'),
        updated_at = NOW()
    WHERE id = hospital_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for API access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON hospitals TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE hospitals_id_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_hospital_with_location TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_nearby_hospitals TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_hospital_location TO anon, authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- Your database is now ready with:
-- 1. PostGIS enabled for geographic queries
-- 2. Hospitals table with spatial indexing
-- 3. Helper functions for location-based searches
-- 4. Proper Row Level Security policies
-- 5. Ready for your real hospital data
-- =====================================================

-- Example of how to insert a hospital:
-- SELECT insert_hospital_with_location(
--     'Hospital Name',
--     'Full Address',
--     '+91-XX-XXXX-XXXX',
--     ARRAY['Cardiology', 'Emergency Medicine'],
--     '24/7',
--     72.8777,  -- longitude
--     19.0760,  -- latitude
--     4.5       -- rating
-- );