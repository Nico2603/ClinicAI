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

-- Crear tabla de especialidades
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de plantillas
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de notas
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  patient_id text,
  patient_name text,
  diagnosis text,
  treatment text,
  is_private boolean DEFAULT true NOT NULL,
  tags text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS specialties_name_idx ON public.specialties(name);
CREATE INDEX IF NOT EXISTS templates_specialty_id_idx ON public.templates(specialty_id);
CREATE INDEX IF NOT EXISTS templates_name_idx ON public.templates(name);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_specialty_id_idx ON public.notes(specialty_id);
CREATE INDEX IF NOT EXISTS notes_template_id_idx ON public.notes(template_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS notes_patient_id_idx ON public.notes(patient_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view specialties" ON public.specialties;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.templates;
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

CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Eliminar función y trigger existentes si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Función para crear usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image, phone_number)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'phone_number');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insertar especialidades por defecto (solo si no existen)
INSERT INTO public.specialties (name, description) VALUES
  ('Medicina General', 'Atención médica integral y preventiva'),
  ('Cardiología', 'Especialidad enfocada en el corazón y sistema cardiovascular'),
  ('Neurología', 'Diagnóstico y tratamiento del sistema nervioso'),
  ('Pediatría', 'Atención médica especializada en niños y adolescentes'),
  ('Ginecología', 'Salud reproductiva y del sistema reproductor femenino'),
  ('Traumatología', 'Lesiones del sistema musculoesquelético'),
  ('Dermatología', 'Enfermedades y afecciones de la piel'),
  ('Oftalmología', 'Cuidado integral de los ojos y la visión'),
  ('Psiquiatría', 'Salud mental y trastornos psiquiátricos'),
  ('Endocrinología', 'Trastornos hormonales y del sistema endocrino')
ON CONFLICT (name) DO NOTHING; 