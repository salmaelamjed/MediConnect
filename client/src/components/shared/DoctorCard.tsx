import type { Doctor } from "@/types/doctor";
import { Card, CardContent } from "../ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

interface DoctorCardProps {
  doctor: Doctor;
  onReserve: () => void;
  specialty?: string;
  rating?: number;
  address?: string;
}

function DoctorCard({ doctor, onReserve, specialty,  address = "456 Oak Street New York, NY 10001" }: DoctorCardProps) {
 

  return (
    <Card className="max-w-md overflow-hidden bg-white border-0 shadow-sm hover:shadow-md">
      <CardContent className="p-4">
        {/* Doctor Info Section */}
        <div className="flex gap-4 mb-4">
          {/* Doctor Image */}
          <div className="flex-shrink-0">
            <img 
              src="https://i.pinimg.com/736x/f6/2a/0b/f62a0b5e0552976f2b8144f7f4a0a24d.jpg" 
              alt={doctor.name}
              className="object-cover w-40 h-40 rounded-xl"
            />
          </div>

          {/* Doctor Details */}
          <div className="flex-1 min-w-0">
            {/* Name and Rating */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                Dr. {doctor.name}
              </h3>
            </div>

            {/* Specialty */}
            <p className="mb-2 text-sm text-gray-500 capitalize">
              {specialty || "Medical Specialist"}
            </p>

            {/* Address */}
            <div className="flex items-start gap-1 mb-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-gray-600">
                {address}
              </p>
            </div>
            {doctor.consultation_fees && (
          <div className="pb-4 mb-4 border-b border-gray-100">
            <span className="text-sm text-gray-600">Consultation Fee: </span>
            <span className="text-sm font-semibold text-gray-900">
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
            className="flex-1 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg h-11 hover:bg-blue-700"
          >
            Book Appointment
          </Button>
          
          <Button
            variant="outline"
            className="px-4 text-gray-600 border-gray-200 rounded-lg h-11 hover:bg-gray-50"
          >
            Doctor Profile
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DoctorCard;