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

export interface HistoryEntry {
  id: string;
  user_id: string;
  type: 'template' | 'suggestion' | 'evidence' | 'scale';
  title: string;
  content: string;
  original_input?: string;
  specialty_id?: string;
  specialty_name?: string;
  scale_id?: string;
  scale_name?: string;
  metadata?: Record<string, any>;
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
  // Obtener plantillas personalizadas del usuario (función optimizada)
  getUserTemplates: async (userId: string): Promise<UserTemplate[]> => {
    // Usar la función SQL optimizada para mejor rendimiento
    const { data, error } = await supabase
      .rpc('get_user_templates_fast');

    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla personalizada
  createUserTemplate: async (userTemplate: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<UserTemplate> => {
    try {
      // Usar la función RPC optimizada que maneja todo internamente
      const { data: templateId, error: rpcError } = await supabase
        .rpc('create_user_template', {
          template_name: userTemplate.name,
          template_content: userTemplate.content
        });

      if (rpcError) {
        console.error('Error en create_user_template RPC:', rpcError);
        throw rpcError;
      }

      // Obtener la plantilla creada
      const { data: newTemplate, error: selectError } = await supabase
        .from('user_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (selectError) {
        console.error('Error al obtener plantilla creada:', selectError);
        throw selectError;
      }

      return newTemplate;
    } catch (error) {
      console.error('Error en createUserTemplate:', error);
      throw error;
    }
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

// Servicios para Historial
export const historyService = {
  // Crear entrada de historial
  createHistoryEntry: async (entryData: {
    type: 'template' | 'suggestion' | 'evidence' | 'scale';
    title: string;
    content: string;
    original_input?: string;
    specialty_id?: string;
    specialty_name?: string;
    scale_id?: string;
    scale_name?: string;
    metadata?: Record<string, any>;
  }): Promise<HistoryEntry> => {
    const { data, error } = await supabase
      .rpc('create_history_entry', {
        entry_type: entryData.type,
        entry_title: entryData.title,
        entry_content: entryData.content,
        entry_original_input: entryData.original_input,
        entry_specialty_id: entryData.specialty_id,
        entry_specialty_name: entryData.specialty_name,
        entry_scale_id: entryData.scale_id,
        entry_scale_name: entryData.scale_name,
        entry_metadata: entryData.metadata || {}
      });

    if (error) throw error;
    
    // Obtener la entrada creada
    const { data: newEntry, error: fetchError } = await supabase
      .from('history_entries')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;
    return newEntry;
  },

  // Obtener historial por tipo
  getHistoryByType: async (type?: 'template' | 'suggestion' | 'evidence' | 'scale', limit: number = 50): Promise<HistoryEntry[]> => {
    const { data, error } = await supabase
      .rpc('get_history_by_type', {
        entry_type: type,
        limit_count: limit
      });

    if (error) throw error;
    return data || [];
  },

  // Obtener todo el historial agrupado
  getAllHistoryGrouped: async (): Promise<HistoryEntry[]> => {
    const { data, error } = await supabase
      .rpc('get_all_history_grouped');

    if (error) throw error;
    return data || [];
  },

  // Eliminar entrada de historial
  deleteHistoryEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('history_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Limpiar historial por tipo
  clearHistoryByType: async (type?: 'template' | 'suggestion' | 'evidence' | 'scale'): Promise<number> => {
    const { data, error } = await supabase
      .rpc('clear_history_by_type', {
        entry_type: type
      });

    if (error) throw error;
    return data || 0;
  },

  // Obtener conteos por tipo
  getHistoryCountsByType: async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from('history_entries')
      .select('type')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    
    const counts = {
      template: 0,
      suggestion: 0,
      evidence: 0,
      scale: 0
    };

    data?.forEach(entry => {
      if (entry.type in counts) {
        counts[entry.type as keyof typeof counts]++;
      }
    });

    return counts;
  }
}; 
