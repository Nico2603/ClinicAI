import { supabase } from '@/lib/supabase';

// Tipos para las entidades de la base de datos
export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  specialty_id?: string;
  template_id?: string;
  patient_id?: string;
  patient_name?: string;
  diagnosis?: string;
  treatment?: string;
  is_private: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  specialty?: Specialty;
  template?: Template;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  specialty_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  specialty?: Specialty;
}

export interface UserProfile {
  id: string; // Corresponde al user_id de auth.users
  name?: string;
  phone_number?: string;
  specialty?: string;
  license_number?: string;
  institution?: string;
  bio?: string;
  avatar_url?: string;
}

// Servicios para Notas
export const notesService = {
  // Obtener todas las notas del usuario
  getUserNotes: async (userId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        specialty:specialties(*),
        template:templates(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva nota
  createNote: async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una nota
  updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar una nota
  deleteNote: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar notas por texto
  searchNotes: async (userId: string, searchText: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        specialty:specialties(*),
        template:templates(*)
      `)
      .eq('user_id', userId)
      .or(`title.ilike.%${searchText}%,content.ilike.%${searchText}%,patient_name.ilike.%${searchText}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Servicios para Especialidades
export const specialtiesService = {
  // Obtener todas las especialidades
  getSpecialties: async (): Promise<Specialty[]> => {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva especialidad
  createSpecialty: async (specialty: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>): Promise<Specialty> => {
    const { data, error } = await supabase
      .from('specialties')
      .insert(specialty)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Servicios para Plantillas
export const templatesService = {
  // Obtener plantillas por especialidad
  getTemplatesBySpecialty: async (specialtyId: string): Promise<Template[]> => {
    const { data, error } = await supabase
      .from('templates')
      .select(`
        *,
        specialty:specialties(*)
      `)
      .eq('specialty_id', specialtyId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Obtener todas las plantillas activas
  getActiveTemplates: async (): Promise<Template[]> => {
    const { data, error } = await supabase
      .from('templates')
      .select(`
        *,
        specialty:specialties(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla
  createTemplate: async (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> => {
    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una plantilla
  updateTemplate: async (id: string, updates: Partial<Template>): Promise<Template> => {
    const { data, error } = await supabase
      .from('templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Servicios para Perfil de Usuario
export const userProfileService = {
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, phone_number, image')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('specialty, license_number, institution, bio')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile data:', profileError);
      throw profileError;
    }

    return {
      id: userId,
      name: userData?.name,
      phone_number: userData?.phone_number,
      avatar_url: userData?.image,
      specialty: profileData?.specialty,
      license_number: profileData?.license_number,
      institution: profileData?.institution,
      bio: profileData?.bio,
    };
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { name, phone_number, avatar_url, ...profileUpdates } = updates;
    
    const userUpdateData: { name?: string; phone_number?: string, image?: string } = {};
    if (name) userUpdateData.name = name;
    if (phone_number) userUpdateData.phone_number = phone_number;
    if (avatar_url) userUpdateData.image = avatar_url;

    if (Object.keys(userUpdateData).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update({ ...userUpdateData, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (userError) throw userError;
    }

    if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ user_id: userId, ...profileUpdates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
            .select()
            .single();
        if (profileError) throw profileError;
    }

    const updatedProfile = await userProfileService.getProfile(userId);
    if (!updatedProfile) throw new Error('No se pudo recuperar el perfil actualizado.');

    return updatedProfile;
  },
}; 
