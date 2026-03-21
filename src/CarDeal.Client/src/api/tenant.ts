import apiClient from './client';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  contactEmail?: string;
  createdAt: string;
  userCount: number;
  carCount: number;
}

export const tenantApi = {
  list: () => apiClient.get<Tenant[]>('/tenant').then(r => r.data),
  create: (data: { name: string; slug: string; contactEmail?: string }) =>
    apiClient.post<Tenant>('/tenant', data).then(r => r.data),
  getById: (id: number) => apiClient.get<Tenant>(`/tenant/${id}`).then(r => r.data),
  update: (id: number, data: { name?: string; slug?: string; contactEmail?: string }) =>
    apiClient.put<Tenant>(`/tenant/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/tenant/${id}`),
  getUsers: (id: number) => apiClient.get<any[]>(`/tenant/${id}/users`).then(r => r.data),
  assignUser: (id: number, userId: string) =>
    apiClient.post(`/tenant/${id}/users`, { userId }).then(r => r.data),
  removeUser: (id: number, userId: string) =>
    apiClient.delete(`/tenant/${id}/users/${userId}`),
};
