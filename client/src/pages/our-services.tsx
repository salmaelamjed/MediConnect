import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ServiceCard } from "@/components/shared/ServiceCard";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { actGetAllActive } from "@/store/specialities/act/actGetAllActive";
import { Loading } from "@/routes/AppRouter";

interface ISpeciality {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export const OurServices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const { records: medicalServices, loading, error } = useAppSelector((state) => state.specialities);

  // Fetch services on component mount
  useEffect(() => {
    dispatch(actGetAllActive());
  }, [dispatch]);

  // Filter services based on search
  const filteredServices = medicalServices.filter((service: ISpeciality) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

 


  return (
    <section className="px-4 py-8 bg-background">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Our Medical Services
          </h1>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search
              className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
              size={20}
            />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-10 text-base"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading === "pending" && (
          <div className="py-12 text-center">
            <Loading/>
            <p className="mt-4 text-lg text-muted-foreground">Loading services...</p>
          </div>
        )}

        {/* Error State */}
        {loading === "failed" && (
          <div className="py-12 text-center">
            <p className="text-lg text-destructive">{error || "Failed to load services."}</p>
          </div>
        )}

        {/* Services Grid */}
        {loading === "succeeded" && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service: ISpeciality) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {loading === "succeeded" && filteredServices.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No services found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default OurServices;