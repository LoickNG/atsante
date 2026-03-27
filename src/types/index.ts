export type UserRole = 
  | 'admin'
  | 'accueil'
  | 'medecin'
  | 'infirmier'
  | 'caissier'
  | 'pharmacien'
  | 'laborantin'
  | 'imagerie'
  | 'daf';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Patient {
  id: string;
  code: string; // Code unique pour QR
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  phone: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  type: 'consultation' | 'urgence' | 'suivi';
  status: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  doctorId?: string;
  notes?: string;
  diagnosis?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  notes?: string;
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
  };
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  imagingRequests: ImagingRequest[];
  status: 'en_cours' | 'termine';
  createdAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  dispensed: boolean;
  dispensedAt?: string;
  dispensedBy?: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  form: 'comprimé' | 'sirop' | 'injectable' | 'pommade' | 'gouttes' | 'autre';
  dosageUnit: string;
  stockQuantity: number;
  alertThreshold: number;
  unitPrice: number;
  expiryDate?: string;
}

export interface LabRequest {
  id: string;
  consultationId: string;
  patientId: string;
  testType: string;
  status: 'demande' | 'en_cours' | 'termine' | 'annule';
  priority: 'normale' | 'urgente';
  results?: string;
  resultValues?: Record<string, string | number>;
  validatedBy?: string;
  validatedAt?: string;
  requestedAt: string;
  completedAt?: string;
}

export interface ImagingRequest {
  id: string;
  consultationId: string;
  patientId: string;
  examType: 'radio' | 'echo' | 'scanner' | 'irm' | 'autre';
  bodyPart: string;
  status: 'demande' | 'en_cours' | 'termine' | 'annule';
  priority: 'normale' | 'urgente';
  imageUrl?: string;
  report?: string;
  performedBy?: string;
  requestedAt: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  visitId: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'en_attente' | 'partiel' | 'paye' | 'annule';
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceItem {
  id: string;
  type: 'consultation' | 'medicament' | 'analyse' | 'imagerie' | 'autre';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'mobile_money' | 'carte' | 'autre';
  reference?: string;
  receivedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// Statistiques pour le dashboard
export interface DashboardStats {
  patientsToday: number;
  consultationsToday: number;
  revenueToday: number;
  pendingLabs: number;
  pendingImaging: number;
  lowStockMedications: number;
}
