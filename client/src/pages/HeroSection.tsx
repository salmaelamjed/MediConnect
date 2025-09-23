"use client"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { actGetAllCabinetsActive } from "@/store/cabinets/act/actGetAllCabinetsActive";
import type { Cabinet } from "@/types/cabinet";




export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Cabinet[]>([]);
  const navigate = useNavigate();
  const{cabinets,loading}=useAppSelector((state)=>state.cabinets)
  const dispatch = useAppDispatch()

useEffect(() => {
  dispatch(actGetAllCabinetsActive());
}, [dispatch]);

useEffect(() => {
  if (loading) return;
  if (searchTerm) {
    const filtered = cabinets.filter((cabinet) =>
      (cabinet.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
      (cabinet.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false)
    );
    setSuggestions(filtered);
  } else {
    setSuggestions([]);
  }
}, [searchTerm, cabinets, loading]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (cabinet: Cabinet) => {
    setSearchTerm(cabinet.name);
    setSuggestions([]);
    navigate(`/cabinets/${cabinet.id}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch();
    }
  };

 
  


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative min-h-[700px] overflow-hidden bg-center bg-cover rounded-md sm:py-12 md:py-16 lg:py-20"
        style={{
          backgroundImage: `url(https://i.pinimg.com/1200x/b5/1f/bd/b51fbd69a0123bae39b94cf7f12a4f2e.jpg)`,
          backgroundPosition: 'right',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 opacity-50 bg-black/75"></div>

        {/* Main Content */}
        <div className="container relative z-10 flex flex-col items-center justify-center max-h-[500px] px-8 py-20 mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-14">
            {/* Main Heading */}
            <div className="space-y-8">
              <h1 className="text-5xl font-bold text-white md:text-6xl lg:text-7xl text-balance">
                Inspiring healthier{" "}
                <span className="inline-block px-4 py-2 rounded-lg bg-white/20">
                  Tomorrows, Today!
                </span>
              </h1>
            </div>

            {/* Search Bar with Suggestions */}
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="flex flex-col gap-3 p-2 border bg-white/10 sm:flex-row backdrop-blur-sm rounded-xl border-white/20">
                <div className="relative flex-1">
                  <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-4 top-1/2 text-white/70" />
                  <Input
                    type="text"
                    placeholder="Search for medical clinic, doctors, services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 pl-12 text-3xl font-medium text-white bg-white/20 border-white/30 placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Search medical services, clinics, or doctors"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-12 px-8 font-semibold text-white text-md bg-secondary hover:bg-secondary/90"
                  onClick={handleSearch}
                >
                  Rechercher
                </Button>
              </div>

              {/* Suggestions Dropdown (YouTube-style) with Scroll */}
            {suggestions.length > 0 && (
              <div
                className="absolute left-0 z-20 w-full mt-1 overflow-y-auto border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm"
                style={{ maxHeight: '240px' }}
              >
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-3 p-3 text-lg cursor-pointer hover:bg-gray-100 text-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSuggestionClick(suggestion)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${suggestion.name}`}
                  >
                    {/* Image with fixed size */}
                    <img
                      src={suggestion.image}
                      alt={`${suggestion.name} image`}
                      className="object-cover w-12 h-12 rounded-md"
                    />
                    {/* Text container for title and address */}
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-foreground">{suggestion.name}</span>
                      <span className="text-sm text-emerald-500">{suggestion.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </section>

     
    </div>
  )
}