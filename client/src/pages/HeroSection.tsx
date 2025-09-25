"use client";
import { LoaderCircleIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { actSearch } from "@/store/cabinets/act/actSearch";
import type { Cabinet } from "@/types/cabinet";
import { debounce } from "lodash";

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Cabinet[]>([]);
  const navigate = useNavigate();
  const { loading, searchResults } = useAppSelector((state) => state.cabinets);
  const dispatch = useAppDispatch();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim() && term.length >= 2) {
        dispatch(actSearch(term));
      }
    }, 300),
    [dispatch]
  );

  // Update suggestions from Redux store
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setSuggestions(searchResults);
    }
  }, [searchResults]);

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      debouncedSearch(searchTerm);
    } else {
      // Clear suggestions immediately when search term is too short
      setSuggestions([]);
      debouncedSearch.cancel(); // Cancel pending debounced calls
    }

    // Cleanup function to cancel debounced calls on unmount or searchTerm change
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleSearch = () => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      // Clear suggestions when navigating to search page
      setSuggestions([]);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (cabinet: Cabinet) => {
    setSearchTerm(cabinet.name);
    setSuggestions([]);
    navigate(`/cabinets/${cabinet.id}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    } else if (e.key === "Escape") {
      // Allow user to close suggestions with Escape key
      setSuggestions([]);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-[700px] overflow-hidden bg-center bg-cover rounded-md sm:py-12 md:py-16 lg:py-20"
        style={{
          backgroundImage: `url(https://i.pinimg.com/1200x/b5/1f/bd/b51fbd69a0123bae39b94cf7f12a4f2e.jpg)`,
          backgroundPosition: "right",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 opacity-50 bg-black/50"></div>

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
                  Search
                </Button>
              </div>

              {/* Suggestions Dropdown */}
              {searchTerm.length >= 2 && loading === "pending" ? (
                <div className="absolute left-0 z-20 w-full p-3 mt-1 border border-gray-200 rounded-md shadow-lg text-primary bg-white/95 backdrop-blur-sm">
                  <LoaderCircleIcon className="inline w-4 h-5 mr-2 text-pring-primary"/>
                  Loading suggestions...
                </div>
              ) : searchTerm.length >= 2 && loading === "succeeded" && suggestions.length > 0 ? (
                <div
                  className="absolute left-0 z-20 w-full mt-1 overflow-y-auto border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm"
                  style={{ maxHeight: "240px" }}
                >
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center gap-3 p-3 text-lg transition-colors cursor-pointer hover:bg-gray-100 text-foreground"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onKeyPress={(e) => e.key === "Enter" && handleSuggestionClick(suggestion)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select ${suggestion.name}`}
                    >
                      <img
                        src={suggestion.image}
                        alt={`${suggestion.name} image`}
                        className="object-cover rounded-md h-14 w-14"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name)}`;
                        }}
                      />
                      <div className="flex flex-col ml-2">
                        <span className="font-medium text-foreground">{suggestion.name}</span>
                        <span className="text-sm text-emerald-500">
                          {suggestion.address}, {suggestion.city}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm.length >= 2 && loading === "succeeded" ? (
                <div className="absolute left-0 z-20 w-full p-3 mt-1 text-gray-500 border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm">
                  No suggestions found
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}