// =============================================================================
// TIPOS PRINCIPALES DE LA APLICACIÓN
// =============================================================================

// Enums y tipos básicos
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type ActiveView = 
  | 'nota-plantilla' 
  | 'historial-notas' 
  | 'templates' 
  | 'note-updater'
  | 'note-editor';

// Tipo para colección de plantillas
export interface Templates {
  [key: string]: {
    id: string;
    name: string;
    content: string;
    specialty_id?: string;
    created_at: string;
  };
}

// =============================================================================
// TIPOS DE BASE DE DATOS
// =============================================================================

export interface UserTemplate {
  id: string;
  name: string;
  content: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
  specialty?: string;
  license_number?: string;
  institution?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TIPOS DE NOTAS Y GENERACIÓN
// =============================================================================

export interface GeneratedNote {
  id: string;
  specialty_id: string;
  content: string;
  timestamp: Date;
}

export interface HistoricNote {
  id: string;
  type: 'template' | 'suggestion' | 'scale' | 'evidence';
  timestamp: string; // Para compatibilidad con código existente
  originalInput: string; // Para compatibilidad con código existente
  content: string;
  specialty_id?: string;
  specialtyName?: string;
  scaleId?: string;
  scaleName?: string;
  // Nuevos campos para compatibilidad con la base de datos
  title?: string;
  original_input?: string;
  specialty_name?: string;
  scale_id?: string;
  scale_name?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// TIPOS DE METADATOS Y FUENTES
// =============================================================================

export interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

// =============================================================================
// TIPOS PARA DATOS FALTANTES
// =============================================================================

export interface MissingDataInfo {
  missingFields: string[];
  summary: string;
}

export interface GenerationResult {
  text: string;
  missingData?: MissingDataInfo;
  groundingMetadata?: GroundingMetadata;
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}



// =============================================================================
// TIPOS PARA CONSULTA CLÍNICA BASADA EN EVIDENCIA
// =============================================================================

export interface ClinicalFinding {
  id: string;
  category: 'symptom' | 'sign' | 'diagnosis' | 'treatment' | 'lab_result' | 'vital_sign' | 'medication' | 'procedure';
  description: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  extractedText: string;
}

export interface EvidenceSource {
  type: 'pubmed' | 'uptodate' | 'clinicalkey' | 'cochrane' | 'guidelines' | 'textbook';
  title: string;
  authors?: string[];
  journal?: string;
  year?: number;
  pmid?: string;
  doi?: string;
  url?: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  studyType?: 'rct' | 'meta_analysis' | 'cohort' | 'case_control' | 'case_series' | 'expert_opinion';
}

export interface ClinicalRecommendation {
  id: string;
  category: 'diagnostic' | 'therapeutic' | 'monitoring' | 'prevention' | 'prognosis' | 'differential_diagnosis';
  title: string;
  description: string;
  strength: 'strong' | 'conditional' | 'expert_opinion';
  evidenceQuality: 'high' | 'moderate' | 'low' | 'very_low';
  applicability: number; // 0-1, qué tan aplicable es al caso específico
  urgency: 'immediate' | 'urgent' | 'routine' | 'elective';
  contraindications?: string[];
  considerations?: string[];
  followUp?: string;
  sources: EvidenceSource[];
  relatedFindings: string[]; // IDs de los hallazgos clínicos relacionados
}

export interface ClinicalAnalysisResult {
  findings: ClinicalFinding[];
  recommendations: ClinicalRecommendation[];
  riskFactors: string[];
  redFlags: string[];
  differentialDiagnoses: string[];
  suggestedWorkup: string[];
  confidence: number;
  analysisTimestamp: string;
  disclaimerText: string;
}

export interface EvidenceConsultationRequest {
  clinicalContent: string;
  focusAreas?: string[]; // Áreas específicas de interés
  patientContext?: {
    age?: number;
    sex?: 'M' | 'F' | 'other';
    comorbidities?: string[];
    allergies?: string[];
    currentMedications?: string[];
  };
  consultationType: 'comprehensive' | 'focused' | 'differential' | 'treatment' | 'monitoring';
}

export interface EvidenceSearchResult {
  query: string;
  sources: EvidenceSource[];
  recommendations: ClinicalRecommendation[];
  searchTimestamp: string;
  totalResults: number;
  searchStrategy: string;
}

// =============================================================================
// DECLARACIONES GLOBALES
// =============================================================================