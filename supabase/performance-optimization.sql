-- ========================================
-- OPTIMIZACIONES DE RENDIMIENTO PARA NOTAS-AI
-- ========================================
-- Script para aplicar índices optimizados y funciones para mejorar
-- el rendimiento de carga de plantillas de usuario

-- Índice optimizado para la consulta principal de plantillas
-- (user_id + is_active + orden por created_at)
CREATE INDEX IF NOT EXISTS idx_user_templates_optimized 
ON public.user_templates(user_id, is_active, created_at DESC);

-- Función optimizada para cargar plantillas del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_templates_fast()
RETURNS TABLE (
  id uuid,
  name text,
  content text,
  user_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Usar el índice optimizado para una consulta rápida
  RETURN QUERY
  SELECT 
    ut.id,
    ut.name,
    ut.content,
    ut.user_id,
    ut.is_active,
    ut.created_at,
    ut.updated_at
  FROM public.user_templates ut
  WHERE ut.user_id = auth.uid() 
    AND ut.is_active = true
  ORDER BY ut.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para la nueva función
GRANT EXECUTE ON FUNCTION public.get_user_templates_fast() TO authenticated;

-- Verificar que los índices existen
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_templates' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Verificar que la función existe
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_templates_fast';

-- Mensaje de confirmación
SELECT 'Optimizaciones de rendimiento aplicadas correctamente' as status; 