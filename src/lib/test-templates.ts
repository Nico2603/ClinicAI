// Test simple para verificar la funcionalidad de plantillas
import { supabase } from './supabase';

export const testBasicTemplateCreation = async () => {
  try {
    console.log('🧪 Iniciando test básico de creación de plantillas...');
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      throw new Error('Usuario no autenticado');
    }
    console.log('✅ Usuario autenticado:', user.id);

    // 2. Asegurar que el usuario existe en la tabla
    const { error: ensureError } = await supabase.rpc('ensure_user_exists');
    if (ensureError) {
      console.warn('⚠️ Advertencia en ensure_user_exists:', ensureError);
    } else {
      console.log('✅ Usuario verificado en tabla');
    }

    // 3. Crear plantilla de prueba
    const testTemplateName = `Test Plantilla ${Date.now()}`;
    const testTemplateContent = `Motivo de consulta: [MOTIVO]
Examen físico: [EXAMEN]
Diagnóstico: [DIAGNOSTICO]
Plan: [PLAN]`;

    console.log('🔄 Creando plantilla de prueba...');
    const { data: templateId, error: createError } = await supabase
      .rpc('create_user_template', {
        template_name: testTemplateName,
        template_content: testTemplateContent
      });

    if (createError) {
      throw createError;
    }

    console.log('✅ Plantilla creada con ID:', templateId);

    // 4. Verificar que la plantilla fue creada correctamente
    const { data: createdTemplate, error: fetchError } = await supabase
      .from('user_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    console.log('✅ Plantilla verificada:', createdTemplate.name);

    // 5. Obtener todas las plantillas del usuario
    const { data: allTemplates, error: listError } = await supabase
      .rpc('get_user_templates_fast');

    if (listError) {
      throw listError;
    }

    console.log(`✅ Total de plantillas del usuario: ${allTemplates?.length || 0}`);

    return {
      success: true,
      templateId,
      createdTemplate,
      totalTemplates: allTemplates?.length || 0
    };

  } catch (error) {
    console.error('❌ Error en test básico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función para hacer disponible el test en la consola
export const setupTemplateTest = () => {
  if (typeof window !== 'undefined') {
    (window as any).testTemplates = {
      runBasicTest: testBasicTemplateCreation,
      help: () => {
        console.log('🧪 Funciones de test disponibles:');
        console.log('testTemplates.runBasicTest() - Ejecutar test básico de plantillas');
      }
    };
    console.log('🧪 Test de plantillas configurado. Usa testTemplates.help() para más info.');
  }
}; 