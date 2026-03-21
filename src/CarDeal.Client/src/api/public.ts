import apiClient from './client';

export interface PublicCar {
  id: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color?: string;
  condition?: string;
  description?: string;
  askingPrice?: number;
  listingType: string;
  images: { id: number; blobUrl: string; fileName: string; isPrimary: boolean; uploadedAt: string }[];
}

export const publicApi = {
  getCars: (params?: { make?: string; yearMin?: number; yearMax?: number; priceMin?: number; priceMax?: number; sort?: string; listingType?: string }) =>
    apiClient.get<PublicCar[]>('/public/cars', { params }).then(r => r.data),
  getFeatured: () =>
    apiClient.get<PublicCar[]>('/public/cars/featured').then(r => r.data),
  getCarById: (id: number) =>
    apiClient.get<PublicCar>(`/public/cars/${id}`).then(r => r.data),
};
