import { Patient, Visit, Consultation, Medication, LabRequest, ImagingRequest, Invoice, DashboardStats, User } from '@/types';

// Utilisateur courant (simulé)
export const currentUser: User = {
  id: 'usr-001',
  name: 'Dr. Amadou Koné',
  email: 'amadou.kone@clinique.td',
  role: 'medecin',
};

// Patients de démonstration
export const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    code: 'PAT-2024-0001',
    firstName: 'Fatima',
    lastName: 'Mahamat',
    dateOfBirth: '1985-03-15',
    gender: 'F',
    phone: '+235 66 12 34 56',
    address: 'Quartier Moursal, N\'Djamena',
    bloodType: 'O+',
    allergies: ['Pénicilline'],
    emergencyContact: {
      name: 'Ibrahim Mahamat',
      phone: '+235 66 78 90 12',
      relationship: 'Époux',
    },
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'pat-002',
    code: 'PAT-2024-0002',
    firstName: 'Oumar',
    lastName: 'Abdoulaye',
    dateOfBirth: '1990-07-22',
    gender: 'M',
    phone: '+235 66 23 45 67',
    address: 'Quartier Klemat, N\'Djamena',
    bloodType: 'A+',
    createdAt: '2024-01-16T10:15:00Z',
    updatedAt: '2024-01-16T10:15:00Z',
  },
  {
    id: 'pat-003',
    code: 'PAT-2024-0003',
    firstName: 'Aïcha',
    lastName: 'Youssouf',
    dateOfBirth: '1978-11-08',
    gender: 'F',
    phone: '+235 66 34 56 78',
    address: 'Quartier Farcha, N\'Djamena',
    bloodType: 'B+',
    allergies: ['Aspirine', 'Sulfamides'],
    createdAt: '2024-01-17T14:45:00Z',
    updatedAt: '2024-01-17T14:45:00Z',
  },
  {
    id: 'pat-004',
    code: 'PAT-2024-0004',
    firstName: 'Hassan',
    lastName: 'Idriss',
    dateOfBirth: '2015-02-28',
    gender: 'M',
    phone: '+235 66 45 67 89',
    address: 'Quartier Djambalbarh, N\'Djamena',
    emergencyContact: {
      name: 'Mariam Idriss',
      phone: '+235 66 56 78 90',
      relationship: 'Mère',
    },
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z',
  },
  {
    id: 'pat-005',
    code: 'PAT-2024-0005',
    firstName: 'Khadija',
    lastName: 'Ali',
    dateOfBirth: '1965-06-10',
    gender: 'F',
    phone: '+235 66 56 78 90',
    address: 'Quartier Ambassatna, N\'Djamena',
    bloodType: 'AB+',
    createdAt: '2024-01-19T11:30:00Z',
    updatedAt: '2024-01-19T11:30:00Z',
  },
];

// Visites de démonstration
export const mockVisits: Visit[] = [
  {
    id: 'vis-001',
    patientId: 'pat-001',
    date: '2024-01-20T08:00:00Z',
    type: 'consultation',
    status: 'en_cours',
    doctorId: 'usr-001',
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    id: 'vis-002',
    patientId: 'pat-002',
    date: '2024-01-20T09:30:00Z',
    type: 'consultation',
    status: 'en_attente',
    createdAt: '2024-01-20T09:30:00Z',
  },
  {
    id: 'vis-003',
    patientId: 'pat-003',
    date: '2024-01-20T10:00:00Z',
    type: 'urgence',
    status: 'en_attente',
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'vis-004',
    patientId: 'pat-004',
    date: '2024-01-20T11:00:00Z',
    type: 'suivi',
    status: 'en_attente',
    createdAt: '2024-01-20T11:00:00Z',
  },
];

