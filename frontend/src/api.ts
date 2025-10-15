// API service for communicating with the backend

import axios from 'axios';
import type { AvailableEffects, UploadResponse, ProcessResponse, EffectConfig } from './types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const audioAPI = {
  // Get available effects
  async getEffects(): Promise<AvailableEffects> {
    const response = await api.get<AvailableEffects>('/effects');
    return response.data;
  },

  // Upload audio file
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

  // Process audio with effects
  async processAudio(fileId: string, effects: EffectConfig[]): Promise<ProcessResponse> {
    const response = await api.post<ProcessResponse>('/process', {
      file_id: fileId,
      effects: effects.map(effect => ({
        type: effect.type,
        params: effect.params,
      })),
    });
    return response.data;
  },

  // Get download URL
  getDownloadUrl(fileId: string): string {
    return `${API_BASE_URL}/download/${fileId}`;
  },

  // Cleanup files
  async cleanup(fileId: string): Promise<void> {
    await api.delete(`/cleanup/${fileId}`);
  },
};
