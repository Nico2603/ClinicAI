/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

import { UserTemplate } from '@/types';

// ==========================================
// CONTEXT OPTIMIZATION PARA MÚLTIPLES PLANTILLAS
// ==========================================

interface TemplateContext {
  id: string;
  name: string;
  contentHash: string;
  structureSummary: string;
  priority: number;
  lastUsed: Date;
  usageCount: number;
  category: string;
  tokens: number;
}

interface ContextWindow {
  maxTokens: number;
  currentTokens: number;
  templates: TemplateContext[];
  patientInfo: string;
  patientTokens: number;
}

// ==========================================
// GESTOR DE CONTEXTO INTELIGENTE
// ==========================================

class IntelligentContextManager {
  private readonly MAX_CONTEXT_TOKENS = 15000; // Límite seguro para GPT-4
  private readonly MAX_TEMPLATES_PER_REQUEST = 3; // Máximo de plantillas por request
  private readonly PATIENT_INFO_RESERVE = 2000; // Tokens reservados para info del paciente
  private readonly SYSTEM_PROMPT_RESERVE = 1000; // Tokens reservados para system prompts

  private templateCache = new Map<string, TemplateContext>();
  private contextHistory = new Map<string, ContextWindow>();

  /**
   * Analiza una plantilla y extrae su contexto esencial
   */
  async analyzeTemplate(template: UserTemplate): Promise<TemplateContext> {
    const contentHash = this.generateHash(template.content);
    
    // Verificar cache
    if (this.templateCache.has(contentHash)) {
      const cached = this.templateCache.get(contentHash)!;
      cached.lastUsed = new Date();
      cached.usageCount++;
      return cached;
    }

    // Analizar nueva plantilla
    const structureSummary = this.extractStructureSummary(template.content);
    const category = this.categorizeTemplate(template.name, template.content);
    const tokens = this.estimateTokens(template.content);

    const context: TemplateContext = {
      id: template.id,
      name: template.name,
      contentHash,
      structureSummary,
      priority: this.calculatePriority(template),
      lastUsed: new Date(),
      usageCount: 1,
      category,
      tokens
    };

    this.templateCache.set(contentHash, context);
    return context;
  }

  /**
   * Optimiza contexto para múltiples plantillas
   */
  async optimizeContextForMultipleTemplates(
    templates: UserTemplate[],
    patientInfo: string,
    selectedTemplateId?: string
  ): Promise<{
    primaryTemplate: UserTemplate | null;
    contextualTemplates: UserTemplate[];
    optimizedPrompt: string;
    tokensUsed: number;
    recommendation: string;
  }> {
    console.log(`🔄 Optimizando contexto para ${templates.length} plantillas...`);

    const patientTokens = this.estimateTokens(patientInfo);
    const availableTokens = this.MAX_CONTEXT_TOKENS - this.SYSTEM_PROMPT_RESERVE - patientTokens;

    // Analizar todas las plantillas
    const templateContexts = await Promise.all(
      templates.map(template => this.analyzeTemplate(template))
    );

    // Priorizar plantillas
    const prioritized = this.prioritizeTemplates(templateContexts, selectedTemplateId);

    // Seleccionar plantillas que caben en el contexto
    const selected = this.selectTemplatesForContext(prioritized, availableTokens);

    const primaryTemplate = selected.primary ? 
      templates.find(t => t.id === selected.primary?.id) || null : null;
    
    const contextualTemplates = selected.contextual
      .map(ctx => templates.find(t => t.id === ctx.id))
      .filter((template): template is UserTemplate => template !== undefined);

    // Generar prompt optimizado
    const optimizedPrompt = this.generateOptimizedPrompt(
      selected.primary,
      selected.contextual,
      patientInfo
    );

    const tokensUsed = selected.totalTokens + patientTokens + this.SYSTEM_PROMPT_RESERVE;

    return {
      primaryTemplate,
      contextualTemplates,
      optimizedPrompt,
      tokensUsed,
      recommendation: this.generateRecommendation(templates.length, selected, tokensUsed)
    };
  }

