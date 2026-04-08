-- ============================================================
-- PetWell — User Service Database Schema v2
-- Ejecuta este script completo en el SQL Editor de Supabase
-- ============================================================

-- ── Extensión UUID ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Tabla roles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id         SERIAL       PRIMARY KEY,
  role_name  VARCHAR(50)  NOT NULL UNIQUE
);

-- ── 2. Tabla clinics ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  address       TEXT         NOT NULL,
  city          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  tax_id        VARCHAR(50)  NOT NULL UNIQUE,
  opening_hours TEXT,
  specialties   TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Índices clinics ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clinics_tax_id ON public.clinics(tax_id);

-- ── 3. Tabla users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT         NOT NULL,
  phone           VARCHAR(20),
  role_id         INTEGER      NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  clinic_id       UUID         REFERENCES public.clinics(id) ON DELETE SET NULL,
  license_number  VARCHAR(100),
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Índices users ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id    ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id  ON public.users(clinic_id);

-- ── 4. Trigger: auto-actualizar updated_at ────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. Roles iniciales ────────────────────────────────────────
INSERT INTO public.roles (role_name) VALUES
  ('ADMIN'),
  ('VETERINARIO'),
  ('CLINICA'),
  ('DUENO_MASCOTA'),
  ('CLINIC_ADMIN'),
  ('RECEPCIONISTA')
ON CONFLICT (role_name) DO NOTHING;

-- ── 6. Row Level Security (RLS) ───────────────────────────────
-- El microservicio usa service_role key (omite RLS).
-- RLS está habilitado para prevenir acceso público directo.
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- ── 7. MIGRACIÓN — Ejecutar SOLO si la tabla users ya existía ─
-- Ejecuta solo este bloque si la tabla ya existía sin los nuevos campos:
--
-- ALTER TABLE public.users
--   ADD COLUMN IF NOT EXISTS clinic_id       UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
--   ADD COLUMN IF NOT EXISTS license_number  VARCHAR(100);
--
-- CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);

-- ── 8. Vista de consulta (opcional) ──────────────────────────
CREATE OR REPLACE VIEW public.users_with_roles AS
  SELECT
    u.id,
    u.name,
    u.email,
    u.phone,
    r.role_name  AS role,
    u.clinic_id,
    u.license_number,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id;
