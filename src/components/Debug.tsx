'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Componente de debugging que expone funciones de prueba globalmente
export const Debug = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Funciones de diagnóstico disponibles en la consola
      (window as any).debugDB = {
        // Prueba básica de conexión
        testConnection: async () => {
          console.log('🔍 Probando conexión...');
          const start = Date.now();
          try {
            const { data, error } = await supabase
              .from('user_templates')
              .select('id')
              .limit(1);
            const duration = Date.now() - start;
            console.log(`✅ Conexión OK (${duration}ms)`, { data, error });
            return { success: !error, duration, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error de conexión (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Probar autenticación
        testAuth: async () => {
          console.log('🔐 Probando autenticación...');
          const start = Date.now();
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            const duration = Date.now() - start;
            console.log(`✅ Auth OK (${duration}ms)`, { userId: user?.id, error });
            return { success: !error && !!user, duration, userId: user?.id, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error de auth (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Verificar usuario en tabla public.users
        checkUserExists: async () => {
          console.log('👤 Verificando usuario en tabla...');
          const start = Date.now();
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) throw new Error('No autenticado');

            const { data, error } = await supabase
              .from('users')
              .select('id, email, created_at')
              .eq('id', user.id)
              .single();

            const duration = Date.now() - start;
            console.log(`✅ Usuario en tabla (${duration}ms)`, { exists: !!data, data, error });
            return { success: !error, duration, exists: !!data, data, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error verificando usuario (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Prueba ensure_user_exists con timeout corto
        testEnsureUser: async () => {
          console.log('👤 Probando ensure_user_exists...');
          const start = Date.now();
          try {
            const { error } = await supabase.rpc('ensure_user_exists');
            const duration = Date.now() - start;
            console.log(`✅ ensure_user_exists OK (${duration}ms)`, { error });
            return { success: !error, duration, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error en ensure_user_exists (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Prueba create_user_template RPC
        testCreateRPC: async (name = `Test ${Date.now()}`, content = 'Contenido de prueba') => {
          console.log('📄 Probando create_user_template RPC...');
          const start = Date.now();
          try {
            const { data: templateId, error } = await supabase.rpc('create_user_template', {
              template_name: name,
              template_content: content
            });
            const duration = Date.now() - start;
            console.log(`✅ create_user_template RPC OK (${duration}ms)`, { templateId, error });
            return { success: !error, duration, templateId, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error en create_user_template RPC (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Método de INSERT directo más optimizado
        createDirectInsert: async (name = `Direct ${Date.now()}`, content = 'Contenido directo') => {
          console.log('⚡ Probando INSERT directo optimizado...');
          const start = Date.now();
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) throw new Error('No autenticado');

            // Verificar si usuario existe en public.users
            const { data: userExists } = await supabase
              .from('users')
              .select('id')
              .eq('id', user.id)
              .single();

            if (!userExists) {
              console.log('Usuario no existe en tabla, creando...');
              const { error: insertUserError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.full_name || user.user_metadata?.name,
                  image: user.user_metadata?.avatar_url
                });
              
              if (insertUserError) {
                console.error('Error creando usuario:', insertUserError);
                // Intentar con RPC si falla INSERT directo
                const { error: rpcError } = await supabase.rpc('ensure_user_exists');
                if (rpcError) throw rpcError;
              }
            }

            // Insertar plantilla directamente
            const { data, error } = await supabase
              .from('user_templates')
              .insert({
                name,
                content,
                user_id: user.id,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            const duration = Date.now() - start;
            console.log(`✅ INSERT directo optimizado OK (${duration}ms)`, data);
            return { success: !error, duration, data, error: error?.message };
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Error en INSERT directo optimizado (${duration}ms):`, err);
            return { success: false, duration, error: err };
          }
        },

        // Ejecutar diagnóstico completo paso a paso
        runAll: async () => {
          console.log('🧪 Ejecutando diagnóstico completo...');
          
          const connection = await (window as any).debugDB.testConnection();
          console.log('1️⃣ Conexión:', connection.success ? '✅' : '❌', `${connection.duration}ms`);

          const auth = await (window as any).debugDB.testAuth();
          console.log('2️⃣ Autenticación:', auth.success ? '✅' : '❌', `${auth.duration}ms`);

          if (!auth.success) {
            console.log('❌ Auth falló, deteniendo diagnóstico');
            return { connection, auth };
          }

          const userExists = await (window as any).debugDB.checkUserExists();
          console.log('3️⃣ Usuario en tabla:', userExists.exists ? '✅' : '❌', `${userExists.duration}ms`);

          const ensureUser = await (window as any).debugDB.testEnsureUser();
          console.log('4️⃣ ensure_user_exists:', ensureUser.success ? '✅' : '❌', `${ensureUser.duration}ms`);

          const createRPC = await (window as any).debugDB.testCreateRPC();
          console.log('5️⃣ create_user_template RPC:', createRPC.success ? '✅' : '❌', `${createRPC.duration}ms`);

          const directInsert = await (window as any).debugDB.createDirectInsert();
          console.log('6️⃣ INSERT directo:', directInsert.success ? '✅' : '❌', `${directInsert.duration}ms`);

          const results = { connection, auth, userExists, ensureUser, createRPC, directInsert };
          
          console.log('📊 Resumen completo:');
          console.table({
            'Conexión': { '✅/❌': connection.success ? '✅' : '❌', 'Tiempo': `${connection.duration}ms` },
            'Auth': { '✅/❌': auth.success ? '✅' : '❌', 'Tiempo': `${auth.duration}ms` },
            'Usuario existe': { '✅/❌': userExists.exists ? '✅' : '❌', 'Tiempo': `${userExists.duration}ms` },
            'ensure_user_exists': { '✅/❌': ensureUser.success ? '✅' : '❌', 'Tiempo': `${ensureUser.duration}ms` },
            'RPC create_template': { '✅/❌': createRPC.success ? '✅' : '❌', 'Tiempo': `${createRPC.duration}ms` },
            'INSERT directo': { '✅/❌': directInsert.success ? '✅' : '❌', 'Tiempo': `${directInsert.duration}ms` }
          });

          return results;
        }
      };

      console.log('🛠️ Funciones de debug disponibles:');
      console.log('debugDB.testConnection() - Probar conexión básica');
      console.log('debugDB.testAuth() - Probar autenticación');
      console.log('debugDB.checkUserExists() - Verificar usuario en tabla');
      console.log('debugDB.testEnsureUser() - Probar ensure_user_exists');
      console.log('debugDB.testCreateRPC() - Probar create_user_template RPC');
      console.log('debugDB.createDirectInsert() - Probar INSERT directo optimizado');
      console.log('debugDB.runAll() - Ejecutar diagnóstico completo');
    }
  }, []);

  return null; // No renderiza nada
};

// Función de utilidad para crear plantillas con método alternativo
export const createTemplateAlternative = async (name: string, content: string) => {
  try {
    console.log('🔄 Creando plantilla con método alternativo...');
    const start = Date.now();

    // Método 1: Asegurar usuario primero
    const { error: ensureError } = await supabase.rpc('ensure_user_exists');
    if (ensureError) throw ensureError;

    // Método 2: INSERT directo en lugar de RPC
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('user_templates')
      .insert({
        name: name.trim(),
        content: content.trim(),
        user_id: user.user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const duration = Date.now() - start;
    console.log(`✅ Plantilla creada con método alternativo (${duration}ms)`);
    return data;
  } catch (error) {
    console.error('❌ Error en método alternativo:', error);
    throw error;
  }
}; 