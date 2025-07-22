// =============================================================================
// VERIFICADOR DE ARQUITECTURA MIGRADA
// =============================================================================
// Script para verificar que la migración a Assistants API está completa

export const verifyArchitectureMigration = async (): Promise<{
  success: boolean;
  summary: string;
  details: {
    servicesAvailable: any;
    compatibilityCheck: boolean;
    performanceMetrics: any;
    recommendations: string[];
  };
}> => {
  console.log('🔍 Iniciando verificación de arquitectura migrada...');
  
  const results = {
    success: false,
    summary: '',
    details: {
      servicesAvailable: {},
      compatibilityCheck: false,
      performanceMetrics: {},
      recommendations: [] as string[]
    }
  };

  try {
    // 1. Verificar servicios disponibles
    console.log('📋 Verificando servicios disponibles...');
    
    const { checkServicesAvailability, getArchitectureStats } = await import('./services');
    
    const servicesCheck = await checkServicesAvailability();
    const architectureStats = await getArchitectureStats();
    
    results.details.servicesAvailable = servicesCheck;
    results.details.performanceMetrics = architectureStats;

    console.log('✅ Servicios verificados:', servicesCheck);

    // 2. Verificar compatibilidad hacia atrás
    console.log('🔄 Verificando compatibilidad...');
    
    try {
      const { getServiceInfo } = await import('./services/openaiService');
      const serviceInfo = getServiceInfo();
      
      results.details.compatibilityCheck = serviceInfo.version === '2.0.0' && 
                                           serviceInfo.architecture === 'hybrid';
      
      console.log('✅ Compatibilidad verificada:', serviceInfo);
    } catch (error) {
      console.warn('⚠️ Error verificando compatibilidad:', error);
      results.details.compatibilityCheck = false;
    }

    // 3. Generar recomendaciones
    const recommendations: string[] = [];
    
    if (servicesCheck.assistants) {
      recommendations.push('✅ Assistant API disponible - Rendimiento óptimo');
    } else {
      recommendations.push('⚠️ Assistant API no disponible - Verificar configuración');
    }
    
    if (servicesCheck.functionCalling) {
      recommendations.push('✅ Function Calling disponible - Fallback funcional');
    } else {
      recommendations.push('⚠️ Function Calling no disponible - Verificar integración');
    }
    
    if (servicesCheck.contextManager) {
      recommendations.push('✅ Context Manager activo - Escalabilidad garantizada');
    } else {
      recommendations.push('❌ Context Manager no disponible - Funcionalidad limitada');
    }
    
    if (servicesCheck.legacy) {
      recommendations.push('✅ Servicios legacy disponibles - Compatibilidad asegurada');
    } else {
      recommendations.push('❌ Servicios legacy no disponibles - Riesgo de fallos');
    }

    // 4. Determinar éxito general
    const criticalServices = [servicesCheck.legacy, servicesCheck.contextManager];
    const optimalServices = [servicesCheck.assistants, servicesCheck.functionCalling];
    
    const hasCritical = criticalServices.every(Boolean);
    const hasOptimal = optimalServices.some(Boolean);
    
    results.success = hasCritical && hasOptimal && results.details.compatibilityCheck;
    
    if (results.success) {
      results.summary = '🎉 Migración completada exitosamente. Nueva arquitectura 100% funcional.';
      recommendations.push('🚀 Sistema listo para producción con nueva arquitectura');
    } else if (hasCritical) {
      results.summary = '⚠️ Migración parcial. Funcionalidad básica disponible.';
      recommendations.push('🔧 Revisar configuración de servicios avanzados');
    } else {
      results.summary = '❌ Migración incompleta. Problemas críticos detectados.';
      recommendations.push('🚨 Revisar configuración básica antes de continuar');
    }
    
    results.details.recommendations = recommendations;
    
    console.log('📊 Verificación completada:', results.summary);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    results.success = false;
    results.summary = '❌ Error crítico durante la verificación';
    results.details.recommendations = [
      '🚨 Error crítico detectado durante la verificación',
      '🔧 Revisar configuración de imports y dependencias',
      '📞 Contactar soporte técnico si el problema persiste'
    ];
    
    return results;
  }
};

// Función simplificada para verificación rápida
export const quickHealthCheck = async (): Promise<boolean> => {
  try {
    const result = await verifyArchitectureMigration();
    return result.success;
  } catch (error) {
    console.error('❌ Health check falló:', error);
    return false;
  }
};

// Función para mostrar reporte detallado
export const generateMigrationReport = async (): Promise<string> => {
  const result = await verifyArchitectureMigration();
  
  let report = `
# 📋 REPORTE DE MIGRACIÓN A NUEVA ARQUITECTURA

## 🎯 Resumen
${result.summary}

## 📊 Estado de Servicios
`;

  if (result.details.servicesAvailable) {
    const services = result.details.servicesAvailable;
    report += `
- **Assistants API**: ${services.assistants ? '✅ Disponible' : '❌ No disponible'}
- **Function Calling**: ${services.functionCalling ? '✅ Disponible' : '❌ No disponible'}
- **Context Manager**: ${services.contextManager ? '✅ Disponible' : '❌ No disponible'}
- **Servicios Legacy**: ${services.legacy ? '✅ Disponible' : '❌ No disponible'}
`;
  }

  report += `
## 🔧 Compatibilidad
- **Verificación**: ${result.details.compatibilityCheck ? '✅ Passed' : '❌ Failed'}

## 📈 Métricas de Rendimiento
- **Método Preferido**: ${result.details.performanceMetrics?.currentStatus?.preferredMethod || 'Desconocido'}
- **Migración Completa**: ${result.details.performanceMetrics?.currentStatus?.migrationComplete ? '✅ Sí' : '❌ No'}

## 💡 Recomendaciones
`;

  result.details.recommendations.forEach(rec => {
    report += `- ${rec}\n`;
  });

  report += `
## 🎯 Próximos Pasos
${result.success ? 
  '🚀 Sistema listo para usar la nueva arquitectura en producción.' : 
  '🔧 Completar configuración antes de usar en producción.'
}

---
*Reporte generado el ${new Date().toLocaleString()}*
`;

  return report;
};

export default {
  verify: verifyArchitectureMigration,
  healthCheck: quickHealthCheck,
  report: generateMigrationReport
}; 