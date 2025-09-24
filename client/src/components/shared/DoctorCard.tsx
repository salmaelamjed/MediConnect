import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Doctor } from "@/types/doctor";
import { Card, CardContent } from "../ui/card";
import {  Clock, Stethoscope, User, UserPlus } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface DoctorCardProps {
  doctor: Doctor;
  onReserve: () => void;
  specialty?: string;
}

function DoctorCard({ doctor, onReserve, specialty }: DoctorCardProps) {
  return (
     <Card className="group overflow-hidden transition-all duration-300 border border-border/50 hover:border-primary/20 hover:shadow-lg w-[320px] flex-shrink-0 bg-card">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="transition-all w-14 h-14 ring-2 ring-primary/10 group-hover:ring-primary/20">
            <AvatarImage
              src="https://i.pinimg.com/736x/83/16/d3/8316d3dbd46ded94493d4ea796325b8a.jpg"
              alt={doctor.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 text-lg font-semibold truncate text-foreground">{doctor.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="flex-shrink-0 w-4 h-4 text-primary" />
              <span className="text-sm truncate text-muted-foreground">{specialty || "General Practice"}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium text-foreground">Consultation Fee</span>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{doctor.consultation_fees} MAD</div>
              <div className="text-xs text-muted-foreground">per session</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Next available</span>
            </div>
            <Badge variant="secondary" className="text-green-700 bg-green-100 hover:bg-green-100">
              Today 2:30 PM
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available slots</span>
            <Badge variant="outline" className="text-orange-700 border-orange-200">
              5 slots today
            </Badge>
          </div>
        </div>

        <Button
          onClick={onReserve}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm hover:shadow-md group-hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </CardContent>
    </Card>
  );
}

export default DoctorCard;