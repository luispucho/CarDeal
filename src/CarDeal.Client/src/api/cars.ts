import apiClient from './client';
import type { Car, CarImage, CreateCarRequest, UpdateCarRequest } from '../types';

export const carsApi = {
  getMyCars: () =>
    apiClient.get<Car[]>('/cars').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Car>(`/cars/${id}`).then((r) => r.data),

  create: (data: CreateCarRequest) =>
    apiClient.post<Car>('/cars', data).then((r) => r.data),

  update: (id: number, data: UpdateCarRequest) =>
    apiClient.put<Car>(`/cars/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/cars/${id}`).then((r) => r.data),

  uploadImage: (carId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<CarImage>(`/cars/${carId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deleteImage: (carId: number, imageId: number) =>
    apiClient.delete(`/cars/${carId}/images/${imageId}`).then((r) => r.data),
};
