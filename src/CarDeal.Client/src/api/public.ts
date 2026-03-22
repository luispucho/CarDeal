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
  tenantName: string | null;
  tenantId: number | null;
  isShared: boolean;
  images: { id: number; blobUrl: string; fileName: string; isPrimary: boolean; uploadedAt: string }[];
}

export interface PublicTenant {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  carCount: number;
}

export interface TenantBranding {
  tenantId: number;
  tenantName: string;
  slug: string;
  logoUrl?: string;
  tagline?: string;
  contactEmail?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

export const publicApi = {
  getCars: (params?: { make?: string; yearMin?: number; yearMax?: number; priceMin?: number; priceMax?: number; sort?: string; listingType?: string; tenantId?: number }) =>
    apiClient.get<PublicCar[]>('/public/cars', { params }).then(r => r.data),
  getFeatured: () =>
    apiClient.get<PublicCar[]>('/public/cars/featured').then(r => r.data),
  getCarById: (id: number) =>
    apiClient.get<PublicCar>(`/public/cars/${id}`).then(r => r.data),
  getTenants: () =>
    apiClient.get<PublicTenant[]>('/public/tenants').then(r => r.data),
  getBranding: (slug: string) =>
    apiClient.get<TenantBranding>(`/public/branding/${slug}`).then(r => r.data),
};
