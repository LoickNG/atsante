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
        roles: ['admin', 'accueil', 'medecin', 'infirmier', 'caissier', 'pharmacien', 'laborantin', 'imagerie'],
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
        roles: ['admin', 'accueil', 'medecin', 'infirmier', 'caissier'],
      },
      {
        title: 'Nouveau patient',
        href: '/patients/nouveau',
        icon: UserPlus,
        roles: ['admin', 'accueil'],
      },
    ],
  },
  {
    title: 'Soins',
    items: [
      {
        title: 'Consultations',
        href: '/consultations',
        icon: Stethoscope,
        roles: ['admin', 'medecin', 'infirmier'],
      },
      {
        title: 'File d\'attente',
        href: '/file-attente',
        icon: Activity,
        roles: ['admin', 'accueil', 'medecin', 'infirmier'],
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
        roles: ['admin', 'pharmacien', 'medecin'],
      },
      {
        title: 'Laboratoire',
        href: '/laboratoire',
        icon: FlaskConical,
        roles: ['admin', 'laborantin', 'medecin'],
      },
      {
        title: 'Imagerie',
        href: '/imagerie',
        icon: ImageIcon,
        roles: ['admin', 'imagerie', 'medecin'],
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
        roles: ['admin', 'caissier'],
      },
      {
        title: 'Paiements',
        href: '/paiements',
        icon: CreditCard,
        roles: ['admin', 'caissier'],
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
        roles: ['admin'],
      },
    ],
  },
];

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrateur',
    accueil: 'Accueil',
    medecin: 'Médecin',
    infirmier: 'Infirmier(ère)',
    caissier: 'Caissier(ère)',
    pharmacien: 'Pharmacien(ne)',
    laborantin: 'Laborantin(e)',
    imagerie: 'Technicien Imagerie',
  };
  return labels[role];
};

export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    admin: 'bg-role-admin',
    accueil: 'bg-role-accueil',
    medecin: 'bg-role-medecin',
    infirmier: 'bg-role-infirmier',
    caissier: 'bg-role-caissier',
    pharmacien: 'bg-role-pharmacien',
    laborantin: 'bg-role-laborantin',
    imagerie: 'bg-role-imagerie',
  };
  return colors[role];
};

export const getFilteredNavigation = (userRole: UserRole): NavSection[] => {
  return navigationConfig
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(userRole)),
    }))
    .filter(section => section.items.length > 0);
};
