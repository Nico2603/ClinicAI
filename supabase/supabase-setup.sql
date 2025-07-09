-- Comprehensive Supabase setup script
-- Combines base schema and user-creation fixes
-- Based on supabase-setup.sql :contentReference[oaicite:0]{index=0} and fix-user-creation.sql :contentReference[oaicite:1]{index=1}

-- ========================================
-- TABLES
-- ========================================

-- users table (sync’d with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE,
  name text,
  image text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- profiles table (eliminada)
-- CREATE TABLE IF NOT EXISTS public.profiles (
--   user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   name text,
--   phone_number text,
--   avatar_url text,
--   specialty text,
--   license_number text,
--   institution text,
--   bio text,
--   created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
--   updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
-- );

-- specialties
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- templates (predefined, kept empty)
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  specialty_id uuid NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- user_templates (custom by user)
CREATE TABLE IF NOT EXISTS public.user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- notes
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
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
-- INDEXES
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
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- DROP EXISTING POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own profile"      ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"    ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"    ON public.users;

-- DROP POLICY IF EXISTS "Users can view own profile"      ON public.profiles;
-- DROP POLICY IF EXISTS "Users can update own profile"    ON public.profiles;
-- DROP POLICY IF EXISTS "Users can insert own profile"    ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view specialties"     ON public.specialties;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.templates;

DROP POLICY IF EXISTS "Users can view own user_templates"  ON public.user_templates;
DROP POLICY IF EXISTS "Users can insert own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can update own user_templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can delete own user_templates" ON public.user_templates;

DROP POLICY IF EXISTS "Users can view own notes"       ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes"     ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes"     ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes"     ON public.notes;

-- ========================================
-- CREATE POLICIES
-- ========================================
-- users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles
-- CREATE POLICY "Users can view own profile" ON public.profiles
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update own profile" ON public.profiles
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own profile" ON public.profiles
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- specialties
CREATE POLICY "Anyone can view specialties" ON public.specialties
  FOR SELECT USING (true);

-- templates
CREATE POLICY "Anyone can view active templates" ON public.templates
  FOR SELECT USING (is_active = true);

-- user_templates
CREATE POLICY "Users can view own user_templates"  ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_templates" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_templates" ON public.user_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_templates" ON public.user_templates
  FOR DELETE USING (auth.uid() = user_id);

-- notes
CREATE POLICY "Users can view own notes"   ON public.notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS
-- ========================================

-- default template for new users
CREATE OR REPLACE FUNCTION public.create_default_user_template(user_uuid uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_templates WHERE user_id = user_uuid
  ) THEN
    INSERT INTO public.user_templates (
      name, content, user_id, is_active
    ) VALUES (
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
[Evolución de los síntomas]

REVISIÓN POR SISTEMAS:
[Síntomas por sistemas]

ANTECEDENTES:
- Personales: [Enfermedades previas]
- Farmacológicos: [Medicamentos, alergias]
- Familiares: [Antecedentes familiares]
- Sociales: [Hábitos, ocupación]

EXAMEN FÍSICO:
- Signos vitales: FC: ___, FR: ___, TA: ___/__ mmHg, T°: ___°C
- Aspecto general y sistemas relevantes

ANÁLISIS:
[Impresión diagnóstica]

PLAN:
1. Diagnóstico: [Estudios]
2. Tratamiento: [Plan terapéutico]
3. Educación al paciente
4. Seguimiento

MÉDICO: [Nombre]
FECHA: [Fecha]',
      user_uuid,
      true
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ensure user exists function
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
    name  = COALESCE(EXCLUDED.name, public.users.name),
    image = COALESCE(EXCLUDED.image, public.users.image),
    updated_at = now();
  PERFORM public.create_default_user_template(user_auth_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rename user template
CREATE OR REPLACE FUNCTION public.rename_user_template(
  template_uuid uuid,
  new_name text
) RETURNS boolean AS $$
DECLARE
  user_uuid uuid;
BEGIN
  SELECT user_id INTO user_uuid
    FROM public.user_templates
   WHERE id = template_uuid AND user_id = auth.uid();
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.user_templates SET
    name = new_name,
    updated_at = now()
   WHERE id = template_uuid AND user_id = auth.uid();
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create or patch user template (calls ensure_user_exists)
CREATE OR REPLACE FUNCTION public.create_user_template(
  template_name text,
  template_content text
) RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
  template_count  int;
BEGIN
  PERFORM public.ensure_user_exists();
  SELECT COUNT(*) INTO template_count
    FROM public.user_templates
   WHERE user_id = auth.uid();
  IF template_name IS NULL OR template_name = '' THEN
    template_name := 'Plantilla ' || (template_count + 1)::text;
  END IF;
  INSERT INTO public.user_templates (
    name, content, user_id, is_active
  ) VALUES (
    template_name, template_content, auth.uid(), true
  )
  RETURNING id INTO new_template_id;
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to ensure current user
CREATE OR REPLACE FUNCTION public.ensure_current_user_exists()
RETURNS void AS $$
BEGIN
  PERFORM public.ensure_user_exists();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get user templates with usage
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
    COALESCE(COUNT(n.id),0)
  FROM public.user_templates ut
  LEFT JOIN public.notes n
    ON n.user_template_id = ut.id
  WHERE ut.user_id = auth.uid() AND ut.is_active = true
  GROUP BY ut.id, ut.name, ut.content,
           ut.is_active, ut.created_at, ut.updated_at
  ORDER BY ut.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger handler for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, email, name, image, phone_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO NOTHING;
  PERFORM public.create_default_user_template(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- timestamp update trigger for user_templates
CREATE OR REPLACE FUNCTION public.update_user_template_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- GRANTS
-- ========================================
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_template(text, text) TO authenticated;

-- ========================================
-- TRIGGERS
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS user_templates_updated_at ON public.user_templates;
CREATE TRIGGER user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_user_template_timestamp();

-- ========================================
-- VIEWS
-- ========================================
CREATE OR REPLACE VIEW public.user_templates_view AS
SELECT
  ut.*,
  u.name  AS user_name,
  u.email AS user_email
FROM public.user_templates ut
JOIN public.users u ON ut.user_id = u.id
WHERE ut.is_active = true;

-- ========================================
-- INITIAL DATA
-- ========================================
INSERT INTO public.specialties (name, description) VALUES
  ('Medicina General','Atención médica integral y preventiva'),
  ('Personalizada','Plantillas creadas por el usuario')
ON CONFLICT (name) DO NOTHING;