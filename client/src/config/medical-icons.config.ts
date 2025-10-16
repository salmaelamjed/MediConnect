import {
  Heart,
  Baby,
  Brain,
  Siren,
  Smile,
  Bone,
  Eye,
  Droplet,
  Stethoscope,
  Activity,
  Pill,
  Syringe,
  Thermometer,
  Microscope,
  Ambulance,
  HeartPulse,
  Ear,
  Dna,
  Palmtree,
  TestTube,
  Scale,
  Tablets,
  Radio,
  Scissors,
  Scan,
  Circle,
  type LucideIcon,
} from "lucide-react";

/**
 * Configuration centralisée des icônes médicales
 * Permet une maintenance facile et une cohérence dans toute l'application
 */
export const MEDICAL_ICONS_MAP: Record<string, LucideIcon> = {
  // Spécialités principales
  Heart,
  Baby,
  Brain,
  Siren,
  Smile,
  Bone,
  Eye,
  Droplet,
  Stethoscope,
  Activity,
  Pill,
  Syringe,
  Thermometer,
  Microscope,
  Ambulance,
  HeartPulse,
  Ear,
  Dna,
  Palmtree,
  TestTube,
  Scale,
  Tablets,
  Radio,
  Scissors,
  Scan,
} as const;

/**
 * Icône par défaut si l'icône demandée n'existe pas
 */
export const DEFAULT_MEDICAL_ICON: LucideIcon = Circle;

/**
 * Type pour les noms d'icônes valides
 */
export type MedicalIconName = keyof typeof MEDICAL_ICONS_MAP;

/**
 * Récupère une icône médicale de manière sécurisée
 * @param iconName - Nom de l'icône à récupérer
 * @returns Le composant d'icône correspondant ou l'icône par défaut
 */
export const getMedicalIcon = (iconName: string): LucideIcon => {
  const icon = MEDICAL_ICONS_MAP[iconName as MedicalIconName];

  if (!icon) {
    console.warn(
      `Icon "${iconName}" not found in MEDICAL_ICONS_MAP. Using default icon.`
    );
    return DEFAULT_MEDICAL_ICON;
  }

  return icon;
};

/**
 * Vérifie si une icône existe dans la configuration
 */
export const isMedicalIconValid = (iconName: string): boolean => {
  return iconName in MEDICAL_ICONS_MAP;
};

/**
 * Retourne la liste de toutes les icônes disponibles
 */
export const getAvailableMedicalIcons = (): MedicalIconName[] => {
  return Object.keys(MEDICAL_ICONS_MAP) as MedicalIconName[];
};
