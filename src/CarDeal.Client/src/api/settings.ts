import apiClient from './client';

export const settingsApi = {
  getLanguage: () =>
    apiClient.get<{ language: string }>('/settings/language').then((r) => r.data),

  setLanguage: (language: string) =>
    apiClient.put('/settings/language', { language }).then((r) => r.data),
};
