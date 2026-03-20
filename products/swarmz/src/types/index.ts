export type VehicleStatus =
  | 'available'
  | 'out'
  | 'fueling'
  | 'service'
  | 'repair'
  | 'cleaning'
  | 'accident'
  | 'towed';

export type CostCategory = 'fuel' | 'service' | 'repair' | 'cleaning' | 'accident' | 'other';

export type PlanType = 'solo' | 'fleet';

export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin?: string;
  photoUrl: string | null;
  currentStatus: VehicleStatus;
  odometer: number;
  monthlySpend: number;
  assignedDriverId?: string;
  createdAt: string;
}

export interface StatusLogEntry {
  id: string;
  vehicleId: string;
  status: VehicleStatus;
  timestamp: string;
  odometer?: number;
  costAmount?: number;
  costCategory?: CostCategory;
  notes?: string;
  vendor?: string;
  receiptPhotos: string[];
  receiptData?: ExtractedReceipt;
}

export interface ExtractedReceipt {
  vendor: string;
  date: string;
  total: number;
  lineItems: ReceiptLineItem[];
  rawText: string;
}

export interface ReceiptLineItem {
  description: string;
  amount: number;
  category: CostCategory | 'personal';
  included: boolean;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  assignedVehicleIds: string[];
  inviteStatus: 'pending' | 'accepted';
  createdAt: string;
}

export interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  hasReceipt: boolean;
}

export const STATUS_CONFIG: Record<VehicleStatus, StatusConfig> = {
  available:  { label: 'Available',  icon: 'check_circle',      color: 'positive',  hasReceipt: false },
  out:        { label: 'Out',        icon: 'call_made',          color: 'blue',      hasReceipt: false },
  fueling:    { label: 'Fueling',    icon: 'local_gas_station',  color: 'warning',   hasReceipt: true },
  service:    { label: 'Service',    icon: 'build',              color: 'purple',    hasReceipt: true },
  repair:     { label: 'Repair',     icon: 'handyman',           color: 'negative',  hasReceipt: true },
  cleaning:   { label: 'Cleaning',   icon: 'local_car_wash',     color: 'info',      hasReceipt: true },
  accident:   { label: 'Accident',   icon: 'warning',            color: 'red-10',    hasReceipt: true },
  towed:      { label: 'Towed',      icon: 'rv_hookup',          color: 'grey',      hasReceipt: true },
};
