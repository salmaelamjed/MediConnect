"use client"

import { useEffect, useState } from "react"
import { Phone, Mail, Globe, MapPin, Home } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel" // Adjust the import path based on your shadcn setup
import { X } from "lucide-react" // For the close button
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useParams } from "react-router-dom"
import { actGetCabinetDetails } from "@/store/cabinets/act/actGetCabinetDetails"
import { clearSelectedCabinet } from "@/store/cabinets/cabinetsSlice"

const ClinicDetails = () => {
    const dispatch = useAppDispatch();
  const { selectedCabinet, loading, error } = useAppSelector((state) => state.cabinets);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const { id } = useParams<{ id: string }>(); 
  const cabinetId = id ? Number(id) : NaN; 


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
        <p className="text-gray-600">Loading...</p>
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
    <div className="w-full min-h-screen ">
      <div className="w-full px-2 py-4 mx-auto">
        {/* Image Gallery Section */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 h-96">
            {/* Main large image (full height, half width) */}
            <div className="relative col-span-1">
              <img
                src={selectedCabinet.image || "/placeholder.svg"}
                alt={selectedCabinet.name}
                className="object-cover w-full rounded-lg cursor-pointer h-96"
                onClick={() => setIsSliderOpen(true)}
              />
            </div>

            {/* Side images (2x2 grid, half width) */}
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {selectedCabinet.detail_images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${selectedCabinet.name} view ${index + 1}`}
                    className="object-cover w-full rounded-lg cursor-pointer h-44"
                    onClick={() => setIsSliderOpen(true)}
                  />
                  {index === 3 && (
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
              <div className="flex items-center gap-2 mb-2">
                <Home className="text-gray-600" size={20} />
                <span className="text-sm text-gray-600">Medical Cabinet</span>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{selectedCabinet.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-gray-500" size={16} />
                <span className="text-gray-600">
                  {selectedCabinet.address}, {selectedCabinet.city}, {selectedCabinet.postal_code}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6 lg:mt-0">
              <button className="p-3 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50">
                <Phone size={20} className="text-gray-600" />
              </button>
              <button
                className="p-3 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => selectedCabinet.email && (window.location.href = `mailto:${selectedCabinet.email}`)}
              >
                <Mail size={20} className="text-gray-600" />
              </button>
              <button className="p-3 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50">
                <Globe size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
          <div className="mb-6">
            <p className="leading-relaxed text-gray-700">{selectedCabinet.description || "No description available."}</p>
          </div>
          <div className="mb-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Specialities</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {selectedCabinet.specialities.length > 0 ? (
                selectedCabinet.specialities.map((speciality, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{speciality.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No specialities available.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Doctors</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {selectedCabinet.doctors.length > 0 ? (
                selectedCabinet.doctors.map((doctor, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {doctor.name} {doctor.speciality ? `(${doctor.speciality.name})` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No doctors available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Full-Screen Slider */}
        {isSliderOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={handleBackgroundClick}
          >
            <div className="relative w-full h-full max-w-4xl">
              {/* Close button - Always visible on top */}
              <button
                className="absolute top-4 right-4 z-[60] bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
                onClick={closeSlider}
                aria-label="Close gallery"
              >
                <X size={24} />
              </button>
              
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {/* Include main image as first item */}
                  <CarouselItem>
                    <div className="flex items-center justify-center w-full h-full px-4">
                      <img
                        src={selectedCabinet.image || "/placeholder.svg"}
                        alt={`${selectedCabinet.name} main view`}
                        className="object-cover w-full h-full max-h-[100vh] rounded-2xl"
                      />
                    </div>
                  </CarouselItem>
                  
                  {/* Gallery images */}
                  {selectedCabinet.detail_images.map((image, index) => (
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
                
                {/* Navigation arrows with better visibility */}
                <CarouselPrevious className="absolute left-4 z-[55] bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" />
                <CarouselNext className="absolute right-4 z-[55] bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" />
              </Carousel>
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[55] bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {selectedCabinet.detail_images.length + 1} images
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDetails;