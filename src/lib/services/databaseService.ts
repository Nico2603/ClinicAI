import { supabase } from '@/lib/supabase';

// Tipos para las entidades de la base de datos
export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  specialtyId?: string;
  templateId?: string;
  patientId?: string;
  patientName?: string;
  diagnosis?: string;
  treatment?: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  specialty?: Specialty;
  template?: Template;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  specialtyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  specialty?: Specialty;
}

export interface UserProfile {
  id: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  specialty?: string;
  licenseNumber?: string;
  institution?: string;
  createdAt: string;
  updatedAt: string;
}

// Servicios para Notas
export const notesService = {
  // Obtener todas las notas del usuario
  getUserNotes: async (userId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('Note')
      .select(`
        *,
        specialty:Specialty(*),
        template:Template(*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva nota
  createNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const { data, error } = await supabase
      .from('Note')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una nota
  updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const { data, error } = await supabase
      .from('Note')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar una nota
  deleteNote: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('Note')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar notas por texto
  searchNotes: async (userId: string, searchText: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('Note')
      .select(`
        *,
        specialty:Specialty(*),
        template:Template(*)
      `)
      .eq('userId', userId)
      .or(`title.ilike.%${searchText}%,content.ilike.%${searchText}%,patientName.ilike.%${searchText}%`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Servicios para Especialidades
export const specialtiesService = {
  // Obtener todas las especialidades
  getSpecialties: async (): Promise<Specialty[]> => {
    const { data, error } = await supabase
      .from('Specialty')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva especialidad
  createSpecialty: async (specialty: Omit<Specialty, 'id' | 'createdAt' | 'updatedAt'>): Promise<Specialty> => {
    const { data, error } = await supabase
      .from('Specialty')
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
      .from('Template')
      .select(`
        *,
        specialty:Specialty(*)
      `)
      .eq('specialtyId', specialtyId)
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Obtener todas las plantillas activas
  getActiveTemplates: async (): Promise<Template[]> => {
    const { data, error } = await supabase
      .from('Template')
      .select(`
        *,
        specialty:Specialty(*)
      `)
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla
  createTemplate: async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    const { data, error } = await supabase
      .from('Template')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una plantilla
  updateTemplate: async (id: string, updates: Partial<Template>): Promise<Template> => {
    const { data, error } = await supabase
      .from('Template')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Servicios para Perfiles de Usuario
export const profileService = {
  // Obtener el perfil del usuario
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('Profile')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 es "no rows returned"
    return data;
  },

  // Crear o actualizar el perfil del usuario
  upsertUserProfile: async (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('Profile')
      .upsert(profile, { onConflict: 'userId' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 