  /**
   * Estrategia de carga incremental para muchas plantillas
   */
  async createIncrementalLoadingStrategy(
    templates: UserTemplate[]
  ): Promise<{
    batches: UserTemplate[][];
    strategy: 'sequential' | 'parallel' | 'hybrid';
    reasoning: string;
  }> {
    const totalTemplates = templates.length;
    
    if (totalTemplates <= 3) {
      return {
        batches: [templates],
        strategy: 'parallel',
        reasoning: 'Pocas plantillas: carga directa en paralelo'
      };
    }

    if (totalTemplates <= 10) {
      // Agrupar por categoría/especialidad
      const grouped = this.groupTemplatesByCategory(templates);
      const batches = Object.values(grouped);
      
      return {
        batches,
        strategy: 'hybrid',
        reasoning: 'Plantillas medianas: agrupación por categoría + carga híbrida'
      };
    }

    // Muchas plantillas: estrategia secuencial con priorización
    const analyzed = await Promise.all(
      templates.map(template => this.analyzeTemplate(template))
    );
    
    const sorted = analyzed.sort((a, b) => b.priority - a.priority);
    const batches: UserTemplate[][] = [];
    
    for (let i = 0; i < sorted.length; i += this.MAX_TEMPLATES_PER_REQUEST) {
      const batchContexts = sorted.slice(i, i + this.MAX_TEMPLATES_PER_REQUEST);
      const batchTemplates = batchContexts
        .map(ctx => templates.find(t => t.id === ctx.id))
        .filter(Boolean) as UserTemplate[];
      
      batches.push(batchTemplates);
    }

    return {
      batches,
      strategy: 'sequential',
      reasoning: 'Muchas plantillas: carga secuencial con priorización para evitar pérdida de coherencia'
    };
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  private generateHash(content: string): string {
    // Generar hash simple del contenido
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private extractStructureSummary(content: string): string {
    // Extraer elementos estructurales clave
    const lines = content.split('\n');
    const structural = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.includes(':') || 
               trimmed.match(/^[A-Z\s]+:?$/) ||
               trimmed.match(/^\d+\./) ||
               trimmed.match(/^[A-Z]\)/) ||
               trimmed.match(/^[-*+]/) ||
               trimmed.length === 0;
      })
      .slice(0, 10) // Limitar a primeras 10 líneas estructurales
      .join('\n');

