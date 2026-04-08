-- ============================================================
-- PetWell — User Service | MIGRACIÓN v2: Clínicas y Staff
-- Ejecuta este script si ya tienes las tablas roles y users.
-- No toca ni borra nada de lo existente.
-- ============================================================

-- ── 1. Tabla clinics (nueva) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  address     TEXT         NOT NULL,
  city        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  tax_id      VARCHAR(50)  NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_tax_id ON public.clinics(tax_id);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- ── 2. Nuevas columnas en users ───────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS clinic_id      UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);

-- ── 3. Nuevos roles ───────────────────────────────────────────
INSERT INTO public.roles (role_name) VALUES
  ('CLINIC_ADMIN'),
  ('RECEPCIONISTA')
ON CONFLICT (role_name) DO NOTHING;
