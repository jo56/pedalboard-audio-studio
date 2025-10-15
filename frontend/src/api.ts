// API service for communicating with the backend

import axios from 'axios';
import type {
  AvailableEffects,
  UploadResponse,
  ProcessResponse,
  EffectConfig,
  PresetSummary,
  PresetPayload,
  PresetCreateRequest,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const audioAPI = {
  async getEffects(): Promise<AvailableEffects> {
    const response = await api.get<AvailableEffects>('/effects');
    return response.data;
  },

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async processAudio(
    fileId: string,
    effects: EffectConfig[],
    presetId?: string,
  ): Promise<ProcessResponse> {
    const payload: Record<string, unknown> = {
      file_id: fileId,
    };

    if (presetId) {
      payload.preset_id = presetId;
    }

    if (effects.length > 0) {
      payload.effects = effects.map((effect) => ({
        type: effect.type,
        params: effect.params,
      }));
    }

    const response = await api.post<ProcessResponse>('/process', payload);
    return response.data;
  },

  getDownloadUrl(fileId: string): string {
    return `${API_BASE_URL}/download/${fileId}`;
  },

  async cleanup(fileId: string): Promise<void> {
    await api.delete(`/cleanup/${fileId}`);
  },

  async clearProcessed(fileId: string): Promise<void> {
    await api.delete(`/processed/${fileId}`);
  },

  async listPresets(): Promise<PresetSummary[]> {
    const response = await api.get<PresetSummary[]>('/presets');
    return response.data;
  },

  async getPreset(presetId: string): Promise<PresetPayload> {
    const response = await api.get<PresetPayload>(`/presets/${presetId}`);
    return response.data;
  },

  async createPreset(request: PresetCreateRequest): Promise<{ preset: PresetPayload; download_url: string }> {
    const response = await api.post<{ preset: PresetPayload; download_url: string }>('/presets', request);
    return response.data;
  },

  async deletePreset(presetId: string): Promise<void> {
    await api.delete(`/presets/${presetId}`);
  },

  presetDownloadUrl(presetId: string): string {
    return `${API_BASE_URL}/presets/${presetId}/download`;
  },
};
