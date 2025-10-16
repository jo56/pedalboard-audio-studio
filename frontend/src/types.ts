// Type definitions for the application

export type EffectParamType = 'float' | 'int' | 'enum' | 'string' | 'bool' | 'file' | 'dict';

export interface EffectParam {
  type: EffectParamType;
  min?: number;
  max?: number;
  default: number | string | boolean | null;
  options?: string[];
  required?: boolean;
  help?: string;
}

export interface EffectDefinition {
  name: string;
  description: string;
  params: Record<string, EffectParam>;
  tags?: string[];
  notes?: string;
  aliases?: string[];
}

export interface EffectConfig {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface AvailableEffects {
  [key: string]: EffectDefinition;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  message: string;
}

export interface ProcessResponse {
  file_id: string;
  processed: boolean;
  message: string;
  download_url: string;
}
