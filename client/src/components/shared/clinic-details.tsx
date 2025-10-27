"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { MapPin, X, Clock, Calendar, Navigation, CheckCircle2, User, Star, Award } from "lucide-react";
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
  available_days: string[] | string | null | undefined;
  is_active: boolean;
  profile_image?: string;
  doctor_profile_image?: string;
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

const SectionTitle = ({  children }: {  children: React.ReactNode }) => (
  <div className="flex flex-col items-center mb-8">
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
      </div>
      <h2 className="text-3xl font-bold text-foreground">{children}</h2>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
      </div>
    </div>
    <div className="w-24 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"></div>
  </div>
);

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
      if (!Array.isArray(selectedDoctor.available_days) || !selectedDoctor.available_days.includes(dayOfWeek)) {
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

      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);

      L.marker([latitude, longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(selectedCabinet.name)
        .openPopup();

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
      <div className="flex items-center justify-center w-full min-h-screen bg-background">
        <Loader className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!selectedCabinet) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background">
        <p className="text-muted-foreground">No cabinet found</p>
      </div>
    );
  }

  // Fonction pour convertir le temps en format local


  return (
    <div className="w-full min-h-screen ">
      <div className="w-full px-4 py-8 mx-auto ">
        {/* Image Gallery Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 h-96">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={selectedCabinet.image || "/placeholder.svg"}
                alt={selectedCabinet.name}
                className="object-cover w-full transition-transform duration-500 cursor-pointer h-96 hover:scale-105"
                onClick={() => setIsSliderOpen(true)}
              />
              <div className="absolute inset-0 transition-opacity bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100"></div>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {selectedCabinet.detail_images?.slice(0, 4).map((image, index) => (
                <div key={index} className="relative overflow-hidden rounded-xl">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${selectedCabinet.name} view ${index + 1}`}
                    className="object-cover w-full transition-transform duration-500 cursor-pointer h-44 hover:scale-105"
                    onClick={() => setIsSliderOpen(true)}
                  />
                  {index === 3 && selectedCabinet.detail_images && selectedCabinet.detail_images.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm h-44">
                      <button
                        className="px-6 py-3 font-semibold text-white transition-all duration-300 border-2 border-white rounded-full hover:bg-white hover:text-primary"
                        onClick={() => setIsSliderOpen(true)}
                      >
                        +{selectedCabinet.detail_images.length - 4} More
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-foreground">{selectedCabinet.name}</h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg">
                {selectedCabinet.address}, {selectedCabinet.city}, {selectedCabinet.postal_code}
              </span>
            </div>
          </div>

          <div className="pb-8 mb-12 border-b border-border">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {selectedCabinet.description || "No description available."}
            </p>
          </div>

          {/* Specialities Section */}
          <div className="mb-16">
            <SectionTitle >Our Specialities</SectionTitle>
            {selectedCabinet.specialities?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {selectedCabinet.specialities.map((speciality, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-3 p-5  border cursor-pointer  rounded-2xl border-border bg-card hover:shadow-sm hover:border-primary/50 "
                  >
                    <div className="flex items-center justify-center w-16 h-16  rounded-2xl bg-primary/10 ">
                      <MedicalIcon name={speciality.icon} className="text-primary" size={28} />
                    </div>
                    <span className="font-semibold text-center transition-colors text-foreground group-hover:text-primary">
                      {speciality.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No specialities available.</p>
            )}
          </div>

          {/* Doctors Section */}
          <div className="mb-16">
            <SectionTitle >Meet Our Doctors</SectionTitle>
            {selectedCabinet.doctors?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {selectedCabinet.doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden bg-gradient-to-br from-white to-primary/5 border border-border shadow-md group rounded-3xl hover:shadow-xl hover:border-primary/30 "
                    style={{ boxShadow: "var(--shadow-doctor)" }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-500 rounded-full opacity-10 bg-gradient-to-br from-primary to-accent -mr-16 -mt-16 group-hover:scale-150"></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 overflow-hidden border-4 rounded-2xl border-primary/20">
                            <img
                              src={doctor.profile_image || doctor.doctor_profile_image || "/placeholder-doctor.jpg"}
                              alt={doctor.name}
                              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          {doctor.is_active && (
                            <div className="absolute flex items-center justify-center w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-lg -bottom-1 -right-1">
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="mb-1 text-xl font-bold text-foreground">{doctor.name}</h4>
                          {doctor.speciality && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10">
                              <Award size={14} className="text-primary" />
                              <span className="text-sm font-medium text-primary">{doctor.speciality.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {doctor.bio || "Experienced healthcare professional dedicated to patient care."}
                      </p>

                      <div className="p-4 mb-5 space-y-3 border rounded-2xl bg-background/50 border-border/50">
                        {doctor.consultation_fees && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              
                              <span className="text-sm font-medium text-muted-foreground">Consultation</span>
                            </div>
                            <span className="text-lg font-bold text-black">{doctor.consultation_fees} MAD</span>
                          </div>
                        )}
                        {(doctor.start_time || doctor.end_time) && (
  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
    <Clock size={16} className="text-primary" />
    <span className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">
        {doctor.start_time  }
      </span>{" "}
      à{" "}
      <span className="font-semibold text-foreground">
        {doctor.end_time }
      </span>
    </span>
  </div>
)}
                        {doctor.available_days != null && (
                          <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                            <Calendar size={16} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
                                    return doctor.available_days.join(", ");
                                  } else if (typeof doctor.available_days === "string") {
                                    const parsedDays = JSON.parse(doctor.available_days);
                                    return Array.isArray(parsedDays) && parsedDays.length > 0 ? parsedDays.join(", ") : "Available";
                                  }
                                  return "Available";
                                } catch (e) {
                                  return "Available";
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleBookDoctor(doctor)}
                        className="w-full h-12 text-base font-semibold transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center rounded-3xl bg-muted/30">
                <User className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">No doctors available at this time.</p>
                <p className="mt-2 text-sm text-muted-foreground/70">Please check back later for updates.</p>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="mb-16">
            <SectionTitle >Location</SectionTitle>             
            {isValidLatLng ? (
              <div className="overflow-hidden  rounded-3xl">
                <div
                  ref={mapRef}
                  className="w-full h-[400px]"
                  title={`Map showing location of ${selectedCabinet.name}`}
                ></div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Location data not available.</p>
            )}
          </div>

          {/* Nearby Clinics Section */}
          <div className="mb-8">
            <SectionTitle >Nearby Clinics</SectionTitle>
            {selectedCabinet.nearby_clinics?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {selectedCabinet.nearby_clinics.map((clinic: Clinic, index: number) => (
                  <div
                    key={index}
                    className="overflow-hidden  shadow-md group rounded-3xl border-border hover:shadow-sm hover:border-primary/30 2"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={clinic.image || "/placeholder-clinic.jpg"}
                        alt={clinic.name}
                        className="object-cover w-full h-full "
                      />
                      <div className="absolute inset-0 transition-opacity bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-90"></div>
                      <div className="absolute flex items-center gap-2 px-4 py-2 shadow-lg bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="font-bold text-foreground">4.8</span>
                        <span className="text-sm text-muted-foreground">(120+)</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="mb-3 text-xl font-bold transition-colors text-foreground line-clamp-1 group-hover:text-primary">
                        {clinic.name}
                      </h4>
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin size={16} className="mt-1 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {clinic.address}, {clinic.city}
                        </span>
                      </div>
                      {clinic.specialities && clinic.specialities.length > 0 && (
                        <div className="mb-5">
                          <div className="flex flex-wrap gap-2">
                            {clinic.specialities.slice(0, 3).map((spec, specIndex) => (
                              <span
                                key={specIndex}
                                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                              >
                                {spec.name}
                              </span>
                            ))}
                            {clinic.specialities.length > 3 && (
                              <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                                +{clinic.specialities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
                          <Navigation size={14} className="text-accent" />
                          <span className="text-sm font-semibold text-accent">~1.2 km</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewClinic(clinic.id)}
                        className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl "
                      >
                        View Clinic
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center rounded-3xl bg-muted/30">
                <MapPin className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">No nearby clinics</p>
                <p className="mt-2 text-sm text-muted-foreground/70">
                  There are no other clinics in the immediate vicinity.
                </p>
              </div>
            )}
          </div>

          {/* Full-Screen Slider */}
          {isSliderOpen && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
              onClick={handleBackgroundClick}
            >
              <div className="relative w-full h-full max-w-6xl">
                <button
                  className="absolute top-6 right-6 z-[10000] bg-white/10 backdrop-blur-md rounded-2xl p-3 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:rotate-90"
                  onClick={closeSlider}
                  aria-label="Close gallery"
                >
                  <X size={28} />
                </button>
                <Carousel className="w-full h-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="flex items-center justify-center w-full h-full px-4">
                        <img
                          src={selectedCabinet.image || "/placeholder.svg"}
                          alt={`${selectedCabinet.name} main view`}
                          className="object-contain w-full h-full max-h-[90vh] rounded-3xl shadow-2xl"
                        />
                      </div>
                    </CarouselItem>
                    {selectedCabinet.detail_images?.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="flex items-center justify-center w-full h-full px-4">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`${selectedCabinet.name} gallery ${index + 1}`}
                            className="object-contain w-full h-full max-h-[90vh] rounded-3xl shadow-2xl"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-6 z-[9999] bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 w-14 h-14 rounded-2xl" />
                  <CarouselNext className="absolute right-6 z-[9999] bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 w-14 h-14 rounded-2xl" />
                </Carousel>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-base font-medium">
                  {(selectedCabinet.detail_images?.length || 0) + 1} images
                </div>
              </div>
            </div>
          )}

          {/* Booking Sheet - Fixed z-index */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="overflow-y-auto max-h-[100vh] p-6 z-[10000]">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold">Book with {selectedDoctor?.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ShadcnCalendar
                  mode="single"
                  className="w-full max-w-xl p-4 bg-white border shadow-sm rounded-2xl"
                  selected={selectedDate ?? undefined}
                  onSelect={(date) => setSelectedDate(date ?? null)}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    (selectedDoctor && Array.isArray(selectedDoctor.available_days)
                      ? !selectedDoctor.available_days.includes(
                          format(date, "EEEE", { locale: fr }).toLowerCase()
                        )
                      : true)
                  }
                />
              </div>
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                    <Clock className="w-5 h-5 text-primary" />
                    Available Times
                  </h3>
                  {slotsLoading === "pending" ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 mr-3 border-4 border-muted rounded-full border-t-primary animate-spin" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : slotsError ? (
                    <div className="p-4 text-center border rounded-2xl border-destructive/20 bg-destructive/10">
                      <p className="text-sm text-destructive">{slotsError}</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              relative px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all duration-300
                              ${
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105"
                                  : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent hover:scale-105"
                              }
                            `}
                          >
                            {slot}
                            {isSelected && (
                              <CheckCircle2 className="absolute w-4 h-4 -top-1 -right-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center border rounded-2xl border-border bg-muted/30">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="mb-2 font-medium text-muted-foreground">No slots available</p>
                      <p className="text-xs text-muted-foreground/70">Try another date</p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 space-y-4">
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
                <Textarea
                  placeholder="Reason for appointment (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-xl"
                  rows={4}
                />
                <Button
                  disabled={!selectedDate || !selectedSlot || !firstName || !lastName}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full h-14 text-base font-semibold transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[480px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  Confirm Reservation
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4 border shadow-sm rounded-2xl bg-gradient-to-br from-background to-primary/5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block mb-1 text-xs font-medium text-muted-foreground">Doctor</span>
                    <span className="font-semibold text-foreground">{selectedDoctor?.name}</span>
                  </div>
                  <div>
                    <span className="block mb-1 text-xs font-medium text-muted-foreground">Date</span>
                    <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "N/A"}</span>
                  </div>
                  <div>
                    <span className="block mb-1 text-xs font-medium text-muted-foreground">Time</span>
                    <span className="font-semibold text-foreground">{selectedSlot || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block mb-1 text-xs font-medium text-muted-foreground">Patient</span>
                    <span className="font-semibold text-foreground">{firstName} {lastName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block mb-1 text-xs font-medium text-muted-foreground">Reason</span>
                    <span className="font-semibold text-foreground">{reason || "Not specified"}</span>
                  </div>
                  <div className="col-span-2 pt-4 mt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-muted-foreground">Consultation Fee</span>
                      <span className="text-2xl font-bold text-accent">{selectedDoctor?.consultation_fees} MAD</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 font-semibold rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    className="flex-1 h-12 font-semibold transition-all duration-300 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl hover:scale-105"
                  >
                    Confirm
                    <CheckCircle2 className="w-5 h-5 ml-2" />
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