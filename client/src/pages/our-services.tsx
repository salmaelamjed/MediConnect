"use client";

import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { actGetAllActive } from "@/store/specialities/act/actGetAllActive";
import { SpecialtyCard } from "@/components/shared/specialty-card";
import { Combobox } from "@/components/ui/combobox";

export default function OurServices() {
  const dispatch = useAppDispatch();
  const { records: specialties, loading } = useAppSelector(
    (state) => state.specialities
  );
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<number>();

  useEffect(() => {
    dispatch(actGetAllActive());
  }, [dispatch]);

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Medical Specialties
        </h1>
        <div className="max-w-md">
          <Combobox
            value={selectedSpecialty}
            onValueChange={(_, id) => setSelectedSpecialty(id)}
            placeholder="Search for a specialty..."
          />
        </div>
      </div>

      {loading === "pending" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specialties.map((specialty) => (
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
    </div>
  );
}