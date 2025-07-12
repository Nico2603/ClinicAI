import { supabase } from '@/lib/supabase';

// Tipos para las entidades de la base de datos
export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  user_template_id?: string;
  patient_id?: string;
  patient_name?: string;
  diagnosis?: string;
  treatment?: string;
  is_private: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserTemplate {
  id: string;
  name: string;
  content: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  specialty_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Servicios para Notas
export const notesService = {
  // Obtener todas las notas del usuario
  getUserNotes: async (userId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
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
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchText}%,content.ilike.%${searchText}%,patient_name.ilike.%${searchText}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Servicios para Plantillas Personalizadas del Usuario
export const userTemplatesService = {
  // Obtener plantillas personalizadas del usuario
  getUserTemplates: async (userId: string): Promise<UserTemplate[]> => {
    const { data, error } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla personalizada
  createUserTemplate: async (userTemplate: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<UserTemplate> => {
    // Asegurarse de que el usuario exista en la tabla `users` para evitar errores de clave foránea
    // Usar la función RPC que tiene los permisos necesarios
    const { error: ensureError } = await supabase
      .rpc('ensure_user_exists');
    
    if (ensureError) {
      console.error('Error al asegurar que el usuario existe:', ensureError);
      throw ensureError;
    }

    const { data, error } = await supabase
      .from('user_templates')
      .insert({
        ...userTemplate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una plantilla personalizada
  updateUserTemplate: async (id: string, updates: Partial<Omit<UserTemplate, 'id' | 'created_at'>>): Promise<UserTemplate> => {
    const { data, error } = await supabase
      .from('user_templates')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar (desactivar) una plantilla personalizada
  deleteUserTemplate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('user_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Renombrar una plantilla personalizada
  renameUserTemplate: async (id: string, newName: string): Promise<UserTemplate> => {
    const { data, error } = await supabase
      .from('user_templates')
      .update({ 
        name: newName,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 

// Servicios para Especialidades
export const specialtiesService = {
  // Obtener todas las especialidades activas
  getSpecialties: async (): Promise<Specialty[]> => {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva especialidad
  createSpecialty: async (specialtyData: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>): Promise<Specialty> => {
    const { data, error } = await supabase
      .from('specialties')
      .insert({
        ...specialtyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una especialidad
  updateSpecialty: async (id: string, updates: Partial<Omit<Specialty, 'id' | 'created_at'>>): Promise<Specialty> => {
    const { data, error } = await supabase
      .from('specialties')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar (desactivar) una especialidad
  deleteSpecialty: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('specialties')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  }
};

// Servicios para Plantillas
export const templatesService = {
  // Obtener todas las plantillas activas
  getActiveTemplates: async (): Promise<Template[]> => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener plantillas por especialidad
  getTemplatesBySpecialty: async (specialtyId: string): Promise<Template[]> => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('specialty_id', specialtyId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla
  createTemplate: async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> => {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar una plantilla
  updateTemplate: async (id: string, updates: Partial<Omit<Template, 'id' | 'created_at'>>): Promise<Template> => {
    const { data, error } = await supabase
      .from('templates')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar (desactivar) una plantilla
  deleteTemplate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  }
}; 
