"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { MapPin, X, Clock, DollarSign, Calendar, Navigation, CheckCircle2, User, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MedicalIcon } from "@/components/ui/medical-icon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { actGetCabinetDetails } from "@/store/cabinets/act/actGetCabinetDetails";
import { clearSelectedCabinet } from "@/store/cabinets/cabinetsSlice";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actGetAvailableSlots, actCreateReservation } from "@/store/reservations/reservationsSlice";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Loader from "../ui/Loader";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Doctor {
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
  profile_image?: string;
  speciality: {
    id: number;
    name: string;
    icon: string;
    description?: string;
    is_active?: boolean;
  } | null;
}

interface Clinic {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  image?: string;
  specialities?: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
  latitude?: string;
  longitude?: string;
}

interface Cabinet {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  detail_images: string[] | null;
  address: string;
  city: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  email?: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  specialities: {
    id: number;
    name: string;
    icon: string;
    description?: string;
    is_active?: boolean;
  }[];
  doctors: Doctor[];
  nearby_clinics: Clinic[];
}

const ClinicDetails = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selectedCabinet, loading, error } = useAppSelector((state) => state.cabinets);
  const { availableSlots, slotsLoading, slotsError } = useAppSelector((state) => state.reservations);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const cabinetId = id ? Number(id) : Number.NaN;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const latitude = Number(selectedCabinet?.latitude);
  const longitude = Number(selectedCabinet?.longitude);
  const isValidLatLng = !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

  useEffect(() => {
    dispatch(actGetCabinetDetails(cabinetId));
    return () => {
      dispatch(clearSelectedCabinet());
    };
  }, [dispatch, cabinetId]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      const dayOfWeek = format(selectedDate, "EEEE", { locale: fr }).toLowerCase();
      if (!selectedDoctor.available_days.includes(dayOfWeek)) {
        dispatch({ type: "reservations/resetAvailableSlots" });
        toast.error("Selected date is not available for this doctor.", { position: "bottom-right" });
        return;
      }
      dispatch(
        actGetAvailableSlots({
          cabinet_id: cabinetId,
          doctor_id: selectedDoctor.id,
          date: format(selectedDate, "yyyy-MM-dd"),
        })
      ).catch((error) => {
        toast.error(`Failed to load available slots: ${error}`, { position: "bottom-right" });
      });
    } else {
      dispatch({ type: "reservations/resetAvailableSlots" });
    }
  }, [selectedDate, selectedDoctor, cabinetId, dispatch]);

  useEffect(() => {
    if (mapRef.current && selectedCabinet && isValidLatLng) {
      const latitude = Number(selectedCabinet.latitude);
      const longitude = Number(selectedCabinet.longitude);

      // Initialize Leaflet map
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);

      // Add marker
      L.marker([latitude, longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(selectedCabinet.name)
        .openPopup();

      // Cleanup on unmount
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [selectedCabinet, isValidLatLng]);

 

 

  const closeSlider = () => {
    setIsSliderOpen(false);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSlider();
    }
  };

  const handleBookDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsSheetOpen(true);
    setSelectedDate(null);
    setSelectedSlot(null);
    setFirstName("");
    setLastName("");
    setReason("");
  };

  const handleConfirmBooking = async () => {
    if (selectedDoctor && selectedDate && selectedSlot && firstName && lastName) {
      const reservationData = new FormData();
      reservationData.append("reservation_date", format(selectedDate, "yyyy-MM-dd"));
      reservationData.append("reservation_time", selectedSlot);
      reservationData.append("doctor_id", selectedDoctor.id.toString());
      reservationData.append("cabinet_id", cabinetId.toString());
      reservationData.append("first_name", firstName);
      reservationData.append("last_name", lastName);
      reservationData.append("reason", reason || "Not specified");

      try {
        await dispatch(actCreateReservation(reservationData)).unwrap();
        setIsModalOpen(false);
        setIsSheetOpen(false);
        toast.success("Reservation confirmed successfully!", { position: "bottom-right" });
        navigate(`/cabinets/${cabinetId}`);
      } catch (error) {
        toast.error(`Failed to confirm reservation: ${error}`, { position: "bottom-right" });
      }
    }
  };

  const handleViewClinic = (clinicId: number) => {
    navigate(`/cabinets/${clinicId}`);
  };

  if (loading === "pending") {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <Loader className="text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!selectedCabinet) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <p className="text-gray-600">No cabinet found</p>
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen">
      <div className="w-full px-2 py-4 mx-auto">
        {/* Image Gallery Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 h-96">
            <div className="relative">
              <img
                src={selectedCabinet.image || "/placeholder.svg"}
                alt={selectedCabinet.name}
                className="object-cover w-full rounded-lg cursor-pointer h-96"
                onClick={() => setIsSliderOpen(true)}
              />
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {selectedCabinet.detail_images?.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${selectedCabinet.name} view ${index + 1}`}
                    className="object-cover w-full rounded-lg cursor-pointer h-44"
                    onClick={() => setIsSliderOpen(true)}
                  />
                  {index === 3 && selectedCabinet.detail_images && selectedCabinet.detail_images.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 h-44">
                      <button
                        className="font-medium text-white transition-colors hover:text-gray-200"
                        onClick={() => setIsSliderOpen(true)}
                      >
                        Show All
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex-col justify-between mb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{selectedCabinet.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-gray-500" size={16} />
                <span className="text-gray-600">
                  {selectedCabinet.address}, {selectedCabinet.city}, {selectedCabinet.postal_code}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="leading-relaxed text-gray-700">
              {selectedCabinet.description || "No description available."}
            </p>
          </div>

         

          {/* Specialities Section */}
          <div className="mb-12">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Specialities</h3>
            {selectedCabinet.specialities?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-12">
                {selectedCabinet.specialities.map((speciality, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200 border border-blue-300 rounded-lg hover:shadow-sm group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg bg-blue-50 group-hover:bg-blue-100">
                      <MedicalIcon name={speciality.icon} className="text-blue-500" size={20} />
                    </div>
                    <span className="font-medium text-center text-gray-700 group-hover:text-blue-600">
                      {speciality.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No specialities available.</p>
            )}
          </div>

          {/* Doctors Section */}
          <div className="mb-12">
            <h6 className="mb-4 text-xl font-bold text-gray-900">Our Doctors</h6>
            {selectedCabinet.doctors?.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {selectedCabinet.doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="p-6 transition-all duration-300 bg-white border border-gray-200 shadow-sm group rounded-xl hover:shadow-lg hover:border-green-200"
                  >
                    {/* Doctor Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <img
                          src={doctor.profile_image || "/placeholder-doctor.jpg"}
                          alt={doctor.name}
                          className="object-cover w-16 h-16 border-2 border-green-200 rounded-full"
                        />
                        {doctor.is_active && (
                          <div className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full -bottom-1 -right-1"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">{doctor.name}</h4>
                        {doctor.speciality && (
                          <p className="text-sm text-gray-600 truncate">{doctor.speciality.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Doctor Bio */}
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-3">
                      {doctor.bio || "No bio available."}
                    </p>

                    {/* Doctor Details */}
                    <div className="mb-6 space-y-3">
                      {doctor.consultation_fees && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Consultation: {doctor.consultation_fees} MAD
                          </span>
                        </div>
                      )}
                      {(doctor.start_time || doctor.end_time) && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          <span className="text-sm text-gray-600">
                            From <span className="font-bold">{doctor.start_time || "N/A"}</span> To{" "}
                            <span className="font-bold">{doctor.end_time || "N/A"}</span>
                          </span>
                        </div>
                      )}
                      {doctor.available_days && doctor.available_days.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Calendar size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            Available: {doctor.available_days.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Book Appointment Button */}
                    <Button
                      onClick={() => handleBookDoctor(doctor)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
                    >
                      Book Appointment
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No doctors available at this time.</p>
                <p className="mt-2 text-sm text-gray-400">Please check back later for updates.</p>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h6 className="text-xl font-bold text-gray-900">Where you'll be</h6>
              {isValidLatLng && (
                <a
                  href={`https://www.openstreetmap.org/directions?to=${selectedCabinet.latitude},${selectedCabinet.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Navigation size={16} />
                  Get Directions
                </a>
              )}
            </div>
            {isValidLatLng ? (
              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <div
                  ref={mapRef}
                  className="w-full h-[300px] rounded-lg"
                  title={`Map showing location of ${selectedCabinet.name}`}
                ></div>
              </div>
            ) : (
              <p className="text-gray-600">Location data not available.</p>
            )}
          </div>

          {/* Nearby Clinics Section - Design amélioré */}
          <div className="mb-12">
            <h6 className="mb-6 text-xl font-bold text-gray-900">Clinics nearby</h6>
            {selectedCabinet.nearby_clinics?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-5">
                {selectedCabinet.nearby_clinics.map((clinic: Clinic, index: number) => (
                  <div
                    key={index}
                    className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-lg hover:border-blue-300 group"
                  >
                    {/* Clinic Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={clinic.image || "/placeholder-clinic.jpg"}
                        alt={clinic.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Clinic Content */}
                    <div className="p-5">
                      {/* Clinic Header */}
                      <div className="mb-4">
                        <h4 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700">
                          {clinic.name}
                        </h4>
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600 line-clamp-1">
                            {clinic.address}, {clinic.city}
                          </span>
                        </div>
                      </div>

                      {/* Specialities */}
                      {clinic.specialities && clinic.specialities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {clinic.specialities.slice(0, 3).map((spec, specIndex) => (
                              <span
                                key={specIndex}
                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                              >
                                {spec.name}
                              </span>
                            ))}
                            {clinic.specialities.length > 3 && (
                              <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                +{clinic.specialities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Distance Info (exemple) */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Navigation size={14} />
                          <span>~1.2 km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-700">4.8</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewClinic(clinic.id)}
                          className="flex-1 py-2 font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Voir la clinique
                        </Button>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-xl">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Aucune clinique à proximité</p>
                <p className="mt-2 text-sm text-gray-400">
                  Il n'y a pas d'autres cliniques dans les environs immédiats.
                </p>
              </div>
            )}
          </div>

          {/* Full-Screen Slider */}
          {isSliderOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              onClick={handleBackgroundClick}
            >
              <div className="relative w-full h-full max-w-4xl">
                <button
                  className="absolute top-4 right-4 z-[60] bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
                  onClick={closeSlider}
                  aria-label="Close gallery"
                >
                  <X size={24} />
                </button>
                <Carousel className="w-full h-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="flex items-center justify-center w-full h-full px-4">
                        <img
                          src={selectedCabinet.image || "/placeholder.svg"}
                          alt={`${selectedCabinet.name} main view`}
                          className="object-cover w-full h-full max-h-[100vh] rounded-2xl"
                        />
                      </div>
                    </CarouselItem>
                    {selectedCabinet.detail_images?.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="flex items-center justify-center w-full h-full px-4">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`${selectedCabinet.name} gallery ${index + 1}`}
                            className="object-cover w-full h-full max-h-[100vh] rounded-2xl"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-4 z-[55] bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" />
                  <CarouselNext className="absolute right-4 z-[55] bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" />
                </Carousel>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[55] bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  {(selectedCabinet.detail_images?.length || 0) + 1} images
                </div>
              </div>
            </div>
          )}

          {/* Booking Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="overflow-y-auto max-h-[100vh] p-4">
              <SheetHeader>
                <SheetTitle>Book Appointment with {selectedDoctor?.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ShadcnCalendar
                  mode="single"
                  className="w-full max-w-xl bg-white border rounded-lg shadow-sm"
                  selected={selectedDate ?? undefined}
                  onSelect={(date) => setSelectedDate(date ?? null)}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    (selectedDoctor
                      ? !selectedDoctor.available_days.includes(
                          format(date, "EEEE", { locale: fr }).toLowerCase()
                        )
                      : true)
                  }
                />
              </div>
              {selectedDate && (
                <div className="mt-4">
                  <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold">
                    <Clock className="w-5 h-5 text-primary" />
                    Available Times
                  </h3>
                  {slotsLoading === "pending" ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 mr-3 border-2 border-gray-300 rounded-full border-t-primary animate-spin" />
                      <span className="text-gray-600">Loading available times...</span>
                    </div>
                  ) : slotsError ? (
                    <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50">
                      <p className="text-sm text-red-600">{slotsError}</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              relative px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-blue-100 border-blue-300 text-blue-800 shadow-sm"
                                  : "bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300 cursor-pointer"
                              }
                              ${!isSelected ? "hover:shadow-sm" : ""}
                            `}
                            title={
                              isSelected
                                ? "Currently selected time"
                                : "Click to select this time slot"
                            }
                          >
                            <span className="block">{slot}</span>
                            {isSelected && (
                              <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -top-1 -right-1"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-yellow-200 rounded-lg bg-yellow-50">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <p className="mb-1 text-sm font-medium text-yellow-800">No Available Slots</p>
                      <p className="text-xs text-yellow-700">
                        Please try selecting a different date or check back later.
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Doctor's working hours: {selectedDoctor?.start_time} - {selectedDoctor?.end_time}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 space-y-4">
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
                <Textarea
                  placeholder="Reason for appointment (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
                <Button
                  disabled={!selectedDate || !selectedSlot || !firstName || !lastName}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Confirmation Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-blue-800">
                  <CheckCircle2 className="w-5 h-5" />
                  Reservation Summary
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-3 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">{selectedDoctor?.name}</span>
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "N/A"}</span>
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedSlot || "N/A"}</span>
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{firstName} {lastName}</span>
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-medium">{reason || "Not specified"}</span>
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-green-600">{selectedDoctor?.consultation_fees} MAD</span>
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    className="text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Confirm Reservation
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetails;