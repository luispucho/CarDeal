import apiClient from './client';

// ── Response types ──

export interface CrmCarFinancials {
  id: number;
  carId: number;
  purchasePrice?: number;
  salePrice?: number;
  notes?: string;
  totalExpenses: number;
  profit?: number;
}

export interface CrmCarImage {
  id: number;
  blobUrl: string;
  fileName: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface CrmCarResponse {
  id: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color?: string;
  condition?: string;
  askingPrice?: number;
  status: string;
  listingType: string;
  isFeatured: boolean;
  userName?: string;
  createdAt: string;
  financials?: CrmCarFinancials;
  images: CrmCarImage[];
  expenseCount: number;
  totalExpenses: number;
}

export interface ExpenseResponse {
  id: number;
  carId: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
}

export interface CrmNoteResponse {
  id: number;
  carId: number;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface EmployeeResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface TenantStatsResponse {
  totalCars: number;
  soldCars: number;
  consignedCars: number;
  pendingCars: number;
  activeInventory: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  topProfitableCars: { carId: number; carName: string; profit?: number }[];
  expensesByType: { type: string; total: number }[];
  monthlySales: { month: string; count: number; revenue: number }[];
}

export interface PlatformStatsResponse {
  totalTenants: number;
  totalCars: number;
  totalSold: number;
  totalActive: number;
  salesByTenant: { tenantId: number; tenantName: string; totalCars: number; soldCars: number; revenue: number }[];
  topBrands: { make: string; count: number; soldCount: number }[];
  totalRevenue: number;
}

export interface InvestorResponse {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  totalInvested: number;
  totalReturned: number;
  balance: number;
  createdAt: string;
}

export interface ContributionResponse {
  id: number;
  investorId: number;
  investorName: string;
  amount: number;
  type: string;
  description?: string;
  carId?: number;
  carName?: string;
  date: string;
}

export interface CarFundingResponse {
  id: number;
  carId: number;
  investorId?: number;
  investorName?: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

// ── Request types ──

export interface CreateInvestorRequest {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateInvestorRequest {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateContributionRequest {
  amount: number;
  type: string;
  description?: string;
  carId?: number;
}

export interface CreateCarFundingRequest {
  investorId?: number | null;
  amount: number;
  notes?: string;
}

export interface UpdateFinancialsRequest {
  purchasePrice?: number;
  salePrice?: number;
  notes?: string;
}

export interface CreateExpenseRequest {
  type: string;
  amount: number;
  description?: string;
  date?: string;
}

export interface CreateNoteRequest {
  content: string;
}

export interface AddEmployeeRequest {
  email: string;
}

// ── API client ──

export const crmApi = {
  // Inventory
  getInventory: () =>
    apiClient.get<CrmCarResponse[]>('/crm/inventory').then((r) => r.data),

  getCarById: (id: number) =>
    apiClient.get<CrmCarResponse>(`/crm/inventory/${id}`).then((r) => r.data),

  updateFinancials: (id: number, data: UpdateFinancialsRequest) =>
    apiClient.put(`/crm/inventory/${id}/financials`, data).then((r) => r.data),

  // Expenses
  getExpenses: (carId: number) =>
    apiClient.get<ExpenseResponse[]>(`/crm/inventory/${carId}/expenses`).then((r) => r.data),

  addExpense: (carId: number, data: CreateExpenseRequest) =>
    apiClient.post<ExpenseResponse>(`/crm/inventory/${carId}/expenses`, data).then((r) => r.data),

  deleteExpense: (carId: number, expenseId: number) =>
    apiClient.delete(`/crm/inventory/${carId}/expenses/${expenseId}`).then((r) => r.data),

  // Notes
  getNotes: (carId: number) =>
    apiClient.get<CrmNoteResponse[]>(`/crm/inventory/${carId}/notes`).then((r) => r.data),

  addNote: (carId: number, data: CreateNoteRequest) =>
    apiClient.post<CrmNoteResponse>(`/crm/inventory/${carId}/notes`, data).then((r) => r.data),

  // Employees
  getEmployees: () =>
    apiClient.get<EmployeeResponse[]>('/crm/employees').then((r) => r.data),

  addEmployee: (data: AddEmployeeRequest) =>
    apiClient.post<EmployeeResponse>('/crm/employees', data).then((r) => r.data),

  removeEmployee: (userId: string) =>
    apiClient.delete(`/crm/employees/${userId}`).then((r) => r.data),

  // Stats
  getTenantStats: () =>
    apiClient.get<TenantStatsResponse>('/crm/stats').then((r) => r.data),

  getPlatformStats: () =>
    apiClient.get<PlatformStatsResponse>('/crm/admin/stats').then((r) => r.data),

  resetTenantAdmin: (tenantId: number) =>
    apiClient.post(`/crm/admin/tenants/${tenantId}/reset-admin`).then((r) => r.data),

  // Platforms
  getPlatforms: () =>
    apiClient.get<any[]>('/crm/platforms').then((r) => r.data),

  // Connections
  getConnections: () =>
    apiClient.get<any[]>('/crm/connections').then((r) => r.data),

  createConnection: (data: { platformId: number; apiKey?: string; apiSecret?: string; accessToken?: string; accountId?: string }) =>
    apiClient.post('/crm/connections', data).then((r) => r.data),

  updateConnection: (id: number, data: any) =>
    apiClient.put(`/crm/connections/${id}`, data).then((r) => r.data),

  deleteConnection: (id: number) =>
    apiClient.delete(`/crm/connections/${id}`),

  // Publications
  getPublications: (carId: number) =>
    apiClient.get<any[]>(`/crm/inventory/${carId}/publications`).then((r) => r.data),

  publishCar: (carId: number, connectionId: number) =>
    apiClient.post(`/crm/inventory/${carId}/publish`, { connectionId }).then((r) => r.data),

  updatePublication: (pubId: number) =>
    apiClient.put(`/crm/publications/${pubId}/update`).then((r) => r.data),

  unpublishCar: (pubId: number) =>
    apiClient.post(`/crm/publications/${pubId}/unpublish`).then((r) => r.data),

  // Branding
  getBranding: () =>
    apiClient.get<any>('/crm/branding').then((r) => r.data),

  updateBranding: (data: any) =>
    apiClient.put('/crm/branding', data).then((r) => r.data),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient
      .post('/crm/branding/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deleteLogo: () =>
    apiClient.delete('/crm/branding/logo').then((r) => r.data),

  // Investors
  getInvestors: () =>
    apiClient.get<InvestorResponse[]>('/crm/investors').then((r) => r.data),

  createInvestor: (data: CreateInvestorRequest) =>
    apiClient.post<InvestorResponse>('/crm/investors', data).then((r) => r.data),

  getInvestor: (id: number) =>
    apiClient.get<InvestorResponse>(`/crm/investors/${id}`).then((r) => r.data),

  updateInvestor: (id: number, data: UpdateInvestorRequest) =>
    apiClient.put<InvestorResponse>(`/crm/investors/${id}`, data).then((r) => r.data),

  deleteInvestor: (id: number) =>
    apiClient.delete(`/crm/investors/${id}`).then((r) => r.data),

  // Contributions
  getContributions: (investorId: number) =>
    apiClient.get<ContributionResponse[]>(`/crm/investors/${investorId}/contributions`).then((r) => r.data),

  addContribution: (investorId: number, data: CreateContributionRequest) =>
    apiClient.post<ContributionResponse>(`/crm/investors/${investorId}/contributions`, data).then((r) => r.data),

  // Car Funding
  getCarFunding: (carId: number) =>
    apiClient.get<CarFundingResponse[]>(`/crm/inventory/${carId}/funding`).then((r) => r.data),

  addCarFunding: (carId: number, data: CreateCarFundingRequest) =>
    apiClient.post<CarFundingResponse>(`/crm/inventory/${carId}/funding`, data).then((r) => r.data),

  deleteCarFunding: (carId: number, fundingId: number) =>
    apiClient.delete(`/crm/inventory/${carId}/funding/${fundingId}`).then((r) => r.data),
};
