import React from 'react';
// Imports depuis react-icons (par packs)
import { 
  FaTooth,    // Dentistry (Font Awesome)
  FaHeart,    // Cardiology
  FaBrain,    // Neurology (ou FaUserBrain si disponible)
  FaEye,      // Ophthalmology
  FaBone,     // Orthopedics
  FaBaby,     // Pediatrics
  FaStethoscope, // General Practice
  FaRunning,  // Activity/Emergency
  FaShieldAlt, // Endocrinology
  FaBolt,     // Radiology (Zap-like)
  FaUserMd,   // Doctor/Internal Medicine
  FaSyringe,  // Anesthesiology
  FaUsers,    // Gynecology
  FaVolumeUp, // Otolaryngology (Waves-like)
  FaBullseye, // Oncology
  FaCircle,   // Gastroenterology
  FaTint,     // Urology (Droplet-like)
  FaWind,     // Pulmonology
  FaUserCheck, // Dermatology
  FaTabletAlt, // Medicine (Pill-like)
} from 'react-icons/fa'; // Principalement Font Awesome, mais vous pouvez mixer (ex. : hi pour Heroicons)

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
  const iconMapping: Record<string, React.ComponentType<any>> = {  // Type pour react-icons
    'tooth': FaTooth,                    // Dentistry ✓ (🦷)
    'heart': FaHeart,                    // Cardiology ✓ (❤️)
    'child': FaBaby,                     // Pediatrics ✓
    'skin': FaUserCheck,                 // Dermatology
    'female': FaUsers,                   // Gynecology
    'brain': FaBrain || FaUserMd,        // Neurology (fallback)
    'bone': FaBone,                      // Orthopedics
    'eye': FaEye,                        // Ophthalmology
    'ear': FaVolumeUp,                   // Otolaryngology
    'mind': FaBrain || FaUserMd,         // Psychiatry
    'thyroid': FaShieldAlt,              // Endocrinology
    'stomach': FaCircle,                 // Gastroenterology
    'bladder': FaTint,                   // Urology
    'cancer': FaBullseye,                // Oncology
    'lungs': FaWind,                     // Pulmonology
    'joint': FaBone,                     // Rheumatology
    'stethoscope': FaStethoscope,        // General Practice
    'syringe': FaSyringe,                // Anesthesiology
    'xray': FaBolt,                      // Radiology
    'doctor': FaUserMd,                  // Internal Medicine
    'medical': FaStethoscope,
    'health': FaHeart,
    'medicine': FaTabletAlt,
    'emergency': FaRunning,
  };

  const IconComponent = iconMapping[iconName.toLowerCase().trim()] || FaStethoscope;
  
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