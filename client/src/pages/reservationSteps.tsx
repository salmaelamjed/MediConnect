"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  User,
  Stethoscope,
  Clock,
  ArrowLeft,
  ArrowRight,
  Building,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import DoctorCard from "@/components/shared/DoctorCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { actCreateReservation } from "@/store/reservations/reservationsSlice";
import type { Speciality } from "@/types/speciality";
import type { Cabinet } from "@/types/cabinet";

// Types
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
  speciality: {
    id: number;
    name: string;
    icon: string;
  };
}

interface ReservationStepsProps {
  cabinetId: number;
}

// Step titles
const stepTitles = ["Select Specialty", "Select Doctor", "Date & Time", "Patient Details"];

// Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formData: FormData) => void;
  selectedCabinet: Cabinet | null;
  selectedSpeciality: Speciality | null;
  selectedDoctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  formData: { firstName: string; lastName: string; reason: string };
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCabinet,
  selectedSpeciality,
  selectedDoctor,
  selectedDate,
  selectedTime,
  formData,
}: ConfirmationModalProps) {
  if (!isOpen || !selectedCabinet || !selectedSpeciality || !selectedDoctor || !selectedDate || !selectedTime) return null;

  const handleConfirm = () => {
    const reservationData = new FormData();
    reservationData.append("reservation_date", format(selectedDate, "yyyy-MM-dd"));
    reservationData.append("reservation_time", selectedTime);
    reservationData.append("doctor_id", selectedDoctor.id.toString());
    reservationData.append("cabinet_id", selectedCabinet.id.toString());
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
        <div className="p-4 space-y-3 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Cabinet:</span>
            <span className="font-medium">{selectedCabinet.name}</span>
            <span className="text-gray-600">Specialty:</span>
            <span className="font-medium">{selectedSpeciality.name}</span>
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

export default function ReservationSteps({ cabinetId }: ReservationStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [selectedSpeciality, setSelectedSpeciality] = useState<Speciality | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", reason: "" });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const { searchResults: cabinets } = useAppSelector((state) => state.cabinets);

  // Set selected cabinet based on cabinetId
  useEffect(() => {
    const cabinet = cabinets.find((c) => c.id === cabinetId);
    setSelectedCabinet(cabinet || null);
  }, [cabinetId, cabinets]);

  // Get specialties and doctors for selected cabinet
  const availableSpecialities = selectedCabinet ? selectedCabinet.specialities : [];
  const availableDoctors = selectedSpeciality && selectedCabinet
    ? selectedCabinet.doctors.filter(
        (doctor: Doctor) => doctor.speciality.id === selectedSpeciality.id && doctor.is_active
      )
    : [];

  // Fetch available slots when date and doctor are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate && currentStep === 2) {
      setSlotsLoading(true);
      // Simulate API call for available slots
      setTimeout(() => {
        const startTime = parseInt(selectedDoctor.start_time.split(":")[0]) || 9;
        const endTime = parseInt(selectedDoctor.end_time.split(":")[0]) || 17;
        const slots = [];
        for (let hour = startTime; hour < endTime; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            slots.push(timeString);
          }
        }
        const mockAvailable = slots.filter(() => Math.random() > 0.3); // 70% availability
        setAvailableSlots(mockAvailable);
        setSlotsLoading(false);
      }, 1000);
    }
  }, [selectedDoctor, selectedDate, currentStep]);

  const handleNext = () => {
    if (currentStep < stepTitles.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSpecialitySelect = (speciality: Speciality) => {
    setSelectedSpeciality(speciality);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmReservation = async (reservationData: FormData) => {
    try {
      await dispatch(actCreateReservation(reservationData)).unwrap();
      toast.success("Reservation confirmed successfully!", { position: "bottom-right" });

      // Reset form
      setCurrentStep(0);
      setSelectedSpeciality(null);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setFormData({ firstName: "", lastName: "", reason: "" });
      setIsConfirmModalOpen(false);
    } catch (error) {
      toast.error(`Failed to confirm reservation: ${error}`, { position: "bottom-right" });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedSpeciality !== null;
      case 1:
        return selectedDoctor !== null;
      case 2:
        return selectedDate !== null && selectedTime !== null;
      case 3:
        return formData.firstName && formData.lastName;
      default:
        return false;
    }
  };

  const progress = ((currentStep + 1) / stepTitles.length) * 100;

  // Handle case when no cabinet is found
  if (!selectedCabinet) {
    return (
      <div className="min-h-screen py-4">
        <div className="min-w-full px-4 mx-auto text-center text-gray-500">
          <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No cabinet found with ID {cabinetId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4">
      <div className="min-w-full px-4 mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    index <= currentStep ? "text-primary font-medium" : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content Card */}
        <div className="border-0">
          <div className="p-8">
            {/* Step Content */}
            <div className="min-h-[400px] flex flex-col">
              <div className="flex items-center justify-center flex-1">
                {/* Step 0: Select Specialty */}
                {currentStep === 0 && (
                  <div className="w-full max-w-6xl space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCabinet.name}</h3>
                    {availableSpecialities.length > 0 ? (
                      availableSpecialities.map((speciality) => (
                        <div
                          key={speciality.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 w-full ${
                            selectedSpeciality?.id === speciality.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                          onClick={() => handleSpecialitySelect(speciality)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                selectedSpeciality?.id === speciality.id
                                  ? "border-primary bg-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedSpeciality?.id === speciality.id && (
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="mb-1 font-semibold text-gray-900">{speciality.name}</h3>
                              <p className="text-sm text-gray-600">{speciality.description}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No specialties available for this cabinet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Select Doctor */}
                {currentStep === 1 && (
                  <div className="w-full">
                    {availableDoctors.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {availableDoctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="transition-transform transform hover:scale-105"
                          >
                            <DoctorCard
                              doctor={doctor}
                              specialty={doctor.speciality.name}
                              onReserve={() => handleDoctorSelect(doctor)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No doctors available for this specialty</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Select Date & Time */}
                {currentStep === 2 && selectedDoctor && (
                  <div className="w-full">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                      {/* Calendar */}
                      <div>
                        <Calendar
                          mode="single"
                          numberOfMonths={2}
                          selected={selectedDate || undefined}
                          onSelect={(date) => date && handleDateSelect(date)}
                          className="w-full max-w-3xl mt-4 bg-white border rounded-lg shadow-sm"
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            !selectedDoctor.available_days.includes(format(date, "EEEE"))
                          }
                        />
                      </div>

                      {/* Time Slots */}
                      <div>
                        <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold">
                          <Clock className="w-5 h-5 text-primary" />
                          Available Times
                        </h3>
                        {selectedDate ? (
                          <div className="space-y-4">
                            {slotsLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 mr-3 border-2 border-gray-300 rounded-full border-t-primary animate-spin" />
                                <span className="text-gray-600">Loading available times...</span>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="grid grid-cols-4 gap-4">
                                {availableSlots.map((time) => {
                                  const isSelected = selectedTime === time;
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => handleTimeSelect(time)}
                                      disabled={!availableSlots.includes(time)}
                                      className={`p-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                                          : availableSlots.includes(time)
                                          ? "bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5"
                                          : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-8 text-center text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No available time slots for this date</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Please select a date first</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Patient Details */}
                {currentStep === 3 && (
                  <div className="w-full max-w-lg space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <Input
                          type="text"
                          placeholder="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleFormChange}
                          className="h-12 pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="relative">
                        <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <Input
                          type="text"
                          placeholder="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleFormChange}
                          className="h-12 pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Reason for visit (optional)"
                          name="reason"
                          value={formData.reason}
                          onChange={handleFormChange}
                          className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedCabinet && selectedSpeciality && selectedDoctor && selectedDate && selectedTime && (
                      <div className="p-4 space-y-2 rounded-lg bg-gray-50">
                        <h4 className="mb-3 font-semibold text-gray-900">Appointment Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cabinet:</span>
                            <span className="font-medium">{selectedCabinet.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Specialty:</span>
                            <span className="font-medium">{selectedSpeciality.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Doctor:</span>
                            <span className="font-medium">{selectedDoctor.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{format(selectedDate, "PP")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">{selectedTime}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-600">Fee:</span>
                            <span className="font-semibold text-green-600">{selectedDoctor.consultation_fees} MAD</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {currentStep === stepTitles.length - 1 ? (
                    <>
                      Confirm Booking
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmReservation}
          selectedCabinet={selectedCabinet}
          selectedSpeciality={selectedSpeciality}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          formData={formData}
        />
      </div>
    </div>
  );
}