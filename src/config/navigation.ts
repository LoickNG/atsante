import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  Pill,
  FlaskConical,
  ImageIcon,
  CreditCard,
  Settings,
  FileText,
  Activity,
  FileDown,
  BedDouble,
  Scissors,
  Baby,
  Siren,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: 'Principal',
    items: [
      {
        title: 'Tableau de bord',
        href: '/',
        icon: LayoutDashboard,
        roles: ['super_admin', 'admin', 'pca', 'dg', 'accueil', 'medecin', 'infirmier', 'caissier', 'pharmacien', 'laborantin', 'imagerie', 'daf'],
      },
    ],
  },
  {
    title: 'Patients',
    items: [
      {
        title: 'Liste des patients',
        href: '/patients',
        icon: Users,
        roles: ['accueil', 'medecin', 'infirmier'],
      },
      {
        title: 'Nouveau patient',
        href: '/patients/nouveau',
        icon: UserPlus,
        roles: ['accueil'],
      },
    ],
  },
  {
    title: 'Soins',
    items: [
      {
        title: 'Urgences',
        href: '/urgences',
        icon: Siren,
        roles: ['medecin', 'infirmier', 'accueil'],
      },
      {
        title: 'Consultations',
        href: '/consultations',
        icon: Stethoscope,
        roles: ['medecin'],
      },
      {
        title: 'Hospitalisations',
        href: '/hospitalisations',
        icon: BedDouble,
        roles: ['medecin', 'infirmier'],
      },
      {
        title: 'Bloc Opératoire',
        href: '/bloc-operatoire',
        icon: Scissors,
        roles: ['medecin', 'infirmier'],
      },
      {
        title: 'Maternité',
        href: '/maternite',
        icon: Baby,
        roles: ['medecin', 'infirmier'],
      },
      {
        title: 'File d\'attente',
        href: '/file-attente',
        icon: Activity,
        roles: ['accueil', 'medecin', 'infirmier'],
      },
    ],
  },
  {
    title: 'Services',
    items: [
      {
        title: 'Pharmacie',
        href: '/pharmacie',
        icon: Pill,
        roles: ['pharmacien'],
      },
      {
        title: 'Laboratoire',
        href: '/laboratoire',
        icon: FlaskConical,
        roles: ['laborantin'],
      },
      {
        title: 'Imagerie',
        href: '/imagerie',
        icon: ImageIcon,
        roles: ['imagerie'],
      },
    ],
  },
  {
    title: 'Finances',
    items: [
      {
        title: 'Facturation',
        href: '/facturation',
        icon: FileText,
        roles: ['daf'],
      },
      {
        title: 'Paiements',
        href: '/paiements',
        icon: CreditCard,
        roles: ['caissier', 'daf'],
      },
      {
        title: 'Extraits & Relevés',
        href: '/extraits',
        icon: FileDown,
        roles: ['daf'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Paramètres',
        href: '/parametres',
        icon: Settings,
        roles: ['admin', 'super_admin'],
      },
    ],
  },
];

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrateur',
    demo: 'Démo (Accès complet)',
    pca: 'PCA',
    dg: 'Directeur Général',
    accueil: 'Accueil',
    medecin: 'Médecin',
    infirmier: 'Infirmier(ère)',
    caissier: 'Caissier(ère)',
    pharmacien: 'Pharmacien(ne)',
    laborantin: 'Laborantin(e)',
    imagerie: 'Technicien Imagerie',
    daf: 'DAF',
  };
  return labels[role];
};

export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    super_admin: 'bg-role-admin',
    admin: 'bg-role-admin',
    demo: 'bg-role-admin',
    pca: 'bg-role-admin',
    dg: 'bg-role-admin',
    accueil: 'bg-role-accueil',
    medecin: 'bg-role-medecin',
    infirmier: 'bg-role-infirmier',
    caissier: 'bg-role-caissier',
    pharmacien: 'bg-role-pharmacien',
    laborantin: 'bg-role-laborantin',
    imagerie: 'bg-role-imagerie',
    daf: 'bg-role-caissier',
  };
  return colors[role];
};

export const DEMO_EMAIL = 'demo@atsante.td';

export const getFilteredNavigation = (userRole: UserRole, email?: string | null): NavSection[] => {
  const isSuperAdmin = userRole === 'super_admin';
  const isDemoRole = userRole === 'demo';
  return navigationConfig
    .map(section => ({
      ...section,
      items: section.items.filter(item => isSuperAdmin || isDemoRole || item.roles.includes(userRole)),
    }))
    .filter(section => section.items.length > 0);
};
