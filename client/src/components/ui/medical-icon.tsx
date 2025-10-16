import * as React from "react";
import { type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMedicalIcon } from "@/config/medical-icons.config";

export interface MedicalIconProps extends Omit<LucideProps, "ref"> {
  /**
   * Nom de l'icône à afficher
   */
  name: string;
  
  /**
   * Classes CSS supplémentaires
   */
  className?: string;
  
  /**
   * Taille de l'icône (applique width et height)
   */
  size?: number | string;
  
  /**
   * Callback en cas d'erreur (icône non trouvée)
   */
  onError?: (iconName: string) => void;
}

/**
 * Composant MedicalIcon - Affiche une icône médicale de manière sécurisée
 * 
 * @example
 * ```tsx
 * <MedicalIcon name="Heart" className="text-red-500" size={24} />
 * ```
 */
export const MedicalIcon = React.forwardRef<SVGSVGElement, MedicalIconProps>(
  ({ name, className, size, onError, ...props }, ref) => {
    const Icon = React.useMemo(() => {
      const icon = getMedicalIcon(name);
      
      // Appeler le callback d'erreur si fourni et icône non trouvée
      if (icon === getMedicalIcon("") && onError) {
        onError(name);
      }
      
      return icon;
    }, [name, onError]);

    return (
      <Icon
        ref={ref}
        className={cn("shrink-0", className)}
        size={size}
        {...props}
      />
    );
  }
);

MedicalIcon.displayName = "MedicalIcon";