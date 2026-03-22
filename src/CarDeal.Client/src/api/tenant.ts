import apiClient from './client';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  contactEmail?: string;
  tier: string;
  createdAt: string;
  userCount: number;
  carCount: number;
  isActive: boolean;
  isShowcased: boolean;
}

export const tenantApi = {
  list: () => apiClient.get<Tenant[]>('/tenant').then(r => r.data),
  create: (data: { name: string; slug: string; contactEmail?: string; isShowcased?: boolean }) =>
    apiClient.post<Tenant>('/tenant', data).then(r => r.data),
  getById: (id: number) => apiClient.get<Tenant>(`/tenant/${id}`).then(r => r.data),
  update: (id: number, data: { name?: string; slug?: string; contactEmail?: string; isShowcased?: boolean }) =>
    apiClient.put<Tenant>(`/tenant/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/tenant/${id}?confirm=true`),
  activate: (id: number) => apiClient.put(`/tenant/${id}/activate`),
  deactivate: (id: number) => apiClient.put(`/tenant/${id}/deactivate`),
  getUsers: (id: number) => apiClient.get<any[]>(`/tenant/${id}/users`).then(r => r.data),
  assignUser: (id: number, userId: string) =>
    apiClient.post(`/tenant/${id}/users`, { userId }).then(r => r.data),
  removeUser: (id: number, userId: string) =>
    apiClient.delete(`/tenant/${id}/users/${userId}`),
  resetPassword: (id: number) =>
    apiClient.post<{ email: string; newPassword: string; message: string }>(`/tenant/${id}/reset-password`).then(r => r.data),
  sendCredentials: (id: number) =>
    apiClient.post<{ email: string; message: string }>(`/tenant/${id}/send-credentials`).then(r => r.data),
};
