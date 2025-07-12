-- ========================================
-- SCHEMA DEFINITIVO PARA NOTAS-AI
-- ========================================
-- Archivo único que contiene todo el schema necesario
-- Simplificado y optimizado para la aplicación

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

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_user_active ON public.user_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_templates_created_at ON public.user_templates(created_at);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_template_id ON public.notes(user_template_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_patient_id ON public.notes(patient_id);

-- ========================================
-- SEGURIDAD - ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

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

-- Aplicar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS user_templates_updated_at ON public.user_templates;
CREATE TRIGGER user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_user_template_timestamp();

-- ========================================
-- PERMISOS
-- ========================================

-- Otorgar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_template(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_user_template(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_templates_with_usage() TO authenticated;

-- ========================================
-- FUNCIÓN RPC PARA ASEGURAR USUARIO
-- ========================================

CREATE OR REPLACE FUNCTION public.ensure_current_user_exists()
RETURNS void AS $$
BEGIN
  PERFORM public.ensure_user_exists();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_current_user_exists() TO authenticated;

-- ========================================
-- FINALIZACIÓN
-- ========================================

-- Mostrar resultado
SELECT 'Schema definitivo aplicado correctamente' as status;
SELECT 'Tablas creadas: users, user_templates, notes' as info;
SELECT 'Funciones creadas: ensure_user_exists, create_user_template, rename_user_template, get_user_templates_with_usage' as info;
SELECT 'Triggers aplicados: on_auth_user_created, user_templates_updated_at' as info;
SELECT 'Políticas RLS aplicadas correctamente' as info; 