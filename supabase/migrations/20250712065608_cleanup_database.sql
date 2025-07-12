-- Script de limpieza para eliminar plantillas predefinidas y especialidades
-- Ejecutado después del setup inicial

-- 1. Limpiar todas las plantillas predefinidas (no personalizadas)
DELETE FROM public.templates;

-- 2. Limpiar todas las especialidades predefinidas (no las necesitamos)
DELETE FROM public.specialties;

-- 3. Actualizar notas existentes para usar solo user_template_id
UPDATE public.notes 
SET template_id = NULL, specialty_id = NULL 
WHERE template_id IS NOT NULL OR specialty_id IS NOT NULL;

-- 4. Limpiar cualquier referencia a especialidades en notas
ALTER TABLE public.notes 
DROP CONSTRAINT IF EXISTS notes_specialty_id_fkey;

ALTER TABLE public.notes 
DROP CONSTRAINT IF EXISTS notes_template_id_fkey;

-- 5. Asegurar que todas las plantillas de usuario están activas
UPDATE public.user_templates 
SET is_active = true 
WHERE is_active = false;

-- 6. Crear índices optimizados para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id_active ON public.user_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_user_template_id ON public.notes(user_template_id);

-- 7. Mostrar resultados de la limpieza
SELECT 'Limpieza completada' as status;
SELECT 'Plantillas predefinidas eliminadas' as status, COUNT(*) as count FROM public.templates;
SELECT 'Especialidades eliminadas' as status, COUNT(*) as count FROM public.specialties;
SELECT 'Plantillas de usuario activas' as status, COUNT(*) as count FROM public.user_templates WHERE is_active = true;
SELECT 'Notas con plantillas personalizadas' as status, COUNT(*) as count FROM public.notes WHERE user_template_id IS NOT NULL;
