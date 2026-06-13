export type Language = 'zh' | 'id' | 'en';
export type SourceLanguage = Language | 'auto';

export interface TranslateRequest {
  text: string;
  from: SourceLanguage;
  to: Language;
}

export interface TranslateResponse {
  translation: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  from: SourceLanguage;
  to: Language;
  input: string;
  output: string;
  timestamp: number;
}