// Médicaments de démonstration
export const mockMedications: Medication[] = [
  {
    id: 'med-001',
    name: 'Paracétamol 500mg',
    genericName: 'Paracétamol',
    category: 'Antalgique',
    form: 'comprimé',
    dosageUnit: 'mg',
    stockQuantity: 500,
    alertThreshold: 100,
    unitPrice: 50,
  },
  {
    id: 'med-002',
    name: 'Amoxicilline 500mg',
    genericName: 'Amoxicilline',
    category: 'Antibiotique',
    form: 'comprimé',
    dosageUnit: 'mg',
    stockQuantity: 45,
    alertThreshold: 50,
    unitPrice: 150,
  },
  {
    id: 'med-003',
    name: 'Ibuprofène 400mg',
    genericName: 'Ibuprofène',
    category: 'Anti-inflammatoire',
    form: 'comprimé',
    dosageUnit: 'mg',
    stockQuantity: 200,
    alertThreshold: 50,
    unitPrice: 75,
  },
  {
    id: 'med-004',
    name: 'Métronidazole 250mg',
    genericName: 'Métronidazole',
    category: 'Antiparasitaire',
    form: 'comprimé',
    dosageUnit: 'mg',
    stockQuantity: 25,
    alertThreshold: 30,
    unitPrice: 100,
  },
];

// Demandes de laboratoire
export const mockLabRequests: LabRequest[] = [
  {
    id: 'lab-001',
    consultationId: 'cons-001',
    patientId: 'pat-001',
    testType: 'Numération Formule Sanguine (NFS)',
    status: 'en_cours',
    priority: 'normale',
    requestedAt: '2024-01-20T08:30:00Z',
  },
  {
    id: 'lab-002',
    consultationId: 'cons-001',
    patientId: 'pat-001',
    testType: 'Glycémie à jeun',
    status: 'demande',
    priority: 'normale',
    requestedAt: '2024-01-20T08:30:00Z',
  },
  {
    id: 'lab-003',
    consultationId: 'cons-002',
    patientId: 'pat-003',
    testType: 'Test de paludisme (GE)',
    status: 'demande',
    priority: 'urgente',
    requestedAt: '2024-01-20T10:15:00Z',
  },
];

// Demandes d'imagerie
export const mockImagingRequests: ImagingRequest[] = [
  {
    id: 'img-001',
    consultationId: 'cons-001',
    patientId: 'pat-001',
    examType: 'radio',
    bodyPart: 'Thorax',
    status: 'demande',
    priority: 'normale',
    requestedAt: '2024-01-20T08:45:00Z',
  },
  {
    id: 'img-002',
    consultationId: 'cons-002',
    patientId: 'pat-005',
    examType: 'echo',
    bodyPart: 'Abdomen',
    status: 'en_cours',
    priority: 'normale',
    requestedAt: '2024-01-20T09:00:00Z',
  },
];

// Statistiques du dashboard
export const mockDashboardStats: DashboardStats = {
  patientsToday: 12,
  consultationsToday: 8,
  revenueToday: 125000,
  pendingLabs: 3,
  pendingImaging: 2,
  lowStockMedications: 2,
};

// Factures récentes
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    patientId: 'pat-001',
    visitId: 'vis-001',
    items: [
      {
        id: 'item-001',
        type: 'consultation',
        description: 'Consultation générale',
        quantity: 1,
        unitPrice: 5000,
        totalPrice: 5000,
      },
      {
        id: 'item-002',
        type: 'analyse',
        description: 'NFS',
        quantity: 1,
        unitPrice: 3500,
        totalPrice: 3500,
      },
    ],
    totalAmount: 8500,
    paidAmount: 8500,
    status: 'paye',
    createdAt: '2024-01-20T08:30:00Z',
    paidAt: '2024-01-20T08:35:00Z',
  },
  {
    id: 'inv-002',
    patientId: 'pat-002',
    visitId: 'vis-002',
    items: [
      {
        id: 'item-003',
        type: 'consultation',
        description: 'Consultation générale',
        quantity: 1,
        unitPrice: 5000,
        totalPrice: 5000,
      },
    ],
    totalAmount: 5000,
    paidAmount: 0,
    status: 'en_attente',
    createdAt: '2024-01-20T09:30:00Z',
  },
];
