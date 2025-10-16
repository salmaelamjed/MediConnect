import * as React from "react";
import { cn } from "@/lib/utils";
import { MedicalIcon } from "@/components/ui/medical-icon";

interface SpecialtyCardProps {
  id: number;
  name: string;
  description?: string;
  icon: string;
  onClick?: (id: number) => void;
  className?: string;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
  id,
  name,
  description,
  icon,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center transition-colors h-14 w-14 rounded-xl bg-blue-50 group-hover:bg-blue-100">
          <MedicalIcon
            name={icon}
            className="text-blue-500 transition-transform group-hover:scale-110"
            size={28}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {name}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};