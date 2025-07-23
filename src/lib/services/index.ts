// =============================================================================
// ÍNDICE PRINCIPAL DE SERVICIOS - ARQUITECTURA MIGRADA A ASSISTANTS
// =============================================================================

// Servicios principales (migrados a nueva arquitectura)
export * from './openaiService';
export * from './databaseService';
export * from './storageService';

// Nuevos servicios de la arquitectura mejorada
export * from './assistantsService';
export * from './contextManager';

// Schemas y validaciones
export * from '../schemas/medicalNoteSchemas';

// Sistema MCP eliminado (no requerido para la aplicación)

// Servicios especializados
export * from './templateCacheService';

// =============================================================================
// CONFIGURACIÓN DE LA NUEVA ARQUITECTURA
// =============================================================================

export const ARCHITECTURE_CONFIG = {
  version: '2.1.0',
  primaryMethod: 'assistants',
  fallbackMethods: ['legacy'],
  features: {
    assistantsAPI: true,
    contextOptimization: true,
    jsonSchemaValidation: true,
    legacyCompatibility: true,
    simplifiedFlow: true
  },
  performance: {
    maxTemplates: 50,
    maxContextTokens: 15000,
    optimizedForScale: true,
    coherenceGuaranteed: true,
    reducedComplexity: true
  }
};

// =============================================================================
// UTILIDADES DE MIGRACIÓN
// =============================================================================

/**
 * Función de verificación de servicios disponibles
 */
export const checkServicesAvailability = async () => {
  const services = {
    assistants: false,
    functionCalling: false,
    contextManager: false,
    legacy: false
  };

  try {
    // Verificar Assistant API
    const { getAssistantUsage } = await import('./assistantsService');
    await getAssistantUsage();
    services.assistants = true;
  } catch (error) {
    console.warn('⚠️ Assistant API no disponible:', error);
  }

  // Function Calling ahora está integrado en openaiService - simplificado
  services.functionCalling = true;

  try {
    // Verificar Context Manager
    const { getContextManagerStats } = await import('./contextManager');
    getContextManagerStats();
    services.contextManager = true;
  } catch (error) {
    console.warn('⚠️ Context Manager no disponible:', error);
  }

  try {
    // Verificar servicios legacy
    const { getServiceInfo } = await import('./openaiService');
    getServiceInfo();
    services.legacy = true;
  } catch (error) {
    console.warn('⚠️ Servicios legacy no disponibles:', error);
  }

  return services;
};

/**
 * Función para obtener estadísticas de la nueva arquitectura
 */
export const getArchitectureStats = async () => {
  const services = await checkServicesAvailability();
  
  let preferredMethod = 'legacy';
  if (services.assistants) {
    preferredMethod = 'assistants';
  }

  return {
    ...ARCHITECTURE_CONFIG,
    currentStatus: {
      servicesAvailable: services,
      preferredMethod,
      migrationComplete: services.assistants && services.contextManager,
      lastCheck: new Date().toISOString()
    }
  };
};

/**
 * Función para limpiar recursos de la nueva arquitectura
 */
export const cleanupArchitectureResources = async () => {
  const cleanupResults = {
    assistants: false,
    contextCache: false,
    templateCache: false
  };

  try {
    const { cleanupAssistants } = await import('./assistantsService');
    await cleanupAssistants();
    cleanupResults.assistants = true;
  } catch (error) {
    console.warn('⚠️ Error limpiando Assistants:', error);
  }

  try {
    const { clearContextCache } = await import('./contextManager');
    clearContextCache();
    cleanupResults.contextCache = true;
  } catch (error) {
    console.warn('⚠️ Error limpiando Context Cache:', error);
  }

  try {
    const { templateCacheService } = await import('./templateCacheService');
    templateCacheService.clear();
    cleanupResults.templateCache = true;
  } catch (error) {
    console.warn('⚠️ Error limpiando Template Cache:', error);
  }

  return cleanupResults;
};

// =============================================================================
// LOGGING Y MONITOREO
// =============================================================================

console.log('🚀 Servicios cargados con arquitectura simplificada:');
console.log('   ✅ OpenAI Service (Assistant API → Legacy fallback)');
console.log('   ✅ Assistants Service (OpenAI Assistants API)');
console.log('   ✅ Context Manager (optimización inteligente)');
console.log('   ✅ JSON Schema Validation');
console.log('   📊 Performance: Arquitectura simplificada, alta coherencia');

const architectureService = {
  config: ARCHITECTURE_CONFIG,
  checkAvailability: checkServicesAvailability,
  getStats: getArchitectureStats,
  cleanup: cleanupArchitectureResources
};

export default architectureService;