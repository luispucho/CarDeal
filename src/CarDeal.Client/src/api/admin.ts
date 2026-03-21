import apiClient from './client';
import type {
  Car,
  Consignment,
  CreateConsignmentRequest,
  CreateOfferRequest,
  DashboardStats,
  Offer,
} from '../types';

export const adminApi = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/admin/dashboard').then((r) => r.data),

  getAllCars: (status?: string) =>
    apiClient.get<Car[]>('/admin/cars', { params: { status } }).then((r) => r.data),

  getCar: (id: number) =>
    apiClient.get<Car>(`/admin/cars/${id}`).then((r) => r.data),

  makeOffer: (carId: number, data: CreateOfferRequest) =>
    apiClient.post<Offer>(`/admin/cars/${carId}/offer`, data).then((r) => r.data),

  updateOffer: (offerId: number, data: Partial<Offer>) =>
    apiClient.put<Offer>(`/admin/offers/${offerId}`, data).then((r) => r.data),

  createConsignment: (carId: number, data: CreateConsignmentRequest) =>
    apiClient.post<Consignment>(`/admin/cars/${carId}/consign`, data).then((r) => r.data),

  updateConsignment: (id: number, data: Partial<Consignment>) =>
    apiClient.put<Consignment>(`/admin/consignments/${id}`, data).then((r) => r.data),

  getConsignments: (status?: string) =>
    apiClient.get<Consignment[]>('/admin/consignments', { params: { status } }).then((r) => r.data),
};
