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

export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  created_at: string;
  effects_count: number;
}

export interface PresetPayload {
  id: string;
  name: string;
  description: string;
  created_at: string;
  effects: EffectConfigPayload[];
  schema_version: number;
  metadata?: Record<string, any>;
}

export interface EffectConfigPayload {
  type: string;
  params: Record<string, any>;
}

export interface PresetCreateRequest {
  name: string;
  description?: string;
  effects: EffectConfigPayload[];
  metadata?: Record<string, any>;
}
