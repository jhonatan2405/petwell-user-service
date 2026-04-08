-- 1. Agregar la columna de forma segura (solo si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'photo_url'
    ) THEN 
        ALTER TABLE users ADD COLUMN photo_url TEXT; 
    END IF; 
END $$;

-- 2. Recargar el caché de esquema de PostgREST para que la API detecte la columna nueva
NOTIFY pgrst, 'reload schema';

-- 3. Query de verificación: listar las columnas de la tabla users para asegurar que se aplicó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'photo_url';
