-- ========================================
-- NOTAS-AI: SISTEMA INTELIGENTE DE PLANTILLAS CLÍNICAS
-- Esquema final consolidado - Sistema 100% personalizado
-- ========================================

-- Crear tabla de usuarios (sincronizada con Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text UNIQUE,
  name text,
  image text,
  phone_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone_number text,
  avatar_url text,
  specialty text,
  license_number text,
  institution text,
  bio text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de especialidades (solo básicas para sistema personalizado)
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de plantillas (mantenida para compatibilidad, pero vacía)
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ★ TABLA PRINCIPAL: Plantillas personalizadas del usuario
CREATE TABLE IF NOT EXISTS public.user_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de notas (completa con soporte para plantillas personalizadas)
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  user_template_id uuid REFERENCES public.user_templates(id) ON DELETE SET NULL,
  patient_id text,
  patient_name text,
  diagnosis text,
  treatment text,
  is_private boolean DEFAULT true NOT NULL,
  tags text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================
CREATE INDEX IF NOT EXISTS specialties_name_idx ON public.specialties(name);
CREATE INDEX IF NOT EXISTS templates_specialty_id_idx ON public.templates(specialty_id);
CREATE INDEX IF NOT EXISTS templates_name_idx ON public.templates(name);
CREATE INDEX IF NOT EXISTS user_templates_user_id_idx ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS user_templates_name_idx ON public.user_templates(name);
CREATE INDEX IF NOT EXISTS user_templates_created_at_idx ON public.user_templates(created_at);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_specialty_id_idx ON public.notes(specialty_id);
CREATE INDEX IF NOT EXISTS notes_template_id_idx ON public.notes(template_id);
CREATE INDEX IF NOT EXISTS notes_user_template_id_idx ON public.notes(user_template_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS notes_patient_id_idx ON public.notes(patient_id);

-- ========================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view specialties" ON public.specialties;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can insert own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can update own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can delete own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

-- Crear políticas de seguridad
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view specialties" ON public.specialties
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active templates" ON public.templates
  FOR SELECT USING (is_active = true);

-- ★ POLÍTICAS PARA PLANTILLAS PERSONALIZADAS
CREATE POLICY "Users can view own user_templates" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_templates" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_templates" ON public.user_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_templates" ON public.user_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FUNCIONES DEL SISTEMA DE PLANTILLAS PERSONALIZADAS
-- ========================================

-- Función para crear plantilla por defecto para nuevos usuarios
CREATE OR REPLACE FUNCTION public.create_default_user_template(user_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Crear una plantilla por defecto solo si el usuario no tiene ninguna
  IF NOT EXISTS (SELECT 1 FROM public.user_templates WHERE user_id = user_uuid) THEN
    INSERT INTO public.user_templates (name, content, user_id, is_active)
    VALUES (
      'Plantilla 1',
      'NOTA CLÍNICA

DATOS DEL PACIENTE:
Nombre: [Nombre del paciente]
Edad: [Edad] años
Género: [Género]
Documento: [Tipo y número de documento]

MOTIVO DE CONSULTA:
[Descripción del motivo principal de la consulta]

HISTORIA DE LA ENFERMEDAD ACTUAL:
[Evolución temporal de los síntomas, características, factores desencadenantes, etc.]

REVISIÓN POR SISTEMAS:
[Síntomas asociados por sistemas]

ANTECEDENTES:
- Personales: [Enfermedades previas, cirugías, hospitalizaciones]
- Farmacológicos: [Medicamentos actuales, alergias]
- Familiares: [Antecedentes familiares relevantes]
- Sociales: [Hábitos, ocupación, estado civil]

EXAMEN FÍSICO:
- Signos vitales: FC: ___ lpm, FR: ___ rpm, TA: ___/__ mmHg, T°: ___°C, Sat O2: ___%
- Aspecto general: [Descripción del estado general del paciente]
- [Examen por sistemas relevantes]

ANÁLISIS:
[Impresión diagnóstica y diagnósticos diferenciales]

PLAN:
1. Diagnóstico:
   - [Estudios diagnósticos solicitados]
2. Tratamiento:
   - [Plan terapéutico]
3. Educación:
   - [Recomendaciones al paciente]
4. Control:
   - [Seguimiento programado]

MÉDICO: [Nombre del médico]
REGISTRO: [Número de registro médico]
FECHA: [Fecha de la consulta]',
      user_uuid,
      true
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para renombrar plantillas (ej. 'Plantilla 1' → 'Medicina Interna')
CREATE OR REPLACE FUNCTION public.rename_user_template(
    template_uuid uuid,
    new_name text
)
RETURNS boolean AS $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Verificar que la plantilla pertenece al usuario autenticado
    SELECT user_id INTO user_uuid 
    FROM public.user_templates 
    WHERE id = template_uuid AND user_id = auth.uid();
    
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Actualizar el nombre de la plantilla
    UPDATE public.user_templates 
    SET 
        name = new_name,
        updated_at = now()
    WHERE id = template_uuid AND user_id = auth.uid();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear nueva plantilla personalizada
CREATE OR REPLACE FUNCTION public.create_user_template(
    template_name text,
    template_content text
)
RETURNS uuid AS $$
DECLARE
    new_template_id uuid;
    template_count integer;
BEGIN
    -- Contar plantillas existentes del usuario para generar nombre automático si es necesario
    SELECT COUNT(*) INTO template_count 
    FROM public.user_templates 
    WHERE user_id = auth.uid();
    
    -- Si no se proporciona nombre, generar uno automático
    IF template_name IS NULL OR template_name = '' THEN
        template_name := 'Plantilla ' || (template_count + 1)::text;
    END IF;
    
    -- Crear la nueva plantilla
    INSERT INTO public.user_templates (name, content, user_id, is_active)
    VALUES (template_name, template_content, auth.uid(), true)
    RETURNING id INTO new_template_id;
    
    RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener plantillas del usuario con conteo de uso
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
        ut.id,
        ut.name,
        ut.content,
        ut.is_active,
        ut.created_at,
        ut.updated_at,
        COALESCE(COUNT(n.id), 0) as usage_count
    FROM public.user_templates ut
    LEFT JOIN public.notes n ON n.user_template_id = ut.id
    WHERE ut.user_id = auth.uid() AND ut.is_active = true
    GROUP BY ut.id, ut.name, ut.content, ut.is_active, ut.created_at, ut.updated_at
    ORDER BY ut.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función principal para crear usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Crear usuario en tabla users
  INSERT INTO public.users (id, email, name, image, phone_number)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'phone_number')
  ON CONFLICT (id) DO NOTHING;
  
  -- Crear plantilla por defecto para el nuevo usuario
  PERFORM public.create_default_user_template(new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS Y VISTAS
-- ========================================

-- Trigger para crear usuario y plantilla automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para actualizar timestamp en user_templates
CREATE OR REPLACE FUNCTION public.update_user_template_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_templates_updated_at ON public.user_templates;
CREATE TRIGGER user_templates_updated_at
    BEFORE UPDATE ON public.user_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_template_timestamp();

-- Vista para simplificar consultas de plantillas del usuario
CREATE OR REPLACE VIEW public.user_templates_view AS
SELECT 
    ut.*,
    u.name as user_name,
    u.email as user_email
FROM public.user_templates ut
JOIN public.users u ON ut.user_id = u.id
WHERE ut.is_active = true;

-- ========================================
-- DATOS INICIALES (SOLO ESPECIALIDADES BÁSICAS)
-- ========================================
INSERT INTO public.specialties (name, description) VALUES
  ('Medicina General', 'Atención médica integral y preventiva'),
  ('Personalizada', 'Plantillas creadas por el usuario')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- RESUMEN DEL SISTEMA IMPLEMENTADO
-- ========================================
-- ✅ Sistema 100% basado en plantillas personalizadas del usuario
-- ✅ Eliminación completa de plantillas predefinidas
-- ✅ Solo 2 especialidades básicas mantenidas
-- ✅ Plantilla por defecto 'Plantilla 1' para todos los usuarios
-- ✅ Sistema de renombrado (ej. 'Plantilla 1' → 'Medicina Interna')
-- ✅ Creación ilimitada de plantillas personalizadas
-- ✅ Funciones SQL para gestión avanzada de plantillas
-- ✅ Seguridad RLS completa
-- ✅ Triggers automáticos para timestamps y nuevos usuarios
-- ✅ Vista optimizada para consultas de plantillas 