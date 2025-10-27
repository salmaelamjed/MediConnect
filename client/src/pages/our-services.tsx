"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { actGetAllActive } from "@/store/specialities/act/actGetAllActive";
import { SpecialtyCard } from "@/components/shared/specialty-card";
import { Search } from "lucide-react";

export default function OurServices() {
  const dispatch = useAppDispatch();
  const { records: specialties, loading } = useAppSelector(
    (state) => state.specialities
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(actGetAllActive());
  }, [dispatch]);

  // Filter specialties based on search term
  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialty.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between gap-2 mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Medical Specialties
        </h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a specialty..."
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search for a medical specialty"
          />
        </div>
      </div>

      {loading === "pending" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {filteredSpecialties.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">
                No specialties found matching "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSpecialties.map((specialty) => (
                <SpecialtyCard
                  key={specialty.id}
                  id={specialty.id}
                  name={specialty.name}
                  description={specialty.description}
                  icon={specialty.icon}
                  onClick={(id) => console.log(`Specialty ${id} clicked`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}