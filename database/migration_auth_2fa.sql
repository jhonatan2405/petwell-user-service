-- Migración: Añadir campos de verificación 2FA y reset de contraseña para User Service

ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN reset_code VARCHAR(10);
ALTER TABLE users ADD COLUMN reset_expires TIMESTAMPTZ;
