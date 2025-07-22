import { UserTemplate } from '@/types';

// ==========================================
// MCP (MANUAL CONTROL PROCESS) FALLBACK SYSTEM
// ==========================================
// Sistema de último recurso para casos donde la IA pierde coherencia
// Implementa control programático estricto sobre la generación

interface MCPRule {
  id: string;
  name: string;
  description: string;
  condition: (context: MCPContext) => boolean;
  action: (context: MCPContext) => MCPResult;
  priority: number;
}

interface MCPContext {
  templateContent: string;
  patientInfo: string;
  specialtyName: string;
  templateCount: number;
  previousAttempts: number;
  errorHistory: string[];
}

interface MCPResult {
  success: boolean;
  generatedNote: string;
  appliedRules: string[];
  recommendations: string[];
  confidence: number;
}

// ==========================================
// MCP RULES ENGINE
// ==========================================

class MCPRulesEngine {
  private rules: MCPRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Regla 1: Control de formato estricto
    this.rules.push({
      id: 'strict_format_control',
      name: 'Control de Formato Estricto',
      description: 'Aplica control programático del formato cuando hay pérdida de coherencia',
      priority: 100,
      condition: (context) => context.templateCount > 10 || context.previousAttempts > 2,
      action: (context) => this.applyStrictFormatControl(context)
    });

    // Regla 2: Fragmentación de plantillas
    this.rules.push({
      id: 'template_fragmentation',
      name: 'Fragmentación de Plantillas',
      description: 'Divide plantillas complejas en secciones manejables',
      priority: 90,
      condition: (context) => context.templateContent.length > 2000,
      action: (context) => this.applyTemplateFragmentation(context)
    });

    // Regla 3: Síntesis determinística
    this.rules.push({
      id: 'deterministic_synthesis',
      name: 'Síntesis Determinística',
      description: 'Usa reglas fijas para generar notas cuando la IA falla',
      priority: 80,
      condition: (context) => context.errorHistory.length > 3,
      action: (context) => this.applyDeterministicSynthesis(context)
    });

