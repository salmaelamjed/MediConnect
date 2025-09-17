import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from 'lucide-react';
import { MedicalIcon } from "@/Util/iconMapping";
import { Link } from 'react-router-dom';

interface ISpeciality {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

interface ServiceCardProps {
  service: ISpeciality;
  onClick?: (service: ISpeciality) => void;
}

// Main Service Card (Vertical with Enhanced Design)
export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const handleClick = () => {
    onClick?.(service);
  };

  return (
    <Card
      className="relative h-full overflow-hidden transition-all duration-300 shadow-md cursor-pointer bg-background hover:shadow-xl group"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Service card for ${service.name}`}
    >
      <CardContent className="flex flex-col items-center p-6 space-y-4 text-center">
        {/* Icon with Animation */}
        <div className="relative p-4 transition-all duration-300 rounded-full bg-primary/10 group-hover:bg-primary/20">
          <MedicalIcon
            iconName={service.icon}
            size={48}
            variant="primary"
            className="transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-semibold transition-colors duration-300 text-foreground group-hover:text-primary">
            {service.name}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {service.description}
          </p>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge
            variant={service.is_active ? "success" : "secondary"}
            className={`text-xs font-medium transition-opacity duration-300 group-hover:opacity-100 ${
              service.is_active ? 'bg-green-500/10 text-green-600' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {service.is_active ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-1" />
                Coming Soon
              </>
            )}
          </Badge>
        </div>

        {/* Action Link as Button */}
        {service.is_active ? (
          <Link
            to={`/doctors/speciality/${service.id}`}
            className="inline-flex items-center justify-center w-full h-10 px-4 py-2 mt-4 text-sm font-medium transition-all duration-300 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 group-hover:scale-105"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
            }}
          >
            Voir les Docteurs
          </Link>
        ) : (
          <div className="inline-flex items-center justify-center w-full h-10 px-4 py-2 mt-4 text-sm font-medium text-gray-500 bg-gray-300 rounded-md cursor-not-allowed">
            Bientôt Disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
};