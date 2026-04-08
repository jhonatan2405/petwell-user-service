-- Migration to add visual identity fields to users and clinics
-- Execute this script in the User Service Database

-- Add photo_url to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add logo_url to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Storage buckets needed in Supabase:
-- 1. name: user-avatars, public: true
-- 2. name: clinic-logos, public: true
