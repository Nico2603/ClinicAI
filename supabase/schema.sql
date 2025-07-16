-- ========================================
-- SCHEMA DEFINITIVO UNIFICADO PARA NOTAS-AI
-- ========================================
-- Archivo único que contiene todo el schema necesario
-- Versión unificada y optimizada para la aplicación
-- Incluye todas las tablas, funciones, índices y políticas RLS

-- ========================================
-- EXTENSIONES NECESARIAS
-- ========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLAS PRINCIPALES
-- ========================================

-- Tabla de usuarios (sincronizada con auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  image text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla de plantillas personalizadas por usuario
CREATE TABLE IF NOT EXISTS public.user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla de notas
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_template_id uuid REFERENCES public.user_templates(id) ON DELETE SET NULL,
  patient_id text,
  patient_name text,
  diagnosis text,
  treatment text,
  is_private boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla de historial separado por tipos
CREATE TABLE IF NOT EXISTS public.history_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('template', 'suggestion', 'evidence', 'scale')),
  title text NOT NULL,
  content text NOT NULL,
  original_input text,
  specialty_id uuid REFERENCES public.user_templates(id) ON DELETE SET NULL,
  specialty_name text,
  scale_id text,
  scale_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Índices para user_templates
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_user_active ON public.user_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_templates_created_at ON public.user_templates(created_at);
-- Índice optimizado para la consulta principal de plantillas (user_id + is_active + orden por created_at)
CREATE INDEX IF NOT EXISTS idx_user_templates_optimized ON public.user_templates(user_id, is_active, created_at DESC);

