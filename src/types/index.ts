export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type ActiveView = 'templates' | 'generate' | 'history';

// Tipos de base de datos - Coinciden con databaseService.ts
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  specialtyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  specialty?: Specialty;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  specialtyId?: string;
  templateId?: string;
  patientId?: string;
  patientName?: string;
  diagnosis?: string;
  treatment?: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  specialty?: Specialty;
  template?: Template;
}

export interface UserProfile {
  id: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  specialty?: string;
  licenseNumber?: string;
  institution?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para compatibilidad con código existente
export type Templates = Record<string, string>; // Key: specialtyId, Value: template string

export interface GeneratedNote {
  id: string;
  specialtyId: string;
  content: string;
  timestamp: Date;
}

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

export interface HistoricNote {
  id: string;
  type: 'template' | 'suggestion' | 'scale';
  timestamp: string;
  originalInput: string;
  content: string;
  specialtyId?: string;
  specialtyName?: string;
  scaleId?: string;
  scaleName?: string;
}

// Web Speech API types for TypeScript
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

// Extend window object for TypeScript globally
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}