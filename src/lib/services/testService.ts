// Servicio de pruebas para debuggear problemas de base de datos
import { supabase } from '@/lib/supabase';

export const testService = {
  // Probar conexión básica a Supabase
  testConnection: async (): Promise<{ success: boolean; message: string; duration: number }> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('user_templates')
        .select('id')
        .limit(1);
      
      const duration = Date.now() - startTime;
      
      if (error) {
        return {
          success: false,
          message: `Error de conexión: ${error.message}`,
          duration
        };
      }
      
      return {
        success: true,
        message: 'Conexión exitosa',
        duration
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Error inesperado: ${err instanceof Error ? err.message : 'Desconocido'}`,
        duration
      };
    }
  },

  // Probar función ensure_user_exists
  testEnsureUser: async (): Promise<{ success: boolean; message: string; duration: number }> => {
    const startTime = Date.now();
    try {
      const { error } = await supabase.rpc('ensure_user_exists');
      const duration = Date.now() - startTime;
      
      if (error) {
        return {
          success: false,
          message: `Error en ensure_user_exists: ${error.message}`,
          duration
        };
      }
      
      return {
        success: true,
        message: 'ensure_user_exists ejecutado correctamente',
        duration
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Error inesperado en ensure_user_exists: ${err instanceof Error ? err.message : 'Desconocido'}`,
        duration
      };
    }
  },

  // Probar función create_user_template
  testCreateTemplate: async (name: string, content: string): Promise<{ success: boolean; message: string; duration: number; templateId?: string }> => {
    const startTime = Date.now();
    try {
      const { data: templateId, error } = await supabase.rpc('create_user_template', {
        template_name: name,
        template_content: content
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        return {
          success: false,
          message: `Error en create_user_template: ${error.message}`,
          duration
        };
      }
      
      return {
        success: true,
        message: 'Plantilla creada exitosamente',
        duration,
        templateId
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Error inesperado en create_user_template: ${err instanceof Error ? err.message : 'Desconocido'}`,
        duration
      };
    }
  },

  // Ejecutar todas las pruebas
  runAllTests: async () => {
    console.log('🧪 Iniciando pruebas de base de datos...');
    
    const connectionTest = await testService.testConnection();
    console.log('📡 Prueba de conexión:', connectionTest);
    
    if (!connectionTest.success) {
      console.log('❌ Falló la conexión básica, deteniendo pruebas');
      return { connectionTest };
    }
    
    const ensureUserTest = await testService.testEnsureUser();
    console.log('👤 Prueba ensure_user_exists:', ensureUserTest);
    
    const templateTest = await testService.testCreateTemplate(
      `Prueba ${Date.now()}`,
      'Contenido de prueba para verificar la funcionalidad'
    );
    console.log('📄 Prueba create_user_template:', templateTest);
    
    return {
      connectionTest,
      ensureUserTest,
      templateTest
    };
  }
};

// Para usar en la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testDB = testService;
} 