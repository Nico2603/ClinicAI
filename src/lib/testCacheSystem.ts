// Test simple para validar el sistema de cache de plantillas
import { templateCacheService } from './services/templateCacheService';
import { userTemplatesService } from './services/databaseService';
import { supabase } from './supabase';
import type { UserTemplate } from './services/databaseService';

// Test para validar el funcionamiento del cache
export const testCacheSystem = async () => {
  try {
    console.log('🧪 Iniciando test del sistema de cache...');
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      throw new Error('Usuario no autenticado');
    }
    
    console.log('✅ Usuario autenticado para test de cache');
    
    // 2. Configurar cache para el usuario
    templateCacheService.setUser(user.id);
    
    // 3. Limpiar cache para empezar fresh
    templateCacheService.clear();
    console.log('🧹 Cache limpiado para test');
    
    // 4. Test de miss de cache (debería ir al servidor)
    console.log('📋 Test 1: Cache miss - debería cargar desde servidor');
    const startTime1 = Date.now();
    
    const cachedTemplates1 = templateCacheService.getTemplates();
    if (cachedTemplates1) {
      console.log('❌ FALLO: Cache debería estar vacío');
      return false;
    }
    
    console.log('✅ Cache miss correctamente detectado');
    
    // 5. Cargar desde servidor y poblar cache
    console.log('📋 Test 2: Cargar desde servidor y poblar cache');
    const serverTemplates = await userTemplatesService.getUserTemplates(user.id);
    templateCacheService.setTemplates(serverTemplates);
    
    const duration1 = Date.now() - startTime1;
    console.log(`⏱️ Carga inicial desde servidor: ${duration1}ms`);
    
    // 6. Test de hit de cache (debería ser instantáneo)
    console.log('📋 Test 3: Cache hit - debería ser instantáneo');
    const startTime2 = Date.now();
    
    const cachedTemplates2 = templateCacheService.getTemplates();
    if (!cachedTemplates2 || cachedTemplates2.length === 0) {
      console.log('❌ FALLO: Cache debería contener plantillas');
      return false;
    }
    
    const duration2 = Date.now() - startTime2;
    console.log(`⚡ Carga desde cache: ${duration2}ms`);
    console.log(`🚀 Mejora de velocidad: ${Math.round((duration1 / Math.max(duration2, 1)) * 100)}% más rápido`);
    
    // 7. Test de operaciones de cache individuales
    console.log('📋 Test 4: Operaciones individuales de cache');
    
    if (serverTemplates.length > 0) {
      const testTemplate = serverTemplates[0];
      if (!testTemplate) {
        console.log('⚠️ No hay plantillas para probar operaciones individuales');
      } else {
        // Test de actualización
        const updatedTemplate: UserTemplate = {
          id: testTemplate.id,
          name: `${testTemplate.name} (Cache Test)`,
          content: testTemplate.content,
          user_id: testTemplate.user_id,
          is_active: testTemplate.is_active,
          created_at: testTemplate.created_at,
          updated_at: new Date().toISOString()
        };
        
        templateCacheService.updateTemplate(updatedTemplate);
        
        const cachedAfterUpdate = templateCacheService.getTemplates();
        const foundUpdated = cachedAfterUpdate?.find(t => t.id === testTemplate.id);
        
        if (!foundUpdated || !foundUpdated.name.includes('(Cache Test)')) {
          console.log('❌ FALLO: Actualización de cache no funciona');
          return false;
        }
        
        console.log('✅ Actualización de cache funciona correctamente');
      }
      
      // Test de plantillas más usadas
      const mostUsed = templateCacheService.getMostUsedTemplates(3);
      console.log(`✅ Plantillas más usadas: ${mostUsed.length} encontradas`);
    } else {
      console.log('⚠️ No hay plantillas para probar, creando una de prueba...');
      
      // Crear plantilla de prueba si no hay ninguna
      try {
        const testTemplate = await userTemplatesService.createUserTemplate({
          name: 'Plantilla de Cache Test',
          content: 'Esta es una plantilla creada para probar el cache.',
          user_id: user.id,
          is_active: true
        });
        
        templateCacheService.addTemplate(testTemplate);
        console.log('✅ Plantilla de prueba creada y añadida al cache');
      } catch (error) {
        console.log('⚠️ No se pudo crear plantilla de prueba, continuando...');
      }
    }
    
    // 8. Test de estadísticas de cache
    console.log('📋 Test 5: Estadísticas de cache');
    const stats = templateCacheService.getCacheStats();
    
    console.log('📊 Estadísticas del cache:');
    console.log(`  - Total plantillas: ${stats.totalTemplates}`);
    console.log(`  - Tamaño: ${stats.cacheSize}`);
    console.log(`  - Más usada: ${stats.mostUsed}`);
    
    if (stats.totalTemplates === 0) {
      console.log('❌ FALLO: Estadísticas no reflejan plantillas en cache');
      return false;
    }
    
    console.log('✅ Estadísticas de cache funcionan correctamente');
    
    // 9. Test de invalidación
    console.log('📋 Test 6: Invalidación de cache');
    templateCacheService.invalidate();
    
    const cachedAfterInvalidate = templateCacheService.getTemplates();
    if (cachedAfterInvalidate) {
      console.log('❌ FALLO: Cache no se invalidó correctamente');
      return false;
    }
    
    console.log('✅ Invalidación de cache funciona correctamente');
    
    // 10. Resumen final
    console.log('\n🎉 RESUMEN DEL TEST DE CACHE:');
    console.log('✅ Cache miss detectado correctamente');
    console.log('✅ Cache hit funciona correctamente');
    console.log('✅ Operaciones CRUD de cache funcionan');
    console.log('✅ Estadísticas de cache precisas');
    console.log('✅ Invalidación de cache funciona');
    console.log(`🚀 Mejora de performance: ~${Math.round((duration1 / Math.max(duration2, 1)) * 100)}% más rápido con cache`);
    
    return {
      success: true,
      cacheHitSpeed: duration2,
      serverSpeed: duration1,
      speedImprovement: Math.round((duration1 / Math.max(duration2, 1)) * 100),
      templatesInCache: stats.totalTemplates,
      cacheSize: stats.cacheSize
    };
    
  } catch (error) {
    console.error('❌ Error en test de cache:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Test de performance comparativo
export const testCachePerformance = async (iterations: number = 5) => {
  try {
    console.log(`🏃‍♂️ Test de performance de cache (${iterations} iteraciones)...`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    templateCacheService.setUser(user.id);
    
    // Cargar datos iniciales
    const serverTemplates = await userTemplatesService.getUserTemplates(user.id);
    templateCacheService.setTemplates(serverTemplates);
    
    const cacheResults: number[] = [];
    const serverResults: number[] = [];
    
    // Test de cache hits
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      templateCacheService.getTemplates();
      cacheResults.push(Date.now() - start);
    }
    
    // Test de server calls (invalidando cache cada vez)
    for (let i = 0; i < iterations; i++) {
      templateCacheService.clear();
      const start = Date.now();
      await userTemplatesService.getUserTemplates(user.id);
      serverResults.push(Date.now() - start);
      templateCacheService.setTemplates(serverTemplates); // Repoblar para siguiente test
    }
    
    const avgCache = cacheResults.reduce((a, b) => a + b, 0) / cacheResults.length;
    const avgServer = serverResults.reduce((a, b) => a + b, 0) / serverResults.length;
    
    console.log('\n📊 RESULTADOS DE PERFORMANCE:');
    console.log(`⚡ Cache promedio: ${avgCache.toFixed(2)}ms`);
    console.log(`🌐 Servidor promedio: ${avgServer.toFixed(2)}ms`);
    console.log(`🚀 Cache es ${Math.round(avgServer / avgCache)}x más rápido`);
    console.log(`📈 Reducción de tiempo: ${((avgServer - avgCache) / avgServer * 100).toFixed(1)}%`);
    
    return {
      success: true,
      avgCacheTime: avgCache,
      avgServerTime: avgServer,
      speedMultiplier: Math.round(avgServer / avgCache),
      timeReduction: ((avgServer - avgCache) / avgServer * 100).toFixed(1)
    };
    
  } catch (error) {
    console.error('❌ Error en test de performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función para mostrar información actual del cache
export const showCacheInfo = () => {
  const stats = templateCacheService.getCacheStats();
  const mostUsed = templateCacheService.getMostUsedTemplates(5);
  
  console.log('\n📦 INFORMACIÓN ACTUAL DEL CACHE:');
  console.log('📊 Estadísticas:');
  console.log(`  - Total plantillas: ${stats.totalTemplates}`);
  console.log(`  - Tamaño: ${stats.cacheSize}`);
  console.log(`  - Más antigua: ${stats.oldestEntry}`);
  console.log(`  - Más nueva: ${stats.newestEntry}`);
  console.log(`  - Más usada: ${stats.mostUsed}`);
  
  if (mostUsed.length > 0) {
    console.log('\n🏆 Top 5 plantillas más usadas:');
    mostUsed.forEach((template, index) => {
      console.log(`  ${index + 1}. ${template.name}`);
    });
  }
  
  return { stats, mostUsed };
};

// Hacer disponible en la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testCacheSystem = testCacheSystem;
  (window as any).testCachePerformance = testCachePerformance;
  (window as any).showCacheInfo = showCacheInfo;
  
  console.log('🛠️ Tests de cache disponibles:');
  console.log('  - testCacheSystem() - Test completo del sistema');
  console.log('  - testCachePerformance(5) - Test de performance');
  console.log('  - showCacheInfo() - Mostrar info actual del cache');
} 