// Type definitions for the application

export interface EffectParam {
  min?: number;
  max?: number;
  default: number | string;
  options?: string[];
}

export interface EffectDefinition {
  name: string;
  description: string;
  params: Record<string, EffectParam>;
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
