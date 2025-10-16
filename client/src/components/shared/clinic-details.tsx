"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { MapPin, X, Clock, DollarSign, Calendar, Navigation } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MedicalIcon } from "@/components/ui/medical-icon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useParams } from "react-router-dom";
import { actGetCabinetDetails } from "@/store/cabinets/act/actGetCabinetDetails";
import { clearSelectedCabinet } from "@/store/cabinets/cabinetsSlice";
import { Loading } from "@/routes/AppRouter";

const ClinicDetails = () => {
  const dispatch = useAppDispatch();
  const { selectedCabinet, loading, error } = useAppSelector((state) => state.cabinets);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const cabinetId = id ? Number(id) : Number.NaN;

  useEffect(() => {
    dispatch(actGetCabinetDetails(cabinetId));
    return () => {
      dispatch(clearSelectedCabinet());
    };
  }, [dispatch, cabinetId]);

  const closeSlider = () => {
    setIsSliderOpen(false);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSlider();
    }
  };

  if (loading === "pending") {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <Loading />
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

  const latitude = Number(selectedCabinet.latitude);
  const longitude = Number(selectedCabinet.longitude);
  const isValidLatLng = !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

  return (
    <div className="w-full min-h-screen">
      <div className="w-full px-2 py-4 mx-auto ">
        {/* Image Gallery Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 h-96">
            {/* Main large image */}
            <div className="relative">
              <img
                src={selectedCabinet.image || "/placeholder.svg"}
                alt={selectedCabinet.name}
                className="object-cover w-full rounded-lg cursor-pointer h-96"
                onClick={() => setIsSliderOpen(true)}
              />
            </div>

            {/* Side images */}
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {selectedCabinet.detail_images?.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${selectedCabinet.name} view ${index + 1}`}
                    className="object-cover w-full rounded-lg cursor-pointer h-44"
                    onClick={() => setIsSliderOpen(true)}
                  />
                  {index === 3 && selectedCabinet.detail_images.length > 4 && (
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
          <div className="flex flex-col mb-6 lg:flex-row lg:items-start lg:justify-between">
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

          {/* Location Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Location</h3>
              {isValidLatLng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCabinet.latitude},${selectedCabinet.longitude}`}
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
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <iframe
                  src={`https://www.google.com/maps?q=${selectedCabinet.latitude},${selectedCabinet.longitude}&hl=en&z=15&output=embed`}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing location of ${selectedCabinet.name}`}
                />
              </div>
            ) : (
              <p className="text-gray-600">Location data not available.</p>
            )}
            <div className="flex items-start gap-2 p-3 mt-3 border border-gray-200 rounded-lg bg-gray-50">
              <MapPin className="flex-shrink-0 mt-0.5 text-blue-600" size={18} />
              <div className="text-sm text-gray-700">
                <p className="font-medium">{selectedCabinet.name}</p>
                <p>
                  {selectedCabinet.address}, {selectedCabinet.city}, {selectedCabinet.postal_code}
                </p>
              </div>
            </div>
          </div>

          {/* Specialities Section */}
          <div className="mb-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Specialities</h3>
            {selectedCabinet.specialities?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selectedCabinet.specialities.map((speciality, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 transition-all duration-200 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 transition-colors rounded-lg bg-blue-50 group-hover:bg-blue-100">
                      <MedicalIcon name={speciality.icon} className="text-blue-500" size={20} />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
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
          <div className="mb-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Our Doctors</h3>
            {selectedCabinet.doctors?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedCabinet.doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="p-4 transition-all duration-200 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <img
                        src={doctor.doctor_profile_image || "/placeholder-doctor.jpg"}
                        alt={doctor.name}
                        className="object-cover w-16 h-16 rounded-full"
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{doctor.name}</h4>
                        {doctor.speciality && (
                          <p className="text-sm text-gray-600">{doctor.speciality.name}</p>
                        )}
                      </div>
                    </div>
                    <p className="mb-3 text-sm text-gray-700 line-clamp-3">
                      {doctor.bio || "No bio available."}
                    </p>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                      {doctor.consultation_fees && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-500" />
                          <span>Consultation: ${doctor.consultation_fees}</span>
                        </div>
                      )}
                      {(doctor.start_time || doctor.end_time) && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-green-500" />
                          <span>
                            Hours: {doctor.start_time || "N/A"} - {doctor.end_time || "N/A"}
                          </span>
                        </div>
                      )}
                      {doctor.available_days && doctor.available_days.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-green-500" />
                          <span>Available: {doctor.available_days.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No doctors available.</p>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default ClinicDetails;