"use client";
import { Search, MapPin, Copy, Clock, LucideMapPinned, Calendar as Calendar1, CheckCircle2, User, Stethoscope, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { actSearch } from "@/store/cabinets/act/actSearch";
import { actGetAvailableSlots, actCreateReservation } from "@/store/reservations/reservationsSlice";
import type { Cabinet } from "@/types/cabinet";
import { debounce } from "lodash";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { Marker as LeafletMarker, type LatLngExpression } from "leaflet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import DoctorCard from "@/components/shared/DoctorCard";

// Fix for Leaflet default marker icons
interface IconDefault extends L.Icon {
  _getIconUrl?: () => string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green icon for hover state
const greenIcon = new L.Icon({
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});



// Copy Confirmation Modal
interface CopyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coordinates: string;
}

export interface Doctor {
  id: number;
  user_id?: number;
  cabinet_id?: number;
  name: string;
  license_number: string;
  bio: string;
  consultation_fees: string;
  start_time: string;
  end_time: string;
  available_days: string[];
  is_active: boolean;
  speciality: {
    id: number;
    name: string;
    icon: string;
  };
}

function CopyConfirmationModal({ isOpen, onClose, onConfirm, coordinates }: CopyConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <p className="mb-4 text-gray-700">
          The following coordinates are ready to be copied: <span className="font-mono">{coordinates}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} aria-label="Cancel copying coordinates">
            Cancel
          </Button>
          <Button
            className="text-white bg-primary hover:bg-primary/90"
            onClick={onConfirm}
            aria-label="Confirm copying coordinates"
          >
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Map Bounds Component
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

// Distance calculation
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

  return distance >= 1 ? `${distance.toFixed(1)} km` : `${(distance * 1000).toFixed(0)} m`;
};

// Reservation Summary Modal
interface ReservationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formData: FormData) => void;
  selectedDoctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  formData: { firstName: string; lastName: string; reason: string };
  selectedCabinet: Cabinet | null;
}

function ReservationSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDoctor,
  selectedDate,
  selectedTime,
  formData,
  selectedCabinet,
}: ReservationSummaryModalProps) {
  if (!isOpen || !selectedDoctor || !selectedDate || !selectedTime || !selectedCabinet) return null;

  const handleConfirm = () => {
    const reservationData = new FormData();
    reservationData.append("reservation_date", format(selectedDate, "yyyy-MM-dd"));
    reservationData.append("reservation_time", selectedTime);
    reservationData.append("cabinet_id", selectedCabinet.id.toString());
    reservationData.append("doctor_id", selectedDoctor.id.toString());
    reservationData.append("first_name", formData.firstName);
    reservationData.append("last_name", formData.lastName);
    reservationData.append("reason", formData.reason);
    onConfirm(reservationData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-blue-800">
            <CheckCircle2 className="w-5 h-5" />
            Reservation Summary
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3 bg-white border rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium">{selectedDoctor.name}</span>
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{format(selectedDate, "PPP")}</span>
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">{selectedTime}</span>
            <span className="text-gray-600">Patient:</span>
            <span className="font-medium">{formData.firstName} {formData.lastName}</span>
            <span className="text-gray-600">Reason:</span>
            <span className="font-medium">{formData.reason || "Not specified"}</span>
            <span className="text-gray-600">Price:</span>
            <span className="font-semibold text-green-600">{selectedDoctor.consultation_fees} MAD</span>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              Confirm Reservation
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Expanded Cabinet Details
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
  const dispatch = useAppDispatch();
  const { availableSlots, slotsLoading, slotsError } = useAppSelector((state) => state.reservations);

  useEffect(() => {
    if (step === 2 && selectedDoctor && selectedDate) {
      dispatch(
        actGetAvailableSlots({
          date: format(selectedDate, "yyyy-MM-dd"),
          cabinet_id: cabinet.id,
          doctor_id: selectedDoctor.id,
        })
      );
    }
  }, [step, selectedDoctor, selectedDate, cabinet.id, dispatch]);

  if (!isExpanded) return null;

  return (
    <div className="transition-all duration-300 animate-in slide-in-from-top-2">
      <Card className="h-[430px] border-none">
        <CardContent className="flex flex-col justify-between h-full p-6">
          <div>
            {step === 0 && (
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Available Doctors
              </h3>
            )}
            {step === 1 && selectedDoctor && (
              <p className="mb-1 text-base text-gray-600">Select a date for {selectedDoctor.name}</p>
            )}
            {step === 2 && selectedDate && selectedDoctor && (
              <p className="mb-1 text-base text-gray-600">Select a time for {format(selectedDate, "PPP")}</p>
            )}
            {step === 3 && selectedTime && selectedDate && selectedDoctor && (
              <p className="mb-1 text-base text-gray-600">Fill in patient details</p>
            )}
          </div>
          <div className="flex items-center justify-center flex-1 overflow-y-auto">
            {step === 0 && (
              <div className="flex w-full space-x-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(cabinet.doctors || []).map((doctor: Doctor) => (
                  <div key={doctor.id} className="snap-start">
                    <DoctorCard
                      doctor={doctor}
                      specialty={doctor.speciality?.name || cabinet.specialities?.find((s: { name: string }) => s.name)?.name || "N/A"}
                      onReserve={() => onReserveDoctor(doctor)}
                    />
                  </div>
                ))}
              </div>
            )}
            {step === 1 && selectedDoctor && (
              <div className="w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => date && onDateSelect(date)}
                  className="border rounded-md shadow-sm"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            )}
{step === 2 && selectedDate && selectedDoctor && (
  <div className="w-full max-w-lg">
    {slotsLoading === "pending" ? (
      <div className="flex items-center justify-center w-full py-8">
        <div className="w-5 h-5 mr-3 border-2 border-gray-300 rounded-full border-t-blue-600 animate-spin" />
        <span className="text-gray-600">Loading available slots...</span>
      </div>
    ) : slotsError ? (
      <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-600">{slotsError}</p>
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {/* Generate time slots based on doctor's working hours */}
        {(() => {
          const timeSlots = [];
          
          // Parse doctor's working hours
          const parseTime = (timeString: string): { hour: number; minute: number } | null => {
            if (!timeString) return null;
            
            // Handle different time formats (HH:MM, HH:MM:SS, etc.)
            const timeParts = timeString.split(':');
            if (timeParts.length < 2) return null;
            
            const hour = parseInt(timeParts[0], 10);
            const minute = parseInt(timeParts[1], 10);
            
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
              return null;
            }
            
            return { hour, minute };
          };

          const startTime = parseTime(selectedDoctor.start_time);
          const endTime = parseTime(selectedDoctor.end_time);
          
          // Fallback to default hours if parsing fails
          const defaultStart = { hour: 8, minute: 0 };
          const defaultEnd = { hour: 18, minute: 0 };
          
          const workingStart = startTime || defaultStart;
          const workingEnd = endTime || defaultEnd;
          
          // Generate time slots in 30-minute intervals
          let currentHour = workingStart.hour;
          let currentMinute = workingStart.minute;
          
          while (
            currentHour < workingEnd.hour || 
            (currentHour === workingEnd.hour && currentMinute < workingEnd.minute)
          ) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const isAvailable = availableSlots.includes(timeString);
            const isSelected = selectedTime === timeString;
            
            timeSlots.push(
              <button
                key={timeString}
                onClick={() => isAvailable ? onTimeSelect(timeString) : null}
                disabled={!isAvailable}
                className={`
                  relative px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                  ${isSelected 
                    ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm' 
                    : isAvailable 
                      ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300 cursor-pointer' 
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }
                  ${isAvailable && !isSelected ? 'hover:shadow-sm' : ''}
                `}
                title={
                  isSelected 
                    ? 'Currently selected time' 
                    : isAvailable 
                      ? 'Click to select this time slot' 
                      : 'This time slot is not available'
                }
              >
                <span className="block">{timeString}</span>
                {isSelected && (
                  <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -top-1 -right-1"></div>
                )}
                {!isAvailable && !isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-full transform rotate-45 bg-gray-400 opacity-30"></div>
                  </div>
                )}
              </button>
            );
            
            // Increment by 30 minutes
            currentMinute += 30;
            if (currentMinute >= 60) {
              currentHour += 1;
              currentMinute = 0;
            }
          }
          
          return timeSlots;
        })()}
      </div>
    )}
    {availableSlots.length === 0 && slotsLoading !== "pending" && !slotsError && (
      <div className="p-6 text-center border border-yellow-200 rounded-lg bg-yellow-50">
        <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
        <p className="mb-1 text-sm font-medium text-yellow-800">No Available Slots</p>
        <p className="text-xs text-yellow-700">
          Please try selecting a different date or check back later.
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Doctor's working hours: {selectedDoctor.start_time} - {selectedDoctor.end_time}
        </p>
      </div>
    )}
  </div>
)}
            {step === 3 && selectedTime && selectedDate && selectedDoctor && (
              <div className="relative w-full max-w-md space-y-3">
                <div className="relative">
                  <User className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    type="text"
                    placeholder="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onFormChange}
                    className="pl-10 text-sm transition-all duration-200 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onFormChange}
                    className="pl-10 text-sm transition-all duration-200 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={onFormChange}
                    placeholder="Reason for visit"
                    className="pl-10 text-sm transition-all duration-200 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
          {(step === 1 || step === 2 || step === 3) && (
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={onPrev} className="px-4 py-2">
                Previous
              </Button>
              <Button
                onClick={onNext}
                className="px-4 py-2 text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={
                  (step === 1 && !selectedDate) ||
                  (step === 2 && !selectedTime) ||
                  (step === 3 && (!formData.firstName || !formData.lastName))
                }
              >
                Next
                <Clock className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SearchResults() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearchTerm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredCabinetId, setHoveredCabinetId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedCabinetId, setExpandedCabinetId] = useState<string | null>(null);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", reason: "" });
  const [step, setStep] = useState<number>(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: LeafletMarker }>({});
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchResults, loading } = useAppSelector((state) => state.cabinets);

  // Debounced search function for suggestions
  const debouncedSearch = useCallback(
    (term: string) => {
      if (term.trim() && term.length >= 2) {
        dispatch(actSearch(term))
          .unwrap()
          .then((result) => {
            setShowSuggestions(true);
            console.log(result);
          })
          .catch((error) => {
            toast.error("Failed to fetch suggestions.");
            console.log(error);
          });
      } else {
        dispatch({ type: "cabinets/clearSearchResults" });
        setShowSuggestions(false);
      }
    },
    [dispatch]
  );

  const debouncedSearchHandler = useMemo(() => debounce(debouncedSearch, 300), [debouncedSearch]);

  // Trigger search for results on appliedSearchTerm change
  useEffect(() => {
    if (appliedSearchTerm && appliedSearchTerm.length >= 2) {
      dispatch(actSearch(appliedSearchTerm))
        .unwrap()
        .then((result) => {
          console.log("Search results fetched:", result);
        })
        .catch((error) => {
          toast.error("Failed to fetch search results.");
          console.log(error);
        });
    } else {
      dispatch({ type: "cabinets/clearSearchResults" });
    }
    return () => debouncedSearchHandler.cancel();
  }, [appliedSearchTerm, dispatch, debouncedSearchHandler]);

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      debouncedSearchHandler(searchTerm);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, debouncedSearchHandler]);

  // Handle initial load from URL
  useEffect(() => {
    if (initialSearchTerm && initialSearchTerm.length >= 2) {
      setSearchTerm(initialSearchTerm);
      setAppliedSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  // Handle click outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          setUserLocation({ lat: 33.5731, lng: -7.5898 }); // Fallback to Casablanca
          toast.info("Unable to retrieve your position. Using Casablanca as default.");
          console.log(error);
        }
      );
    } else {
      setUserLocation({ lat: 33.5731, lng: -7.5898 });
      toast.info("Geolocation not supported. Using Casablanca as default.");
    }
  }, []);

  // Update map when hovered
  useEffect(() => {
    if (hoveredCabinetId && markerRefs.current[hoveredCabinetId]) {
      markerRefs.current[hoveredCabinetId].openPopup();
    }
  }, [hoveredCabinetId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) setShowSuggestions(true);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setAppliedSearchTerm(searchTerm);
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (cabinet: Cabinet) => {
    const term = cabinet.name || "";
    setSearchTerm(term);
    setAppliedSearchTerm(term);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const mapCenter = useMemo((): [number, number] => {
    const validCabinets = searchResults.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );
    if (validCabinets.length === 0) return [33.5731, -7.5898]; // Default to Casablanca
    const avgLat = validCabinets.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / validCabinets.length;
    const avgLng = validCabinets.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / validCabinets.length;
    return [avgLat, avgLng];
  }, [searchResults]);

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
    navigator.clipboard
      .writeText(selectedCoordinates)
      .then(() => {
        toast.success("Location copied successfully", { duration: 1000, position: "bottom-right" });
        setIsModalOpen(false);
      })
      .catch(() => {
        toast.error("Error copying coordinates.");
        setIsModalOpen(false);
      });
  };

  const handleExpand = (cabinet: Cabinet) => {
    const cabinetId = String(cabinet.id);
    if (expandedCabinetId === cabinetId) {
      setExpandedCabinetId(null);
      setSelectedCabinet(null);
    } else {
      setExpandedCabinetId(cabinetId);
      setSelectedCabinet(cabinet);
    }
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ firstName: "", lastName: "", reason: "" });
    setStep(0);
  };

  const handleReserveNow = (doctor: Doctor, cabinet: Cabinet) => {
    if (doctor.cabinet_id && doctor.cabinet_id !== cabinet.id) {
      toast.error("Doctor is not associated with this cabinet.");
      return;
    }
    setSelectedDoctor(doctor);
    setStep(1);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setIsSummaryModalOpen(true);
  };

  const handlePrev = () => {
    if (step === 1) {
      setSelectedDoctor(null);
      setStep(0);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmReservation = async (reservationData: FormData) => {
    try {
      await dispatch(actCreateReservation(reservationData)).unwrap();
      toast.success("Reservation confirmed successfully!", { position: "bottom-right" });
      setIsSummaryModalOpen(false);
      setExpandedCabinetId(null);
      setSelectedCabinet(null);
      setStep(0);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setFormData({ firstName: "", lastName: "", reason: "" });
    } catch (error) {
      toast.error(`Failed to confirm reservation: ${error}`, { position: "bottom-right" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <CopyConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCopyLocation}
        coordinates={selectedCoordinates}
      />
      <ReservationSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onConfirm={handleConfirmReservation}
        selectedDoctor={selectedDoctor}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        formData={formData}
        selectedCabinet={selectedCabinet}
      />
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
              <Button
                size="lg"
                className="h-12 px-8 font-semibold text-white bg-secondary hover:bg-secondary/90"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
            {showSuggestions && searchTerm.length >= 2 && (
              <div
                className="absolute left-0 z-20 w-full mt-1 overflow-y-auto border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm"
                style={{ maxHeight: "240px" }}
              >
                {loading === "pending" ? (
                  <div className="flex items-center gap-2 p-3 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-gray-600 animate-spin" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((suggestion) => (
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
                  ))
                ) : (
                  <div className="p-3 text-gray-500">No suggestions found for "{searchTerm}"</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {loading === "pending" ? (
              <div className="text-center">
                <p>Loading...</p>
              </div>
            ) : searchResults.length === 0 && loading === "succeeded" ? (
              <div className="py-8 text-center text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="mb-2 text-xl">No results found</p>
                <p>Try modifying your search terms</p>
              </div>
            ) : (
              searchResults.map((cabinet) => {
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
                          alt={`${cabinet.name || "Clinic"} image`}
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
                            <span>
                              <LucideMapPinned className="inline-block w-4 h-4 ml-4 text-red-500" />
                              {distance}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">Contact:</span>
                              <p className="inline-block">{cabinet.email}</p>
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
                              <Calendar1 className="w-4 h-4" />
                              <span>Dynamic slots available</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Check availability</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-4">
                            <Button
                              variant="outline"
                              className="px-4 py-2 text-blue-600 transition-colors border-blue-600 hover:bg-blue-50"
                              onClick={() => handleExpand(cabinet)}
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
                      onToggleExpand={() => handleExpand(cabinet)}
                      onReserveDoctor={(doctor) => handleReserveNow(doctor, cabinet)}
                      step={step}
                      selectedDoctor={selectedDoctor}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      formData={formData}
                      onDateSelect={handleDateSelect}
                      onTimeSelect={handleTimeSelect}
                      onFormChange={handleFormChange}
                      onNext={handleNext}
                      onPrev={handlePrev}
                    />
                  </Card>
                );
              })
            )}
          </div>
          <div className="h-screen lg:h-[calc(100vh-200px)] sticky top-20">
            {loading === "pending" ? (
              <div className="flex items-center justify-center h-full border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Loading map...</p>
                </div>
              </div>
            ) : searchResults.length > 0 && loading === "succeeded" ? (
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
                <MapBounds cabinets={searchResults} />
                {searchResults
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