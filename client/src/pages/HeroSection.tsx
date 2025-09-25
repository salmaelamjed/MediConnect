"use client"
import { LoaderCircleIcon, Search } from "lucide-react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { actSearch } from "@/store/cabinets/act/actSearch"
import type { Cabinet } from "@/types/cabinet"
import { debounce } from "lodash"

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<Cabinet[]>([])
  const navigate = useNavigate()
  const { loading, searchResults } = useAppSelector((state) => state.cabinets)
  const dispatch = useAppDispatch()

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim() && term.length >= 2) {
        dispatch(actSearch(term))
      }
    }, 300),
    [dispatch],
  )

  // Update suggestions from Redux store
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setSuggestions(searchResults)
    }
  }, [searchResults])

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      debouncedSearch(searchTerm)
    } else {
      // Clear suggestions immediately when search term is too short
      setSuggestions([])
      debouncedSearch.cancel() // Cancel pending debounced calls
    }

    // Cleanup function to cancel debounced calls on unmount or searchTerm change
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchTerm, debouncedSearch])

  const handleSearch = () => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      // Clear suggestions when navigating to search page
      setSuggestions([])
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  const handleSuggestionClick = (cabinet: Cabinet) => {
    setSearchTerm(cabinet.name)
    setSuggestions([])
    navigate(`/cabinets/${cabinet.id}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // Prevent form submission
      handleSearch()
    } else if (e.key === "Escape") {
      // Allow user to close suggestions with Escape key
      setSuggestions([])
    }
  }

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
                <span className="inline-block px-4 py-2 rounded-lg bg-white/20">Tomorrows, Today!</span>
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
                <div className="absolute left-0 z-20 w-full p-4 mt-2 border shadow-2xl border-white/20 rounded-xl bg-white/95 backdrop-blur-md">
                  <div className="flex items-center justify-center py-3">
                    <LoaderCircleIcon className="w-5 h-5 mr-3 animate-spin text-primary" />
                    <span className="text-sm font-medium text-gray-600">Searching for suggestions...</span>
                  </div>
                </div>
              ) : searchTerm.length >= 2 && loading === "succeeded" && suggestions.length > 0 ? (
                <div
                  className="absolute left-0 z-20 w-full mt-2 overflow-hidden border shadow-2xl border-white/20 rounded-xl bg-white/95 backdrop-blur-md"
                  style={{ maxHeight: "320px" }}
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      Suggested Clinics ({suggestions.length})
                    </p>
                  </div>

                  <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className={`group flex items-center gap-4 p-4 transition-all duration-200 cursor-pointer hover:bg-blue-50/80 hover:shadow-sm ${
                          index !== suggestions.length - 1 ? "border-b border-gray-100/60" : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onKeyPress={(e) => e.key === "Enter" && handleSuggestionClick(suggestion)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${suggestion.name}`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={suggestion.image || "/placeholder.svg"}
                            alt={`${suggestion.name} image`}
                            className="object-cover w-16 h-16 transition-transform duration-200 border-2 border-white rounded-lg shadow-sm group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name)}&background=3b82f6&color=ffffff&size=64`
                            }}
                          />
                          <div className="absolute inset-0 transition-opacity duration-200 rounded-lg opacity-0 bg-gradient-to-t from-black/10 to-transparent group-hover:opacity-100"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="flex font-bold text-gray-900 truncate transition-colors duration-200 group-hover:text-blue-700">
                            {suggestion.name}
                          </h2>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="truncate">
                              {suggestion.address}, {suggestion.city}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1">
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchTerm.length >= 2 && loading === "succeeded" ? (
                <div className="absolute left-0 z-20 w-full p-6 mt-2 text-center border shadow-2xl border-white/20 rounded-xl bg-white/95 backdrop-blur-md">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="font-medium text-gray-600">No clinics found</p>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
