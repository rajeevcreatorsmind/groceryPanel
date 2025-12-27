export interface DeliveryBoy {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  bikeNumber?: string;
  address?: string;
  password?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  drivingNumber?: string;
  profileImageUrl?: string;

  // Document URLs (PDFs)
  aadhaarDocUrl?: string;
  panDocUrl?: string;
  drivingDocUrl?: string;
  vehicleDocUrl?: string;

  // Stats & Tracking
  rating?: number;
  commissionEarned?: number;
  successfulDeliveries?: number;
  cancelledDeliveries?: number;
  totalDeliveries?: number;

  // Timestamps
  joinedAt?: string;        // or createdAt if you prefer consistency
  createdAt?: string;
  approvedAt?: string;
  updatedAt?: string;

  approved: boolean;
  status: 'Active' | 'Suspended' | 'Deleted' | 'Rejected' | 'Pending';
  canLogin: boolean;
}