    // Regla 4: Validación post-generación
    this.rules.push({
      id: 'post_generation_validation',
      name: 'Validación Post-Generación',
      description: 'Aplica correcciones programáticas después de generar',
      priority: 70,
      condition: (context) => true, // Siempre aplicable
      action: (context) => this.applyPostGenerationValidation(context)
    });
  }

  async processWithMCP(context: MCPContext): Promise<MCPResult> {
    console.log('🔧 Iniciando MCP (Manual Control Process)...');
    
    // Ordenar reglas por prioridad
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);
    
    let result: MCPResult = {
      success: false,
      generatedNote: '',
      appliedRules: [],
      recommendations: [],
      confidence: 0
    };

    // Aplicar reglas en orden de prioridad
    for (const rule of sortedRules) {
      if (rule.condition(context)) {
        console.log(`🔧 Aplicando regla: ${rule.name}`);
        
        try {
          const ruleResult = rule.action(context);
          
          if (ruleResult.success) {
            result = {
              ...result,
              ...ruleResult,
              appliedRules: [...result.appliedRules, rule.name],
              recommendations: [...result.recommendations, ...ruleResult.recommendations]
            };
          }
        } catch (error) {
          console.error(`Error aplicando regla ${rule.name}:`, error);
          result.recommendations.push(`Error en regla ${rule.name}: ${error}`);
        }
      }
    }

    // Calcular confianza final
    result.confidence = this.calculateConfidence(result, context);
    
    console.log(`✅ MCP completado. Reglas aplicadas: ${result.appliedRules.length}, Confianza: ${result.confidence}%`);
    
    return result;
  }

  // ==========================================
  // IMPLEMENTACIONES DE REGLAS
  // ==========================================

  private applyStrictFormatControl(context: MCPContext): MCPResult {
    try {
      // Extraer estructura de la plantilla de forma programática
      const structure = this.extractTemplateStructure(context.templateContent);
      
      // Extraer datos del paciente de forma estructurada
      const patientData = this.extractPatientData(context.patientInfo);
      
      // Generar nota siguiendo estructura estricta
      let generatedNote = '';
      
      for (const section of structure.sections) {
        generatedNote += `${section.header}\n`;
        
        const sectionContent = this.generateSectionContent(
          section.type,
          section.requirements,
          patientData
        );
        
        if (sectionContent) {
          generatedNote += `${sectionContent}\n\n`;
        }
      }

      return {
        success: true,
        generatedNote: generatedNote.trim(),
        appliedRules: ['Control de Formato Estricto'],
        recommendations: [
          'Nota generada con control programático estricto',
          'Revisa manualmente para verificar coherencia clínica'
        ],
        confidence: 85
      };
      
    } catch (error) {
      return {
        success: false,
        generatedNote: '',
        appliedRules: [],
        recommendations: [`Error en control de formato: ${error}`],
        confidence: 0
      };
    }
  }

  private applyTemplateFragmentation(context: MCPContext): MCPResult {
    try {
      // Dividir plantilla en fragmentos manejables
      const fragments = this.fragmentTemplate(context.templateContent);
      let generatedNote = '';
      
      for (const fragment of fragments) {
        if (fragment.content.length > 0) {
          const fragmentResult = this.processTemplateFragment(fragment, context.patientInfo);
          generatedNote += fragmentResult + '\n\n';
        }
      }

      return {
        success: true,
        generatedNote: generatedNote.trim(),
        appliedRules: ['Fragmentación de Plantillas'],
        recommendations: [
          `Plantilla dividida en ${fragments.length} fragmentos`,
          'Considera simplificar plantillas muy largas'
        ],
        confidence: 75
      };
      
    } catch (error) {
      return {
        success: false,
        generatedNote: '',
        appliedRules: [],
        recommendations: [`Error en fragmentación: ${error}`],
        confidence: 0
      };
    }
  }

  private applyDeterministicSynthesis(context: MCPContext): MCPResult {
    try {
      // Síntesis usando reglas fijas cuando la IA falla repetidamente
      const synthesizedNote = this.synthesizeNoteWithRules(
        context.templateContent,
        context.patientInfo,
        context.specialtyName
      );

      return {
        success: true,
        generatedNote: synthesizedNote,
        appliedRules: ['Síntesis Determinística'],
        recommendations: [
          'Nota generada con reglas fijas debido a fallos de IA',
          'Requiere revisión médica obligatoria',
          'Considera simplificar el prompt o usar menos plantillas'
        ],
        confidence: 60
      };
      
    } catch (error) {
      return {
        success: false,
        generatedNote: '',
        appliedRules: [],
        recommendations: [`Error en síntesis determinística: ${error}`],
        confidence: 0
      };
    }
  }

  private applyPostGenerationValidation(context: MCPContext): MCPResult {
    // Esta regla se aplicaría después de generar una nota para validarla
    try {
      const validationResult = this.validateGeneratedNote(context.templateContent, '');
      
      return {
        success: validationResult.isValid,
        generatedNote: validationResult.correctedNote || '',
        appliedRules: ['Validación Post-Generación'],
        recommendations: validationResult.recommendations,
        confidence: validationResult.confidence
      };
      
    } catch (error) {
      return {
        success: false,
        generatedNote: '',
        appliedRules: [],
        recommendations: [`Error en validación: ${error}`],
        confidence: 0
      };
    }
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  private extractTemplateStructure(templateContent: string): {
    sections: Array<{
      header: string;
      type: string;
      requirements: string[];
    }>;
  } {
    const lines = templateContent.split('\n');
    const sections: Array<{ header: string; type: string; requirements: string[] }> = [];
    
    let currentSection: { header: string; type: string; requirements: string[] } | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detectar encabezados de sección
      if (trimmed.includes(':') || trimmed.match(/^[A-Z\s]+:?$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        currentSection = {
          header: line,
          type: this.classifySectionType(trimmed),
          requirements: []
        };
      } else if (currentSection && trimmed.length > 0) {
        currentSection.requirements.push(trimmed);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return { sections };
  }

  private classifySectionType(header: string): string {
    const headerLC = header.toLowerCase();
    
    if (headerLC.includes('subjetiv')) return 'subjective';
    if (headerLC.includes('objetiv')) return 'objective';
    if (headerLC.includes('evaluación') || headerLC.includes('análisis')) return 'assessment';
    if (headerLC.includes('plan') || headerLC.includes('tratamiento')) return 'plan';
    if (headerLC.includes('diagnóstico')) return 'diagnosis';
    
    return 'custom';
  }

  private extractPatientData(patientInfo: string): Record<string, any> {
    // Extraer datos estructurados del texto del paciente
    const data: Record<string, any> = {
      symptoms: [],
      vitals: {},
      history: '',
      medications: [],
      allergies: []
    };

    const lines = patientInfo.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      // Detectar síntomas
      if (trimmed.includes('síntoma') || trimmed.includes('dolor') || trimmed.includes('molestia')) {
        data.symptoms.push(line.trim());
      }
      
      // Detectar signos vitales
      if (trimmed.includes('presión') || trimmed.includes('temperatura') || trimmed.includes('frecuencia')) {
        const vitalMatch = line.match(/(\d+)/);
        if (vitalMatch) {
          data.vitals[trimmed.split(':')[0] || 'vital'] = vitalMatch[1];
        }
      }
      
      // Detectar medicamentos
      if (trimmed.includes('medicamento') || trimmed.includes('toma') || trimmed.includes('mg')) {
        data.medications.push(line.trim());
      }
    }

    return data;
  }

  private generateSectionContent(
    sectionType: string,
    requirements: string[],
    patientData: Record<string, any>
  ): string {
    switch (sectionType) {
      case 'subjective':
        return this.generateSubjectiveContent(patientData);
      case 'objective':
        return this.generateObjectiveContent(patientData);
      case 'assessment':
        return this.generateAssessmentContent(patientData);
      case 'plan':
        return this.generatePlanContent(patientData);
      default:
        return requirements.join('\n');
    }
  }

  private generateSubjectiveContent(patientData: Record<string, any>): string {
    let content = '';
    
    if (patientData.symptoms && patientData.symptoms.length > 0) {
      content += 'Síntomas reportados por el paciente:\n';
      patientData.symptoms.forEach((symptom: string) => {
        content += `- ${symptom}\n`;
      });
    } else {
      content += 'Información subjetiva a completar durante la consulta.\n';
    }
    
    return content;
  }

  private generateObjectiveContent(patientData: Record<string, any>): string {
    let content = '';
    
    if (Object.keys(patientData.vitals).length > 0) {
      content += 'Signos vitales:\n';
      for (const [vital, value] of Object.entries(patientData.vitals)) {
        content += `- ${vital}: ${value}\n`;
      }
    } else {
      content += 'Signos vitales y examen físico a completar.\n';
    }
    
    return content;
  }

  private generateAssessmentContent(patientData: Record<string, any>): string {
    return 'Análisis clínico basado en hallazgos objetivos y subjetivos.\nDiagnóstico diferencial a determinar según evaluación clínica.';
  }

  private generatePlanContent(patientData: Record<string, any>): string {
    let content = 'Plan de manejo:\n';
    
    if (patientData.medications && patientData.medications.length > 0) {
      content += 'Medicamentos actuales:\n';
      patientData.medications.forEach((med: string) => {
        content += `- ${med}\n`;
      });
    }
    
    content += '- Seguimiento según evolución clínica\n';
    content += '- Recomendaciones generales\n';
    
    return content;
  }

  private fragmentTemplate(templateContent: string): Array<{ id: string; content: string }> {
    const sections = templateContent.split(/\n\s*\n/); // Dividir por líneas vacías
    
    return sections.map((section, index) => ({
      id: `fragment_${index}`,
      content: section.trim()
    })).filter(fragment => fragment.content.length > 0);
  }

  private processTemplateFragment(
    fragment: { id: string; content: string },
    patientInfo: string
  ): string {
    // Procesar fragmento individual de manera determinística
    if (fragment.content.includes(':')) {
      return fragment.content; // Retornar encabezado tal como está
    }
    
    // Para contenido, intentar rellenar con información del paciente
    return `${fragment.content}\n[Información a completar con datos del paciente]`;
  }

  private synthesizeNoteWithRules(
    templateContent: string,
    patientInfo: string,
    specialtyName: string
  ): string {
    // Síntesis completamente determinística
    let note = `NOTA MÉDICA - ${specialtyName.toUpperCase()}\n`;
    note += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
    
    const structure = this.extractTemplateStructure(templateContent);
    const patientData = this.extractPatientData(patientInfo);
    
    for (const section of structure.sections) {
      note += `${section.header}\n`;
      
      const content = this.generateSectionContent(section.type, section.requirements, patientData);
      note += `${content}\n\n`;
    }
    
    note += `NOTA GENERADA CON SISTEMA MCP\n`;
    note += `Esta nota requiere revisión médica obligatoria.\n`;
    
    return note;
  }

  private validateGeneratedNote(templateContent: string, generatedNote: string): {
    isValid: boolean;
    correctedNote?: string;
    recommendations: string[];
    confidence: number;
  } {
    const recommendations: string[] = [];
    let confidence = 50;
    
    // Validaciones básicas
    if (generatedNote.length < 100) {
      recommendations.push('Nota muy corta, probablemente incompleta');
      confidence -= 20;
    }
    
    if (!generatedNote.includes('SUBJETIVO') && !generatedNote.includes('Subjetivo')) {
      recommendations.push('Falta sección subjetiva');
      confidence -= 15;
    }
    
    if (!generatedNote.includes('PLAN') && !generatedNote.includes('Plan')) {
      recommendations.push('Falta sección de plan');
      confidence -= 15;
    }
    
    return {
      isValid: confidence > 40,
      recommendations,
      confidence: Math.max(0, confidence)
    };
  }

  private calculateConfidence(result: MCPResult, context: MCPContext): number {
    let confidence = 70; // Base
    
    // Factores que aumentan confianza
    if (result.appliedRules.includes('Control de Formato Estricto')) confidence += 15;
    if (result.generatedNote.length > 200) confidence += 10;
    if (context.previousAttempts === 0) confidence += 5;
    
    // Factores que disminuyen confianza
    if (context.templateCount > 15) confidence -= 20;
    if (context.errorHistory.length > 5) confidence -= 15;
    if (result.appliedRules.includes('Síntesis Determinística')) confidence -= 10;
    
    return Math.max(0, Math.min(100, confidence));
  }
}

// ==========================================
// SERVICIO PRINCIPAL MCP
// ==========================================

class MCPFallbackService {
  private rulesEngine: MCPRulesEngine;

  constructor() {
    this.rulesEngine = new MCPRulesEngine();
  }

  async handleFailedGeneration(
    templateContent: string,
    patientInfo: string,
    specialtyName: string,
    templateCount: number,
    errorHistory: string[]
  ): Promise<{
    success: boolean;
    generatedNote: string;
    method: 'mcp_fallback';
    appliedRules: string[];
    recommendations: string[];
    confidence: number;
    requiresManualReview: boolean;
  }> {
    console.log('🚨 MCP Fallback activado por fallos repetidos en generación de IA');
    
    const context: MCPContext = {
      templateContent,
      patientInfo,
      specialtyName,
      templateCount,
      previousAttempts: errorHistory.length,
      errorHistory
    };

    try {
      const result = await this.rulesEngine.processWithMCP(context);
      
      return {
        success: result.success,
        generatedNote: result.generatedNote,
        method: 'mcp_fallback',
        appliedRules: result.appliedRules,
        recommendations: result.recommendations,
        confidence: result.confidence,
        requiresManualReview: result.confidence < 80 // Revisión obligatoria si confianza baja
      };
      
    } catch (error) {
      console.error('Error en MCP Fallback:', error);
      
      return {
        success: false,
        generatedNote: this.generateEmergencyNote(templateContent, specialtyName),
        method: 'mcp_fallback',
        appliedRules: ['Emergency Generation'],
        recommendations: [
          'Error crítico en todos los sistemas',
          'Nota de emergencia generada',
          'REVISIÓN MÉDICA INMEDIATA REQUERIDA'
        ],
        confidence: 25,
        requiresManualReview: true
      };
    }
  }

  private generateEmergencyNote(templateContent: string, specialtyName: string): string {
    return `NOTA MÉDICA DE EMERGENCIA - ${specialtyName.toUpperCase()}
Fecha: ${new Date().toLocaleDateString()}

AVISO: Esta nota fue generada por el sistema de emergencia MCP debido a fallos técnicos.

PLANTILLA DE REFERENCIA:
${templateContent.substring(0, 300)}...

INFORMACIÓN DEL PACIENTE:
[A completar manualmente]

SUBJETIVO:
[A completar durante la consulta]

OBJETIVO:
[A completar con examen físico]

EVALUACIÓN:
[A completar con análisis clínico]

PLAN:
[A completar con plan de manejo]

⚠️ ESTA NOTA REQUIERE COMPLETADO MANUAL INMEDIATO
⚠️ NO USAR SIN REVISIÓN MÉDICA PROFESIONAL`;
  }
}

// ==========================================
// INSTANCIA Y EXPORTS
// ==========================================

export const mcpFallbackService = new MCPFallbackService();

export default mcpFallbackService; 