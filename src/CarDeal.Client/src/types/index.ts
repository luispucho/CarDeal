export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  profilePictureUrl?: string;
  role: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  profilePictureUrl?: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: UserDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CarImage {
  id: number;
  blobUrl: string;
  fileName: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface Offer {
  id: number;
  carId: number;
  adminUserId: string;
  adminName: string;
  amount: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Car {
  id: number;
  userId: string;
  userName: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin?: string;
  color?: string;
  condition?: string;
  description?: string;
  askingPrice?: number;
  status: string;
  isFeatured: boolean;
  tenantId?: number | null;
  tenantName?: string | null;
  createdAt: string;
  updatedAt: string;
  images: CarImage[];
  offers?: Offer[];
}

export interface CreateCarRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin?: string;
  color?: string;
  condition?: string;
  description?: string;
  askingPrice?: number;
}

export interface UpdateCarRequest {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  vin?: string;
  color?: string;
  condition?: string;
  description?: string;
  askingPrice?: number;
}

export interface Consignment {
  id: number;
  carId: number;
  agreedPrice: number;
  commissionPercent: number;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

export interface CreateOfferRequest {
  amount: number;
  notes?: string;
}

export interface CreateConsignmentRequest {
  agreedPrice: number;
  commissionPercent: number;
  startDate: string;
  endDate?: string;
}

export interface Message {
  id: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  carId?: number;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxThread {
  otherUserId: string;
  otherUserName: string;
  carId?: number;
  carName?: string;
  lastMessageSubject: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: string;
  carId?: number;
  subject: string;
  body: string;
}

export interface DashboardStats {
  totalCars: number;
  pendingCars: number;
  activeOffers: number;
  activeConsignments: number;
  totalUsers: number;
  recentSubmissions: Car[];
}
