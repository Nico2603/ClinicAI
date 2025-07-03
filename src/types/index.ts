export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type ActiveView = 'templates' | 'generate' | 'history';

export interface Specialty {
  id: string;
  name: string;
}

export type Templates = Record<string, string>; // Key: specialtyId, Value: template string

export interface GeneratedNote {
  id: string; // Could be timestamp or UUID
  specialtyId: string;
  content: string;
  timestamp: Date;
}

export interface GroundingChunkWeb {
  uri?: string;
  title?: string; // Made optional to align with @google/genai library
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of grounding chunks can be added here if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added here
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate fields
}

export interface HistoricNote {
  id: string; // Unique ID, e.g., timestamp
  type: 'template' | 'suggestion' | 'scale';
  timestamp: string; // ISO date string
  originalInput: string; // The user input that generated this note
  content: string; // The generated note content
  // Template-specific
  specialtyId?: string;
  specialtyName?: string;
  // Scale-specific
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