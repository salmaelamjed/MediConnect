import type { Doctor } from "@/types/doctor";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface DoctorCardProps {
  doctor: Doctor;
  onReserve: () => void;
  specialty?: string;
  rating?: number;
  address?: string;
  isSelected?: boolean;
}

function DoctorCard({ doctor, onReserve, specialty, address = "456 Oak Street New York, NY 10001", isSelected = false }: DoctorCardProps) {
  return (
    <Card className={`max-w-md overflow-hidden transition-all duration-300 ${
      isSelected 
        ? 'border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
        : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
    }`}>
      <CardContent className="p-5">
        {/* Doctor Info Section */}
        <div className="flex gap-4 mb-5">
          {/* Doctor Image */}
          <div className="relative flex-shrink-0">
            <img 
              src="https://i.pinimg.com/736x/f6/2a/0b/f62a0b5e0552976f2b8144f7f4a0a24d.jpg" 
              alt={doctor.name}
              className={`object-cover w-40 h-40 rounded-xl transition-all duration-300 ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            />
            {isSelected && (
              <div className="absolute flex items-center justify-center w-6 h-6 text-white rounded-full -top-2 -right-2 bg-primary">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Doctor Details */}
          <div className="flex-1 min-w-0">
            {/* Name and Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`text-xl font-bold truncate transition-colors ${
                isSelected ? 'text-primary' : 'text-gray-900'
              }`}>
                Dr. {doctor.name}
              </h3>
              {isSelected && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  Selected
                </span>
              )}
            </div>

            {/* Specialty */}
            <p className="mb-3 text-sm font-medium text-gray-600 capitalize">
              {specialty || "Medical Specialist"}
            </p>

            {/* Address */}
            <div className="flex items-start gap-1.5 mb-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                {address}
              </p>
            </div>

            {/* Consultation Fee */}
            {doctor.consultation_fees && (
              <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isSelected ? 'bg-primary/10' : 'bg-gray-50'
              }`}>
                <span className="text-xs text-gray-600">Fee:</span>
                <span className={`text-sm font-bold ${
                  isSelected ? 'text-primary' : 'text-gray-900'
                }`}>
                  ${doctor.consultation_fees}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onReserve}
            className={`flex-1 font-medium transition-all duration-200 rounded-lg h-11 ${
              isSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isSelected ? 'Selected' : 'Book Appointment'}
          </Button>
          
          <Button
            variant="outline"
            className="px-4 text-gray-600 border-gray-200 rounded-lg h-11 hover:bg-gray-50 hover:border-gray-300"
          >
            Profile
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DoctorCard;