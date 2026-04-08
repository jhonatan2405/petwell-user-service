-- ============================================================
-- PetWell — User Service | Migration v3: Clinic Profile Fields
-- Run this in the Supabase SQL Editor if the clinics table
-- already exists (i.e. schema.sql was run previously).
-- ============================================================

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS specialties   TEXT;

-- Verify result
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'clinics'
-- ORDER BY ordinal_position;
