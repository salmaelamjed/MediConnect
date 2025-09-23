"use client";
import { Search, MapPin, Copy, Calendar, Clock3, LucideMapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { actGetAllCabinetsActive } from "@/store/cabinets/act/actGetAllCabinetsActive";
import type { Cabinet } from "@/types/cabinet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { Marker as LeafletMarker, type LatLngExpression } from "leaflet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Stethoscope, DollarSign, Mail, UserPlus, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define a type for Leaflet Icon prototype to avoid `any`
interface IconDefaultPrototype {
  _getIconUrl?: () => string;
}

// Fix for Leaflet default marker icons with proper typing
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green icon for hover state with proper typing
const greenIcon = new L.Icon({
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Modal component for copy confirmation with typed props
interface CopyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coordinates: string;
}

function CopyConfirmationModal({ isOpen, onClose, onConfirm, coordinates }: CopyConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg outline-none"
      >
        <p className="mb-4 text-gray-700">
          The following coordinates are ready to be copied:{" "}
          <span className="font-mono">{coordinates}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
            aria-label="Cancel copying coordinates"
          >
            Cancel
          </Button>
          <Button
            className="px-4 py-2 text-white bg-primary hover:bg-primary/90"
            onClick={onConfirm}
            aria-label="Confirm copying coordinates"
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component to handle map bounds with typed props
interface MapBoundsProps {
  cabinets: Cabinet[];
}

function MapBounds({ cabinets }: MapBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!cabinets.length) return;

    const validCabinets = cabinets.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );

    if (validCabinets.length === 0) return;

    if (validCabinets.length === 1) {
      const { latitude, longitude } = validCabinets[0];
      map.setView([parseFloat(latitude), parseFloat(longitude)], 15);
    } else {
      const bounds = L.latLngBounds(
        validCabinets.map((c) => [parseFloat(c.latitude), parseFloat(c.longitude)] as LatLngExpression)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [cabinets, map]);

  return null;
}

// Helper function to calculate distance using the Haversine formula
const getDistance = (cabinet: Cabinet, userLocation: { lat: number; lng: number } | null): string => {
  if (
    !userLocation ||
    !cabinet.latitude ||
    !cabinet.longitude ||
    isNaN(parseFloat(cabinet.latitude)) ||
    isNaN(parseFloat(cabinet.longitude))
  ) {
    return "Distance not available";
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = parseFloat(cabinet.latitude);
  const lon1 = parseFloat(cabinet.longitude);
  const lat2 = userLocation.lat;
  const lon2 = userLocation.lng;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance >= 1) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${(distance * 1000).toFixed(0)} m`;
  }
};

// Improved Doctor Card Component
interface DoctorCardProps {
  doctor: Doctor; // Adjust based on Doctor type
  onReserve: () => void;
  specialty?: string;
}

function DoctorCard({ doctor, onReserve, specialty }: DoctorCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 border-gray-200 hover:shadow-md hover:border-blue-200">
      <CardHeader className="p-4 pb-2 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="https://i.pinimg.com/736x/83/16/d3/8316d3dbd46ded94493d4ea796325b8a.jpg" alt={doctor.name} />
            <AvatarFallback className="w-12 h-12 text-blue-600 bg-blue-100">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold leading-tight text-gray-900">{doctor.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm text-gray-600">
              <Stethoscope className="w-4 h-4 text-primary" />
              {specialty || "Specialty not specified"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Consultation fee</span>
            <div className="flex items-center gap-1 font-semibold text-green-600">
              {doctor.consultation_fees} MAD
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Availability</span>
            <span className="px-2 text-xs text-white bg-orange-500 rounded-full">5 slots</span>
          </div>
        </div>
        <Button
          onClick={onReserve}
          className="w-full text-white transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Book now
        </Button>
      </CardContent>
    </Card>
  );
}

// Improved Expanded Cabinet Details Section
interface ExpandedCabinetDetailsProps {
  cabinet: Cabinet;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReserveDoctor: (doctor: Doctor) => void;
  step: number;
  selectedDoctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  formData: { firstName: string; lastName: string; reason: string };
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function ExpandedCabinetDetails({
  cabinet,
  isExpanded,
  onToggleExpand,
  onReserveDoctor,
  step,
  selectedDoctor,
  selectedDate,
  selectedTime,
  formData,
  onDateSelect,
  onTimeSelect,
  onFormChange,
  onNext,
  onPrev,
}: ExpandedCabinetDetailsProps) {
  if (!isExpanded) return null;

  return (
    <div className="mt-6 space-y-6 duration-300 animate-in slide-in-from-top-2">

      {/* Doctors Section */}
      {step === 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Available Doctors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(cabinet.doctors || []).map((doctor: Doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  specialty={cabinet.specialities?.find((s: { name: string }) => s.name)?.name || "N/A"}
                  onReserve={() => onReserveDoctor(doctor)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reservation Steps */}
      {step > 0 && (
        <Card className="border-2 border-blue-200 shadow-sm bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-800">
              <CalendarDays className="w-5 h-5" />
              Step {step}/4: Reservation Process
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {step === 1 && selectedDoctor && (
              <>
                <p className="text-sm text-gray-600">Select a date for {selectedDoctor.name}</p>
                <Input
                  type="date"
                  onChange={(e) => onDateSelect(new Date(e.target.value))}
                  className="w-full max-w-md"
                />
              </>
            )}
            {step === 2 && selectedDate && selectedDoctor && (
              <>
                <p className="text-sm text-gray-600">Select a time for {selectedDate.toLocaleDateString()}</p>
                <div className="grid max-w-md grid-cols-3 gap-2">
                  {["09:00", "10:00", "14:00", "15:00", "16:00"].map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => onTimeSelect(time)}
                      className="w-full"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && selectedTime && selectedDate && selectedDoctor && (
              <>
                <p className="text-sm text-gray-600">Fill in patient details</p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onFormChange}
                    placeholder="First Name"
                  />
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onFormChange}
                    placeholder="Last Name"
                  />
                  <Input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={onFormChange}
                    placeholder="Reason for visit"
                  />
                </div>
              </>
            )}
            {step === 4 && selectedTime && selectedDate && selectedDoctor && (
              <div className="p-4 space-y-3 bg-white border rounded-lg">
                <h4 className="font-semibold text-blue-800">Reservation Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">{selectedDoctor.name}</span>
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-green-600">{selectedDoctor.consultation_fees} MAD</span>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={onPrev}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <Button
                onClick={onNext}
                className="px-4 py-2 text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {step < 4 ? "Next" : "Confirm Reservation"}
                {step < 4 ? <Clock className="w-4 h-4 ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchResults() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearchTerm = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [suggestions, setSuggestions] = useState<Cabinet[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCabinets, setFilteredCabinets] = useState<Cabinet[]>([]);
  const [hoveredCabinetId, setHoveredCabinetId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedCabinetId, setExpandedCabinetId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null); // Adjust type based on Doctor structure
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", reason: "" });
  const [step, setStep] = useState<number>(0);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: LeafletMarker }>({});

  const navigate = useNavigate();
  const { cabinets, loading } = useAppSelector((state) => state.cabinets);
  const dispatch = useAppDispatch();

  // Fetch cabinets and user location
  useEffect(() => {
    dispatch(actGetAllCabinetsActive());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocation({ lat: 33.5731, lng: -7.5898 }); // Fallback to Casablanca
          toast.info("Unable to retrieve your position. Using Casablanca as default position.");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 33.5731, lng: -7.5898 });
      toast.info("Geolocation not supported. Using Casablanca as default position.");
    }
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute unique specialties
  const uniqueSpecialties = useMemo(() => {
    const specialtiesSet = new Set<string>();
    cabinets.forEach((cabinet) => {
      (cabinet.specialities || []).forEach((s: { name: string }) => {
        if (s.name) specialtiesSet.add(s.name);
      });
    });
    return Array.from(specialtiesSet);
  }, [cabinets]);

  useEffect(() => {
    if (loading) return;

    const lowerSearch = searchTerm.toLowerCase().trim();
    let filtered = cabinets;
    if (lowerSearch) {
      filtered = filtered.filter((cabinet) =>
        [
          cabinet.name?.toLowerCase(),
          cabinet.description?.toLowerCase(),
          cabinet.address?.toLowerCase(),
          ...(cabinet.specialities || []).map((s: { name: string }) => s.name.toLowerCase()),
        ].some((field) => field?.includes(lowerSearch))
      );
    }

    if (selectedSpecialty !== "all") {
      filtered = filtered.filter((cabinet) =>
        cabinet.specialities?.some((s: { name: string }) => s.name === selectedSpecialty)
      );
    }

    if (showSuggestions && lowerSearch.length > 0) {
      setSuggestions(filtered.slice(0, 5));
    }

    if (initialSearchTerm || selectedSpecialty !== "all") {
      setFilteredCabinets(filtered);
    }
  }, [searchTerm, cabinets, loading, showSuggestions, initialSearchTerm, selectedSpecialty]);

  useEffect(() => {
    if (hoveredCabinetId && markerRefs.current[hoveredCabinetId]) {
      markerRefs.current[hoveredCabinetId].openPopup();
    }
  }, [hoveredCabinetId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (cabinet: Cabinet) => {
    setSearchTerm(cabinet.name || "");
    setShowSuggestions(false);
    setFilteredCabinets([cabinet]);
    navigate(`/search?q=${encodeURIComponent(cabinet.name || "")}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const mapCenter = useMemo((): [number, number] => {
    const validCabinets = filteredCabinets.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );
    if (validCabinets.length === 0) {
      return [33.5731, -7.5898]; // Default to Casablanca
    }
    const avgLat = validCabinets.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / validCabinets.length;
    const avgLng = validCabinets.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / validCabinets.length;
    return [avgLat, avgLng];
  }, [filteredCabinets]);

  const formatCoordinates = (lat?: string, lng?: string): string => {
    if (!lat || !lng) return "Coordinates not available";
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return isNaN(latNum) || isNaN(lngNum) ? "Coordinates not available" : `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  };

  const handleOpenCopyModal = (lat?: string, lng?: string) => {
    const coordinates = formatCoordinates(lat, lng);
    if (coordinates !== "Coordinates not available") {
      setSelectedCoordinates(coordinates);
      setIsModalOpen(true);
    } else {
      toast.error("Invalid coordinates, cannot copy.");
    }
  };

  const handleCopyLocation = () => {
    if (!selectedCoordinates || selectedCoordinates === "Coordinates not available") {
      toast.error("No valid coordinates to copy.");
      setIsModalOpen(false);
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(selectedCoordinates)
        .then(() => {
          toast.success("Location copied successfully", {
            duration: 1000,
            position: "bottom-right",
          });
          setIsModalOpen(false);
        })
        .catch((err) => {
          console.error("Error copying with navigator.clipboard:", err);
          try {
            const textarea = document.createElement("textarea");
            textarea.value = selectedCoordinates;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Location copied successfully", {
              duration: 1000,
              position: "bottom-right",
            });
            setIsModalOpen(false);
          } catch (fallbackErr) {
            console.error("Error copying with execCommand:", fallbackErr);
            toast.error("Error copying coordinates.");
            setIsModalOpen(false);
          }
        });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = selectedCoordinates;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Location copied successfully", {
          duration: 1000,
          position: "bottom-right",
        });
        setIsModalOpen(false);
      } catch (err) {
        console.error("Error copying with execCommand:", err);
        toast.error("Error copying coordinates.");
        setIsModalOpen(false);
      }
    }
  };

  const handleExpand = (cabinetId: string) => {
    setExpandedCabinetId(expandedCabinetId === cabinetId ? null : cabinetId);
    if (expandedCabinetId !== cabinetId) {
      setStep(0); // Reset reservation steps
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setFormData({ firstName: "", lastName: "", reason: "" });
    }
  };

  const handleReserveNow = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(1); // Move to calendar step
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep(2); // Move to scheduling step
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3); // Move to form step
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step === 1) {
      setSelectedDoctor(null);
      setStep(0);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmReservation = () => {
    // Handle final confirmation (e.g., API call)
    toast.success("Reservation confirmed successfully!");
    setExpandedCabinetId(null);
    setStep(0);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ firstName: "", lastName: "", reason: "" });
  };

  return (
    <div className="min-h-screen bg-white">
      <CopyConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCopyLocation}
        coordinates={selectedCoordinates}
      />
      {/* Search Bar Section */}
      <section className="flex justify-end py-8">
        <div className="container px-4 mx-auto">
          <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto">
            <div className="flex flex-col gap-3 p-2 bg-white border border-gray-200 shadow-sm sm:flex-row rounded-xl">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-4 top-1/2" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for medical clinic, doctors, specialties..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyPress={handleKeyPress}
                  className="h-12 pl-12 text-xl font-medium bg-transparent border-none focus:outline-none"
                  aria-label="Search medical services, clinics or specialties"
                />
              </div>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {uniqueSpecialties.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="lg"
                className="h-12 px-8 font-semibold text-white bg-secondary hover:bg-secondary/90"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute left-0 z-20 w-full mt-1 overflow-y-auto border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm"
                style={{ maxHeight: "240px" }}
              >
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-3 p-3 text-lg cursor-pointer hover:bg-gray-100 text-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyPress={(e) => e.key === "Enter" && handleSuggestionClick(suggestion)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${suggestion.name || "Unnamed Clinic"}`}
                  >
                    <img
                      src={suggestion.image || "/placeholder.svg"}
                      alt={`${suggestion.name || "Clinic"} image`}
                      className="object-cover w-12 h-12 rounded-md"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-foreground">
                        {suggestion.name || "Unnamed Clinic"}
                      </span>
                      <span className="text-sm text-emerald-500">{suggestion.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      <section className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Cabinet Cards */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center">
                <p>Loading...</p>
              </div>
            ) : filteredCabinets.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="mb-2 text-xl">No results found</p>
                <p>Try modifying your search terms</p>
              </div>
            ) : (
              filteredCabinets.map((cabinet) => {
                const distance = getDistance(cabinet, userLocation);
                const isExpanded = expandedCabinetId === String(cabinet.id);

                return (
                  <Card
                    key={cabinet.id}
                    className="relative overflow-hidden transition-all duration-300 border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-200"
                    onMouseEnter={() => setHoveredCabinetId(String(cabinet.id))}
                    onMouseLeave={() => setHoveredCabinetId(null)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={cabinet.image || "/placeholder.svg"}
                          alt={cabinet.name || "Clinic"}
                          className="object-cover w-32 h-32 rounded-lg shadow-md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{cabinet.name || "Unnamed Clinic"}</h3>
                            <Badge variant="default" className="text-green-800 bg-green-100 hover:bg-green-200">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span>
                              {cabinet.address || "Address not available"}, {cabinet.postal_code} {cabinet.city}
                            </span> 
                            <span>{"  "}<LucideMapPinned className="inline-block w-4 h-4 ml-4 text-red-500" />
                            {distance}</span>
                          </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600"> 
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">Contact:</span>
                                <p className="inlininline-block">{cabinet.email}</p>
                              </div>
                            </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {(cabinet.specialities || []).map((specialty: { name: string }) => (
                              <span key={specialty.name} className="px-2 py-1 text-sm text-white rounded-full bg-primary">
                                {specialty.name}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1 text-green-600">
                              <Calendar className="w-4 h-4" />
                              <span>5 slots available</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock3 className="w-4 h-4" />
                              <span>Next: 2:30 PM</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-4">
                            <Button
                              variant="outline"
                              className="px-4 py-2 text-blue-600 transition-colors border-blue-600 hover:bg-blue-50"
                              onClick={() => handleExpand(String(cabinet.id))}
                            >
                              {isExpanded ? "Collapse" : "More info"}
                            </Button>
                            <Button
                              className="px-4 py-2 text-white transition-all shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                              onClick={() => navigate(`/cabinets/${cabinet.id}`)}
                            >
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <ExpandedCabinetDetails
                      cabinet={cabinet}
                      isExpanded={isExpanded}
                      onToggleExpand={() => handleExpand(String(cabinet.id))}
                      onReserveDoctor={handleReserveNow}
                      step={step}
                      selectedDoctor={selectedDoctor}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      formData={formData}
                      onDateSelect={handleDateSelect}
                      onTimeSelect={handleTimeSelect}
                      onFormChange={handleFormChange}
                      onNext={step === 4 ? handleConfirmReservation : handleNext}
                      onPrev={handlePrev}
                    />
                  </Card>
                );
              })
            )}
          </div>

          {/* Right: Map */}
          <div className="h-96 lg:h-[calc(100vh-200px)] sticky top-20">
            {filteredCabinets.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="border border-gray-200 rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds cabinets={filteredCabinets} />
                {filteredCabinets
                  .filter(
                    (cabinet): cabinet is Cabinet & { latitude: string; longitude: string } =>
                      cabinet.latitude !== undefined &&
                      cabinet.longitude !== undefined &&
                      !isNaN(parseFloat(cabinet.latitude)) &&
                      !isNaN(parseFloat(cabinet.longitude))
                  )
                  .map((cabinet) => (
                    <Marker
                      key={cabinet.id}
                      position={[parseFloat(cabinet.latitude), parseFloat(cabinet.longitude)]}
                      icon={
                        hoveredCabinetId !== null && hoveredCabinetId === String(cabinet.id)
                          ? greenIcon
                          : new L.Icon.Default()
                      }
                      ref={(ref) => {
                        if (ref) markerRefs.current[cabinet.id] = ref;
                      }}
                    >
                      <Popup>
                        <div className="min-w-48">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{cabinet.name || "Unnamed Clinic"}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => handleOpenCopyModal(cabinet.latitude, cabinet.longitude)}
                              aria-label="Copy clinic coordinates"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </Button>
                          </div>
                          <p className="mb-2 text-sm text-green-500">{cabinet.address}</p>
                          <p className="font-mono text-xs text-gray-600">
                            {formatCoordinates(cabinet.latitude, cabinet.longitude)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>The map will display with results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}