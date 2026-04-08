-- 1. Agregar la columna de forma segura (solo si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clinics' 
        AND column_name = 'logo_url'
    ) THEN 
        ALTER TABLE clinics ADD COLUMN logo_url TEXT; 
    END IF; 
END $$;

-- 2. Recargar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';

-- 3. Query de verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clinics' AND column_name = 'logo_url';
