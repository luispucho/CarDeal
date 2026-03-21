import apiClient from './client';
import type { ProfileResponse, UpdateProfileRequest } from '../types';

export const profileApi = {
  getProfile: () =>
    apiClient.get<ProfileResponse>('/profile').then(r => r.data),
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<ProfileResponse>('/profile', data).then(r => r.data),
  uploadPicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ProfileResponse>('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  deletePicture: () =>
    apiClient.delete<ProfileResponse>('/profile/picture').then(r => r.data),
  deleteAccount: () => apiClient.delete('/profile'),
};
