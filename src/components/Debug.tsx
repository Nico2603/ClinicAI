'use client';

// Extender Window para debugging
declare global {
  interface Window {
    debugDB?: {
      info: () => void;
      help: () => void;
    };
  }
}

// Componente de debugging simplificado - Solo para desarrollo
export const Debug = () => {
  // No hacer nada en producción para evitar errores de listener
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Solo agregar funciones básicas en desarrollo sin operaciones pesadas
  if (typeof window !== 'undefined' && !window.debugDB) {
    window.debugDB = {
      info: () => console.log('🛠️ Debug mode enabled. Basic functions available.'),
      help: () => console.log('Use debugDB.info() for debug information')
    };

    // Configurar test de plantillas básico
    import('@/lib/test-templates').then(({ setupTemplateTest }) => {
      setupTemplateTest();
    });
  }

  return null; // No renderiza nada
};

// Función de utilidad simplificada para crear plantillas
export const createTemplateSimple = async (name: string, content: string) => {
  try {
    const { supabase } = await import('@/lib/supabase');
    console.log('🔄 Creando plantilla...');
    
    const { data: templateId, error } = await supabase
      .rpc('create_user_template', {
        template_name: name.trim(),
        template_content: content.trim()
      });

    if (error) throw error;

    console.log('✅ Plantilla creada exitosamente');
    return templateId;
  } catch (error) {
    console.error('❌ Error al crear plantilla:', error);
    throw error;
  }
}; 