    return structural || 'Estructura no identificada';
  }

  private categorizeTemplate(name: string, content: string): string {
    const nameLC = name.toLowerCase();
    const contentLC = content.toLowerCase();

    // Categorización basada en palabras clave
    if (nameLC.includes('cardio') || contentLC.includes('corazón') || contentLC.includes('cardio')) {
      return 'cardiología';
    }
    if (nameLC.includes('neuro') || contentLC.includes('neuro') || contentLC.includes('cerebro')) {
      return 'neurología';
    }
    if (nameLC.includes('pediatr') || contentLC.includes('pediatr') || contentLC.includes('niño')) {
      return 'pediatría';
    }
    if (nameLC.includes('trauma') || contentLC.includes('trauma') || contentLC.includes('lesión')) {
      return 'traumatología';
    }
    if (nameLC.includes('radio') || contentLC.includes('imagen') || contentLC.includes('tac')) {
      return 'radiología';
    }

    return 'general';
  }

  private calculatePriority(template: UserTemplate): number {
    let priority = 50; // Base

    // Factor de uso reciente
    const daysSinceCreation = (Date.now() - new Date(template.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) priority += 20;
    else if (daysSinceCreation < 30) priority += 10;

    // Factor de actividad
    if (template.is_active) priority += 15;

    // Factor de nombre (plantillas con nombres específicos vs genéricos)
    if (!template.name.includes('Plantilla') && template.name.length > 10) {
      priority += 10;
    }

    // Factor de contenido
    if (template.content.length > 500) priority += 5;
    if (template.content.length > 1500) priority += 5;

    return Math.min(100, Math.max(0, priority));
  }

  private estimateTokens(text: string): number {
    // Estimación aproximada: 1 token ≈ 4 caracteres para español
    return Math.ceil(text.length / 3.5);
  }

  private prioritizeTemplates(
    contexts: TemplateContext[],
    selectedId?: string
  ): TemplateContext[] {
    return contexts.sort((a, b) => {
      // Plantilla seleccionada siempre va primero
      if (selectedId) {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
      }

      // Luego por prioridad
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Luego por uso reciente
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });
  }

  private selectTemplatesForContext(
    prioritized: TemplateContext[],
    availableTokens: number
  ): {
    primary: TemplateContext | null;
    contextual: TemplateContext[];
    totalTokens: number;
  } {
    if (prioritized.length === 0) {
      return { primary: null, contextual: [], totalTokens: 0 };
    }

    const primary = prioritized[0]!; // Safe because we checked length above
    const contextual: TemplateContext[] = [];
    let totalTokens = primary.tokens;

    // Agregar plantillas contextuales que quepan
    for (let i = 1; i < prioritized.length && contextual.length < this.MAX_TEMPLATES_PER_REQUEST - 1; i++) {
      const template = prioritized[i]!; // Safe because we're iterating within bounds
      if (totalTokens + template.tokens <= availableTokens) {
        contextual.push(template);
        totalTokens += template.tokens;
      }
    }

    return { primary, contextual, totalTokens };
  }

  private generateOptimizedPrompt(
    primary: TemplateContext | null,
    contextual: TemplateContext[],
    patientInfo: string
  ): string {
    if (!primary) {
      return `Información del paciente: ${patientInfo}`;
    }

    let prompt = `PLANTILLA PRINCIPAL: ${primary.name}\n`;
    prompt += `Estructura: ${primary.structureSummary}\n\n`;

    if (contextual.length > 0) {
      prompt += `PLANTILLAS DE REFERENCIA (para contexto):\n`;
      contextual.forEach((ctx, idx) => {
        prompt += `${idx + 1}. ${ctx.name} (${ctx.category})\n`;
        prompt += `   Estructura: ${ctx.structureSummary.split('\n').slice(0, 3).join('; ')}\n`;
      });
      prompt += '\n';
    }

    prompt += `INFORMACIÓN DEL PACIENTE:\n${patientInfo}`;

    return prompt;
  }

  private groupTemplatesByCategory(templates: UserTemplate[]): Record<string, UserTemplate[]> {
    const groups: Record<string, UserTemplate[]> = {};
    
    for (const template of templates) {
      const category = this.categorizeTemplate(template.name, template.content);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    }

    return groups;
  }

  private generateRecommendation(
    totalTemplates: number,
    selected: { primary: TemplateContext | null; contextual: TemplateContext[]; totalTokens: number },
    tokensUsed: number
  ): string {
    if (totalTemplates <= 3) {
      return 'Configuración óptima: todas las plantillas pueden cargarse simultáneamente.';
    }

    if (totalTemplates <= 10) {
      return `Configuración buena: usando ${selected.contextual.length + 1}/${totalTemplates} plantillas (${Math.round(tokensUsed/this.MAX_CONTEXT_TOKENS*100)}% del contexto).`;
    }

    if (tokensUsed > this.MAX_CONTEXT_TOKENS * 0.8) {
      return `⚠️ Contexto saturado: considera usar menos plantillas o implementar carga incremental.`;
    }

    return `Configuración aceptable: ${selected.contextual.length + 1}/${totalTemplates} plantillas. Considera Assistant API para mejor estabilidad.`;
  }

  // ==========================================
  // MÉTODOS PÚBLICOS DE UTILIDAD
  // ==========================================

  getContextStats(): {
    cachedTemplates: number;
    totalMemoryUsage: string;
    averagePriority: number;
  } {
    const cached = Array.from(this.templateCache.values());
    const totalTokens = cached.reduce((sum, ctx) => sum + ctx.tokens, 0);
    const avgPriority = cached.reduce((sum, ctx) => sum + ctx.priority, 0) / cached.length;

    return {
      cachedTemplates: cached.length,
      totalMemoryUsage: `${totalTokens} tokens`,
      averagePriority: Math.round(avgPriority || 0)
    };
  }

  clearCache(): void {
    this.templateCache.clear();
    this.contextHistory.clear();
    console.log('🧹 Cache de contexto limpiado');
  }

  preloadTemplates(templates: UserTemplate[]): Promise<void> {
    console.log(`🔄 Precargando ${templates.length} plantillas...`);
    return Promise.all(templates.map(t => this.analyzeTemplate(t))).then(() => {
      console.log('✅ Plantillas precargadas en cache');
    });
  }
}

// ==========================================
// INSTANCIA SINGLETON
// ==========================================

export const contextManager = new IntelligentContextManager();

// ==========================================
// FUNCIONES DE UTILIDAD EXPORTADAS
// ==========================================

/**
 * Optimiza un conjunto de plantillas para su uso
 */
export const optimizeTemplateSet = async (
  templates: UserTemplate[],
  patientInfo: string,
  selectedTemplateId?: string
) => {
  return await contextManager.optimizeContextForMultipleTemplates(
    templates,
    patientInfo,
    selectedTemplateId
  );
};

/**
 * Crea estrategia de carga para muchas plantillas
 */
export const createLoadingStrategy = async (templates: UserTemplate[]) => {
  return await contextManager.createIncrementalLoadingStrategy(templates);
};

/**
 * Precarga plantillas en cache para mejor rendimiento
 */
export const preloadTemplateCache = async (templates: UserTemplate[]) => {
  return await contextManager.preloadTemplates(templates);
};

/**
 * Obtiene estadísticas del gestor de contexto
 */
export const getContextManagerStats = () => {
  return contextManager.getContextStats();
};

/**
 * Limpia el cache del gestor de contexto
 */
export const clearContextCache = () => {
  contextManager.clearCache();
};

export default contextManager; 