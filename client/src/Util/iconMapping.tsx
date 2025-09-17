import {
  Heart,
  Brain,
  Eye,
  Bone,
  Baby,
  Stethoscope,
  Activity,
  Shield,
  Zap,
  Scissors,
  User,
  Syringe,
  Users,
  Waves,
  Target,
  Circle,
  Pill,
  UserCheck,
  Wind,
  Droplet,
  type LucideIcon
} from "lucide-react";

// Mapping optimisé pour une meilleure représentation visuelle
export const iconMapping: Record<string, LucideIcon> = {
  // Mapping exact basé sur vos données avec de meilleures icônes
  'heart': Heart,              // Cardiology ✓
  'child': Baby,               // Pediatrics ✓
  'skin': UserCheck,           // Dermatology - UserCheck pour la santé de la peau
  'female': Users,             // Gynecology - Users pour représenter les femmes
  'brain': Brain,              // Neurology ✓
  'bone': Bone,                // Orthopedics ✓
  'eye': Eye,                  // Ophthalmology ✓
  'ear': Waves,                // Otolaryngology (ENT) - Waves pour le son/vibration
  'mind': Brain,               // Psychiatry - Brain pour la santé mentale
  'thyroid': Shield,           // Endocrinology - Shield pour protection hormonale
  'stomach': Circle,           // Gastroenterology - Circle pour l'estomac
  'bladder': Droplet,          // Urology - Droplet pour les fluides
  'cancer': Target,            // Oncology - Target pour cibler les cellules cancéreuses
  'lungs': Wind,               // Pulmonology - Wind pour la respiration
  'joint': Bone,               // Rheumatology - Bone pour articulations
  'stethoscope': Stethoscope,  // General Practice ✓
  'scalpel': Scissors,         // General Surgery - Scissors comme scalpel
  'syringe': Syringe,          // Anesthesiology ✓
  'xray': Zap,                 // Radiology - Zap pour les rayons X
  'doctor': User,              // Internal Medicine - User pour médecin
  
  // Fallbacks et alternatives
  'medical': Stethoscope,
  'health': Heart,
  'medicine': Pill,
  'emergency': Activity,
};

// Fonction helper avec gestion d'erreur
export const getIconComponent = (iconName: string): LucideIcon => {
  const normalizedName = iconName.toLowerCase().trim();
  const icon = iconMapping[normalizedName];
  
  if (!icon) {
    console.warn(`Icône non trouvée pour: ${iconName}, utilisation du fallback`);
    return Stethoscope; // Fallback médical approprié
  }
  
  return icon;
};

// Version avec debug pour développement
export const getIconComponentWithDebug = (iconName: string): LucideIcon => {
  const normalizedName = iconName.toLowerCase().trim();
  const icon = iconMapping[normalizedName];
  
  if (process.env.NODE_ENV === 'development') {
    if (!icon) {
      console.warn(`🚨 Icône manquante: "${iconName}" -> utilise Stethoscope comme fallback`);
    } else {
      console.log(`✅ Icône trouvée: "${iconName}" -> ${icon.name || 'Component'}`);
    }
  }
  
  return icon || Stethoscope;
};

// Composant d'icône réutilisable avec styles cohérents
import React from 'react';

interface MedicalIconProps {
  iconName: string;
  size?: number;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export const MedicalIcon: React.FC<MedicalIconProps> = ({ 
  iconName, 
  size = 48, 
  className = '',
  variant = 'default'
}) => {
  const IconComponent = getIconComponent(iconName);
  
  const variantClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-muted-foreground'
  };
  
  return (
    <IconComponent 
      size={size} 
      className={`${variantClasses[variant]} ${className}`}
      aria-label={`Icône pour ${iconName}`}
    />
  );
};

// Hook personnalisé pour utiliser les icônes
export const useMedicalIcon = (iconName: string) => {
  return React.useMemo(() => getIconComponent(iconName), [iconName]);
};