// =============================================================================
// TIPOS PRINCIPALES DE LA APLICACIÓN
// =============================================================================

// Enums y tipos básicos
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type ActiveView = 
  | 'templates' 
  | 'nota-plantilla' 
  | 'sugerencia-evidencia' 
  | 'escalas-clinicas' 
  | 'consulta-evidencia' 
  | 'note-updater';

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
  type: 'template' | 'suggestion' | 'scale';
  timestamp: string;
  originalInput: string;
  content: string;
  specialty_id?: string;
  specialtyName?: string;
  scaleId?: string;
  scaleName?: string;
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

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}

// =============================================================================
// TIPOS PARA ESCALAS CLÍNICAS
// =============================================================================

export interface ClinicalScale {
  id: string;
  name: string;
  description: string;
  category: string;
  items: ScaleItem[];
  scoring: ScoreInterpretation[];
  reference?: string;
  lastUpdated?: string;
}

export interface ScaleItem {
  id: string;
  text: string;
  type: 'number' | 'select' | 'checkbox' | 'text';
  options?: string[];
  range?: { min: number; max: number };
  value?: any;
  weight?: number;
  required?: boolean;
}

export interface ScoreInterpretation {
  range: { min: number; max: number };
  level: string;
  description: string;
  recommendations?: string[];
}

export interface ScaleSearchResult {
  name: string;
  description: string;
  category: string;
  confidence: number;
  isStandardized: boolean;
  rationale?: string; // Razón específica por la que se sugiere esta escala
}

export interface GeneratedScaleResult {
  scale: ClinicalScale;
  autocompletedItems: string[];
  missingFields: string[];
  totalScore?: number;
  interpretation?: string;
  confidence: number;
}

export interface ScaleGenerationRequest {
  scaleName: string;
  clinicalData: string;
  existingNoteContent?: string;
}

export interface ClinicalAnalysisForScalesResult {
  scales: ScaleSearchResult[];
  clinicalSummary: string;
  recommendations: string[];
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
// TIPOS PARA WEB SPEECH API
// =============================================================================

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: any;
  readonly emma?: any;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechGrammar {
  src: string;
  weight?: number;
}

export interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

export interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

export interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// =============================================================================
// DECLARACIONES GLOBALES
// =============================================================================

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}