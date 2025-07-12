-- Migración final de limpieza
-- Elimina especialidades, plantillas predefinidas y función de plantilla por defecto
-- Siguiendo los requerimientos del usuario: mantener simple pero con potencial

-- ========================================
-- ELIMINAR DATOS PREDEFINIDOS
-- ========================================

-- 1. Eliminar todas las plantillas predefinidas
DELETE FROM public.templates;

-- 2. Eliminar todas las especialidades
DELETE FROM public.specialties;

-- 3. Eliminar plantillas por defecto de usuarios existentes (mantener solo las personalizadas)
DELETE FROM public.user_templates 
WHERE name = 'Mi Plantilla' AND content LIKE '%NOTA CLÍNICA%INFORMACIÓN DEL PACIENTE%';

-- ========================================
-- ELIMINAR FUNCIONES INNECESARIAS
-- ========================================

-- 4. Eliminar función de crear plantilla por defecto
DROP FUNCTION IF EXISTS public.create_default_user_template(uuid);

-- 5. Eliminar función de manejar nuevo usuario que crea plantillas por defecto
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ========================================
-- ELIMINAR TABLAS INNECESARIAS
-- ========================================

-- 6. Eliminar restricciones de foreign key que referencian specialties
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_specialty_id_fkey;
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_template_id_fkey;
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_specialty_id_fkey;

-- 7. Eliminar índices relacionados con specialties
DROP INDEX IF EXISTS public.specialties_name_idx;
DROP INDEX IF EXISTS public.templates_specialty_id_idx;
DROP INDEX IF EXISTS public.templates_name_idx;
DROP INDEX IF EXISTS public.notes_specialty_id_idx;
DROP INDEX IF EXISTS public.notes_template_id_idx;

-- 8. Eliminar columnas innecesarias de la tabla notes
ALTER TABLE public.notes DROP COLUMN IF EXISTS specialty_id;
ALTER TABLE public.notes DROP COLUMN IF EXISTS template_id;

-- 9. Eliminar tabla templates (ya no se necesita)
DROP TABLE IF EXISTS public.templates;

-- 10. Eliminar tabla specialties (ya no se necesita)
DROP TABLE IF EXISTS public.specialties;

-- ========================================
-- ELIMINAR TRIGGERS INNECESARIOS
-- ========================================

-- 11. Eliminar trigger que crea usuario por defecto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ========================================
-- CREAR FUNCIÓN SIMPLE DE USUARIO
-- ========================================

-- 12. Crear función simple que solo asegure que el usuario existe
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  SELECT auth.uid(), auth.email(), now(), now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Crear función que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Crear trigger simple para nuevos usuarios
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- LIMPIAR PERMISOS
-- ========================================

-- 15. Revocar permisos de funciones eliminadas
REVOKE EXECUTE ON FUNCTION public.create_default_user_template(uuid) FROM authenticated;

-- 16. Otorgar permisos a nueva función
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;

-- ========================================
-- MOSTRAR RESULTADOS
-- ========================================

SELECT 'Limpieza final completada' as status;
SELECT 'Plantillas de usuario existentes' as status, COUNT(*) as count FROM public.user_templates;
SELECT 'Notas existentes' as status, COUNT(*) as count FROM public.notes;
SELECT 'Usuarios existentes' as status, COUNT(*) as count FROM public.users; 