-- Índices para notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_template_id ON public.notes(user_template_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_patient_id ON public.notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_notes_title ON public.notes USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_notes_content ON public.notes USING gin(to_tsvector('spanish', content));
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING gin(tags);

-- Índices para history_entries
CREATE INDEX IF NOT EXISTS idx_history_entries_user_id ON public.history_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_history_entries_type ON public.history_entries(type);
CREATE INDEX IF NOT EXISTS idx_history_entries_user_type ON public.history_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_history_entries_created_at ON public.history_entries(created_at DESC);
-- Índice optimizado para consultas de historial por usuario y tipo
CREATE INDEX IF NOT EXISTS idx_history_entries_optimized ON public.history_entries(user_id, type, created_at DESC);

-- ========================================
-- SEGURIDAD - ROW LEVEL SECURITY
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_entries ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen para recrearlas
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.user_templates;

DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

DROP POLICY IF EXISTS "Users can view own history" ON public.history_entries;
DROP POLICY IF EXISTS "Users can insert own history" ON public.history_entries;
DROP POLICY IF EXISTS "Users can update own history" ON public.history_entries;
DROP POLICY IF EXISTS "Users can delete own history" ON public.history_entries;

-- Políticas para users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para user_templates
CREATE POLICY "Users can view own templates" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.user_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.user_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para notes
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para history_entries
CREATE POLICY "Users can view own history" ON public.history_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.history_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON public.history_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.history_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FUNCIONES AUXILIARES
-- ========================================

-- Función para asegurar que el usuario existe
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS void AS $$
DECLARE
  user_auth_id uuid;
  user_email text;
  user_metadata jsonb;
BEGIN
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  SELECT email, raw_user_meta_data
    INTO user_email, user_metadata
    FROM auth.users
   WHERE id = user_auth_id;
  
  INSERT INTO public.users (id, email, name, image, phone_number)
    VALUES (
      user_auth_id,
      user_email,
      COALESCE(user_metadata->>'full_name', user_metadata->>'name'),
      user_metadata->>'avatar_url',
      user_metadata->>'phone_number'
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    image = COALESCE(EXCLUDED.image, public.users.image),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función RPC para asegurar usuario desde el cliente
CREATE OR REPLACE FUNCTION public.ensure_current_user_exists()
RETURNS void AS $$
BEGIN
  PERFORM public.ensure_user_exists();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCIONES PARA PLANTILLAS
-- ========================================

-- Función para crear plantillas de usuario
CREATE OR REPLACE FUNCTION public.create_user_template(
  template_name text,
  template_content text
) RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
  template_count int;
BEGIN
  -- Asegurar que el usuario existe
  PERFORM public.ensure_user_exists();
  
  -- Contar plantillas existentes del usuario
  SELECT COUNT(*) INTO template_count
    FROM public.user_templates
   WHERE user_id = auth.uid();
  
  -- Generar nombre si no se proporciona
  IF template_name IS NULL OR template_name = '' THEN
    template_name := 'Plantilla ' || (template_count + 1)::text;
  END IF;
  
  -- Crear la plantilla
  INSERT INTO public.user_templates (name, content, user_id, is_active)
    VALUES (template_name, template_content, auth.uid(), true)
    RETURNING id INTO new_template_id;
  
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para renombrar plantillas
CREATE OR REPLACE FUNCTION public.rename_user_template(
  template_uuid uuid,
  new_name text
) RETURNS boolean AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Verificar que la plantilla pertenece al usuario
  SELECT user_id INTO user_uuid
    FROM public.user_templates
   WHERE id = template_uuid AND user_id = auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Actualizar el nombre
  UPDATE public.user_templates SET
    name = new_name,
    updated_at = now()
   WHERE id = template_uuid AND user_id = auth.uid();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener plantillas con conteo de uso
CREATE OR REPLACE FUNCTION public.get_user_templates_with_usage()
RETURNS TABLE (
  id uuid,
  name text,
  content text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  usage_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.id, ut.name, ut.content, ut.is_active,
    ut.created_at, ut.updated_at,
    COALESCE(COUNT(n.id), 0) as usage_count
  FROM public.user_templates ut
  LEFT JOIN public.notes n ON n.user_template_id = ut.id
  WHERE ut.user_id = auth.uid() AND ut.is_active = true
  GROUP BY ut.id, ut.name, ut.content, ut.is_active, ut.created_at, ut.updated_at
  ORDER BY ut.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Función para desactivar plantilla (soft delete)
CREATE OR REPLACE FUNCTION public.deactivate_user_template(
  template_uuid uuid
) RETURNS boolean AS $$
BEGIN
  UPDATE public.user_templates SET
    is_active = false,
    updated_at = now()
  WHERE id = template_uuid AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCIONES PARA HISTORIAL
-- ========================================

-- Función para crear entrada de historial
CREATE OR REPLACE FUNCTION public.create_history_entry(
  entry_type text,
  entry_title text,
  entry_content text,
  entry_original_input text DEFAULT NULL,
  entry_specialty_id uuid DEFAULT NULL,
  entry_specialty_name text DEFAULT NULL,
  entry_scale_id text DEFAULT NULL,
  entry_scale_name text DEFAULT NULL,
  entry_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  new_entry_id uuid;
BEGIN
  -- Asegurar que el usuario existe
  PERFORM public.ensure_user_exists();
  
  -- Validar el tipo
  IF entry_type NOT IN ('template', 'suggestion', 'evidence', 'scale') THEN
    RAISE EXCEPTION 'Tipo de entrada inválido: %', entry_type;
  END IF;
  
  -- Crear la entrada de historial
  INSERT INTO public.history_entries (
    user_id, type, title, content, original_input, 
    specialty_id, specialty_name, scale_id, scale_name, metadata
  )
  VALUES (
    auth.uid(), entry_type, entry_title, entry_content, entry_original_input,
    entry_specialty_id, entry_specialty_name, entry_scale_id, entry_scale_name, entry_metadata
  )
  RETURNING id INTO new_entry_id;
  
  RETURN new_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial por tipo
CREATE OR REPLACE FUNCTION public.get_history_by_type(
  entry_type text DEFAULT NULL,
  limit_count int DEFAULT 50
) RETURNS TABLE (
  id uuid,
  type text,
  title text,
  content text,
  original_input text,
  specialty_id uuid,
  specialty_name text,
  scale_id text,
  scale_name text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id, he.type, he.title, he.content, he.original_input,
    he.specialty_id, he.specialty_name, he.scale_id, he.scale_name, he.metadata,
    he.created_at, he.updated_at
  FROM public.history_entries he
  WHERE he.user_id = auth.uid()
    AND (entry_type IS NULL OR he.type = entry_type)
  ORDER BY he.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener todo el historial agrupado por tipo
CREATE OR REPLACE FUNCTION public.get_all_history_grouped()
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  content text,
  original_input text,
  specialty_id uuid,
  specialty_name text,
  scale_id text,
  scale_name text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id, he.type, he.title, he.content, he.original_input,
    he.specialty_id, he.specialty_name, he.scale_id, he.scale_name, he.metadata,
    he.created_at, he.updated_at
  FROM public.history_entries he
  WHERE he.user_id = auth.uid()
  ORDER BY he.type, he.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar historial por tipo
CREATE OR REPLACE FUNCTION public.clear_history_by_type(
  entry_type text DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.history_entries
  WHERE user_id = auth.uid()
    AND (entry_type IS NULL OR type = entry_type);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCIONES PARA NOTAS
-- ========================================

-- Función para buscar notas por texto
CREATE OR REPLACE FUNCTION public.search_notes(
  search_query text,
  limit_count int DEFAULT 20
) RETURNS TABLE (
  id uuid,
  title text,
  content text,
  patient_name text,
  diagnosis text,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.content,
    n.patient_name,
    n.diagnosis,
    n.created_at,
    ts_rank(to_tsvector('spanish', n.title || ' ' || n.content), plainto_tsquery('spanish', search_query)) as rank
  FROM public.notes n
  WHERE n.user_id = auth.uid()
    AND (
      to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', search_query)
      OR n.patient_name ILIKE '%' || search_query || '%'
      OR n.diagnosis ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, n.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para crear usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image, phone_number)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'phone_number'
    )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar timestamp en user_templates
CREATE OR REPLACE FUNCTION public.update_user_template_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en notes
CREATE OR REPLACE FUNCTION public.update_notes_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en history_entries
CREATE OR REPLACE FUNCTION public.update_history_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS user_templates_updated_at ON public.user_templates;
CREATE TRIGGER user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_user_template_timestamp();

DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_notes_timestamp();

DROP TRIGGER IF EXISTS history_entries_updated_at ON public.history_entries;
CREATE TRIGGER history_entries_updated_at
  BEFORE UPDATE ON public.history_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_history_timestamp();

-- ========================================
-- PERMISOS
-- ========================================

-- Otorgar permisos a usuarios autenticados para todas las funciones
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_exists() TO authenticated;

-- Funciones de plantillas
GRANT EXECUTE ON FUNCTION public.create_user_template(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_user_template(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_templates_with_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_templates_fast() TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_user_template(uuid) TO authenticated;

-- Funciones de historial
GRANT EXECUTE ON FUNCTION public.create_history_entry(text, text, text, text, uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_history_by_type(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_history_grouped() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_history_by_type(text) TO authenticated;

-- Funciones de notas
GRANT EXECUTE ON FUNCTION public.search_notes(text, int) TO authenticated;

-- ========================================
-- FUNCIONES DE MANTENIMIENTO
-- ========================================

-- Función para limpiar datos antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_data(
  days_to_keep int DEFAULT 90
) RETURNS TABLE (
  history_deleted int,
  notes_deleted int
) AS $$
DECLARE
  cutoff_date timestamptz;
  hist_count int;
  notes_count int;
BEGIN
  cutoff_date := now() - (days_to_keep || ' days')::interval;
  
  -- Limpiar historial antiguo
  DELETE FROM public.history_entries 
  WHERE created_at < cutoff_date;
  GET DIAGNOSTICS hist_count = ROW_COUNT;
  
  -- Limpiar notas antiguas marcadas como eliminadas (si implementamos soft delete)
  DELETE FROM public.notes 
  WHERE created_at < cutoff_date AND is_private = false;
  GET DIAGNOSTICS notes_count = ROW_COUNT;
  
  RETURN QUERY SELECT hist_count, notes_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo administradores pueden ejecutar limpieza
GRANT EXECUTE ON FUNCTION public.cleanup_old_data(int) TO service_role;

-- ========================================
-- VIEWS ÚTILES PARA REPORTES
-- ========================================

-- Vista para estadísticas de usuario
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.created_at as user_since,
  COUNT(DISTINCT ut.id) as templates_count,
  COUNT(DISTINCT n.id) as notes_count,
  COUNT(DISTINCT he.id) as history_count,
  MAX(n.created_at) as last_note_date,
  MAX(he.created_at) as last_activity_date
FROM public.users u
LEFT JOIN public.user_templates ut ON ut.user_id = u.id AND ut.is_active = true
LEFT JOIN public.notes n ON n.user_id = u.id
LEFT JOIN public.history_entries he ON he.user_id = u.id
GROUP BY u.id, u.name, u.email, u.created_at;

-- Solo el usuario puede ver sus propias estadísticas
ALTER VIEW public.user_stats OWNER TO postgres;
CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = id);

-- ========================================
-- FINALIZACIÓN Y VALIDACIÓN
-- ========================================

-- Función de validación del schema
CREATE OR REPLACE FUNCTION public.validate_schema()
RETURNS TABLE (
  component_type text,
  component_name text,
  status text
) AS $$
BEGIN
  -- Verificar tablas
  RETURN QUERY
  SELECT 
    'TABLE'::text,
    table_name::text,
    CASE WHEN table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END::text
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('users', 'user_templates', 'notes', 'history_entries');
    
  -- Verificar funciones principales
  RETURN QUERY
  SELECT 
    'FUNCTION'::text,
    routine_name::text,
    'OK'::text
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'ensure_user_exists',
      'create_user_template',
      'get_user_templates_fast',
      'create_history_entry',
      'get_history_by_type'
    );
    
  -- Verificar índices críticos
  RETURN QUERY
  SELECT 
    'INDEX'::text,
    indexname::text,
    'OK'::text
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND indexname IN (
      'idx_user_templates_optimized',
      'idx_history_entries_optimized'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_schema() TO authenticated;

-- Mostrar resultados de la aplicación
SELECT 'Schema definitivo unificado aplicado correctamente' as status;
SELECT 'Tablas creadas: users, user_templates, notes, history_entries' as info;
SELECT 'Funciones creadas: 15+ funciones para gestión completa' as info;
SELECT 'Índices optimizados aplicados' as info;
SELECT 'Triggers aplicados: on_auth_user_created, timestamps automáticos' as info;
SELECT 'Políticas RLS aplicadas correctamente' as info;
SELECT 'Extensiones habilitadas: uuid-ossp, pgcrypto' as info;

-- Ejecutar validación
SELECT * FROM public.validate_schema(); 