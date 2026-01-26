-- ============================================================================
-- FoodRescue Database Setup - S1: Map-Based Allocation
-- PostgreSQL with PostGIS Extension
-- ============================================================================

-- Create the database (run as postgres superuser)
-- CREATE DATABASE foodrescue_db;

-- Connect to the database
\c foodrescue_db

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create user (if not exists)
-- CREATE USER foodrescue_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE foodrescue_db TO foodrescue_user;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE food_type AS ENUM ('VEG', 'NON_VEG', 'VEGAN', 'MIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(100) NOT NULL,
    donor_phone VARCHAR(20) NOT NULL,
    food_type food_type NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    description TEXT,
    
    -- Geospatial column for PostGIS
    location GEOGRAPHY(POINT, 4326),
    
    -- Redundant lat/lng for easy access
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    address TEXT NOT NULL,
    status donation_status DEFAULT 'AVAILABLE',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Assignment tracking
    assigned_volunteer_id INTEGER,
    assigned_at TIMESTAMP
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Index on status for fast filtering
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- Index on expiry time for priority sorting
CREATE INDEX IF NOT EXISTS idx_donations_expires_at ON donations(expires_at);

-- Spatial index for geospatial queries (automatically created by PostGIS)
CREATE INDEX IF NOT EXISTS idx_donations_location ON donations USING GIST(location);

-- ============================================================================
-- SAMPLE DATA for Testing
-- ============================================================================

-- Chennai locations
INSERT INTO donations (
    donor_name, donor_phone, food_type, quantity_kg, description,
    latitude, longitude, location, address, expires_at
) VALUES 
(
    'Saravana Bhavan - T Nagar',
    '+919876543210',
    'VEG',
    25.0,
    'Idli, dosa batter and sambar - prepared this morning',
    13.0418,
    80.2341,
    ST_GeographyFromText('POINT(80.2341 13.0418)'),
    '21 Usman Road, T Nagar, Chennai 600017',
    CURRENT_TIMESTAMP + INTERVAL '3 hours'
),
(
    'Hotel Sangeetha - Anna Nagar',
    '+919876543211',
    'VEG',
    15.5,
    'Rice, dal and vegetables from lunch service',
    13.0850,
    80.2101,
    ST_GeographyFromText('POINT(80.2101 13.0850)'),
    '2nd Avenue, Anna Nagar, Chennai 600040',
    CURRENT_TIMESTAMP + INTERVAL '2 hours'
),
(
    'Dindigul Thalappakatti - Velachery',
    '+919876543212',
    'NON_VEG',
    30.0,
    'Biryani and chicken curry - prepared 1 hour ago',
    12.9750,
    80.2207,
    ST_GeographyFromText('POINT(80.2207 12.9750)'),
    'Velachery Main Road, Chennai 600042',
    CURRENT_TIMESTAMP + INTERVAL '4 hours'
),
(
    'Murugan Idli Shop - Besant Nagar',
    '+919876543213',
    'VEGAN',
    12.0,
    'Coconut chutney and tomato chutney - fresh batch',
    13.0010,
    80.2669,
    ST_GeographyFromText('POINT(80.2669 13.0010)'),
    '1st Cross Street, Besant Nagar, Chennai 600090',
    CURRENT_TIMESTAMP + INTERVAL '5 hours'
),
(
    'Adyar Ananda Bhavan - Adyar',
    '+919876543214',
    'VEG',
    20.0,
    'Mixed sweets and savories - closing inventory',
    13.0067,
    80.2571,
    ST_GeographyFromText('POINT(80.2571 13.0067)'),
    'Lattice Bridge Road, Adyar, Chennai 600020',
    CURRENT_TIMESTAMP + INTERVAL '6 hours'
);

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Get all available donations sorted by expiry
-- SELECT * FROM donations 
-- WHERE status = 'AVAILABLE' 
-- ORDER BY expires_at ASC;

-- Find donations within 5km of a point (e.g., dispatcher location)
-- SELECT id, donor_name, quantity_kg,
--        ST_Distance(location, ST_GeographyFromText('POINT(80.2707 13.0827)')) / 1000 AS distance_km
-- FROM donations
-- WHERE status = 'AVAILABLE'
--   AND ST_DWithin(location, ST_GeographyFromText('POINT(80.2707 13.0827)'), 5000)
-- ORDER BY distance_km;

-- Count donations by status
-- SELECT status, COUNT(*) 
-- FROM donations 
-- GROUP BY status;
