"use client"
import {
  Search,
  LucideMapPinned,
  MapIcon,
  Mail,
  User,
  Users,
  Star,
  EqualApproximately,
  Loader,
} from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import type { Cabinet } from "@/types/cabinet"
import { debounce } from "lodash"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { type Marker as LeafletMarker, type LatLngExpression } from "leaflet"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar28 } from "@/components/shared/Calendar28"
import { Combobox } from "@/components/ui/combobox"
import { clearSearchResults } from "@/store/cabinets/cabinetsSlice"
import { actSearchCabinet } from "@/store/search/act/actSearchCabinet"
import { Input } from "@/components/ui/input"

// Fix for Leaflet default marker icons
interface IconDefault extends L.Icon {
  _getIconUrl?: () => string
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Custom green icon for hover state
const greenIcon = new L.Icon({
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Map Bounds Component
interface MapBoundsProps {
  cabinets: Cabinet[]
}

function MapBounds({ cabinets }: MapBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (!cabinets.length) return

    const validCabinets = cabinets.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(Number.parseFloat(c.latitude)) &&
        !isNaN(Number.parseFloat(c.longitude)),
    )

    if (validCabinets.length === 0) return

    if (validCabinets.length === 1) {
      const { latitude, longitude } = validCabinets[0]
      map.setView([Number.parseFloat(latitude), Number.parseFloat(longitude)], 15)
    } else {
      const bounds = L.latLngBounds(
        validCabinets.map((c) => [Number.parseFloat(c.latitude), Number.parseFloat(c.longitude)] as LatLngExpression),
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [cabinets, map])

  return null
}

// Distance calculation
const getDistance = (cabinet: Cabinet, userLocation: { lat: number; lng: number } | null): string => {
  if (
    !userLocation ||
    !cabinet.latitude ||
    !cabinet.longitude ||
    isNaN(Number.parseFloat(cabinet.latitude)) ||
    isNaN(Number.parseFloat(cabinet.longitude)) ||
    isNaN(userLocation.lat) ||
    isNaN(userLocation.lng)
  ) {
    return "Distance not available"
  }

  const lat1 = Number.parseFloat(cabinet.latitude)
  const lon1 = Number.parseFloat(cabinet.longitude)
  const lat2 = userLocation.lat
  const lon2 = userLocation.lng

  // Validate coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lon1 < -180 || lon1 > 180 || lat2 < -90 || lat2 > 90 || lon2 < -180 || lon2 > 180) {
    return "Invalid coordinates"
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance >= 1 ? `${distance.toFixed(1)} km` : `${(distance * 1000).toFixed(0)} m`
}

export default function SearchResults() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const initialSearchTerm = searchParams.get("q") || ""
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearchTerm)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | undefined>(undefined)
  const [hoveredCabinetId, setHoveredCabinetId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const markerRefs = useRef<{ [key: string]: LeafletMarker }>({})
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { searchResults, loading } = useAppSelector((state) => state.search)

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      if (term.trim() && term.length >= 2) {
        dispatch(actSearchCabinet({ searchTerm: term, date: selectedDate, specialtyId: selectedSpecialtyId }))
          .unwrap()
          .catch((err: any) => {
            toast.error(err || "Failed to fetch suggestions.")
            console.error(err)
          })
      } else {
        dispatch(clearSearchResults())
      }
    },
    [dispatch, selectedDate, selectedSpecialtyId],
  )

  const debouncedSearchHandler = useMemo(() => debounce(debouncedSearch, 300), [debouncedSearch])

  // Trigger search ONLY when Search button is clicked (appliedSearchTerm changes)
  useEffect(() => {
    if (appliedSearchTerm && appliedSearchTerm.length >= 2) {
      dispatch(actSearchCabinet({ searchTerm: appliedSearchTerm, date: selectedDate, specialtyId: selectedSpecialtyId }))
        .unwrap()
        .then((result) => {
          console.log("Search results fetched:", result)
        })
        .catch((err) => {
          toast.error(err || "Failed to fetch search results.")
          console.error(err)
        })
    } else {
      dispatch(clearSearchResults())
    }
    return () => debouncedSearchHandler.cancel()
  }, [appliedSearchTerm, selectedDate, selectedSpecialtyId, dispatch, debouncedSearchHandler])

  // Handle initial load from URL
  useEffect(() => {
    if (initialSearchTerm && initialSearchTerm.length >= 2) {
      setSearchTerm(initialSearchTerm)
      setAppliedSearchTerm(initialSearchTerm)
    }
  }, [initialSearchTerm])

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error("Geolocation error:", error)
          let errorMessage = "Unable to retrieve your location"
          let errorDescription = ""

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied"
              errorDescription = "Please enable location permissions in your browser settings"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location data unavailable"
              errorDescription = "GPS signal not available. Check your device settings"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              errorDescription = "GPS took too long to respond. Try again"
              break
            default:
              errorMessage = "Unknown location error"
              errorDescription = "An unexpected error occurred"
          }

          // Fallback to Casablanca coordinates
          setUserLocation({ lat: 33.5731, lng: -7.5898 })

          toast.error(errorMessage, {
            duration: 4000,
            description: `${errorDescription}. Using Casablanca as default location.`,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      )
    } else {
      setUserLocation({ lat: 33.5731, lng: -7.5898 })
      toast.error("Geolocation not supported", {
        duration: 3000,
        description: "Your browser doesn't support location services. Using Casablanca as default.",
      })
    }
  }, [])

  // Update map when hovered
  useEffect(() => {
    if (hoveredCabinetId && markerRefs.current[hoveredCabinetId]) {
      markerRefs.current[hoveredCabinetId].openPopup()
    }
  }, [hoveredCabinetId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSpecialtyChange = (_value: string, id?: number) => {
    setSelectedSpecialtyId(id)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setAppliedSearchTerm(searchTerm)
      navigate(
        `/search?q=${encodeURIComponent(searchTerm)}&date=${encodeURIComponent(
          selectedDate || "",
        )}&speciality=${encodeURIComponent(selectedSpecialtyId?.toString() || "")}`,
      )
    }
  }

  const mapCenter = useMemo((): [number, number] => {
    const validCabinets = searchResults.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(Number.parseFloat(c.latitude)) &&
        !isNaN(Number.parseFloat(c.longitude)),
    )
    if (validCabinets.length === 0) return [33.5731, -7.5898] // Default to Casablanca
    const avgLat = validCabinets.reduce((sum, c) => sum + Number.parseFloat(c.latitude), 0) / validCabinets.length
    const avgLng = validCabinets.reduce((sum, c) => sum + Number.parseFloat(c.longitude), 0) / validCabinets.length
    return [avgLat, avgLng]
  }, [searchResults])

  return (
    <div className="min-h-screen">
      <section className="">
        <div className="container w-full px-4 py-6 mx-auto">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="block mb-2 text-sm font-semibold text-gray-700">Where?</Label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-black -translate-y-1/2 right-4 top-1/2" />
                <Input
                  type="text"
                  className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                  value={searchTerm}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="md:col-span-3" ref={searchContainerRef}>
              <Label className="block mb-2 text-sm font-semibold text-gray-700">When?</Label>
              <div className="relative">
                <Calendar28 onDateSelect={handleDateChange} />
              </div>
            </div>
            <div className="md:col-span-3" ref={searchContainerRef}>
              <Label className="block mb-2 text-sm font-semibold text-gray-700">Service?</Label>
              <div className="relative">
                <Combobox
                  value={selectedSpecialtyId}
                  onValueChange={handleSpecialtyChange}
                  className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-end md:col-span-2">
              <Button
                size="lg"
                className="w-full h-12 font-semibold text-white bg-blue-600 hover:bg-blue-700"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container w-full px-4 py-6 mx-auto" aria-live="polite">
        {loading === "pending" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="mt-4 text-lg font-semibold text-gray-700">Searching for clinics...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the results.</p>
          </div>
        ) : searchResults.length === 0 && loading === "succeeded" ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center border border-gray-200 rounded-lg shadow-sm">
            <CardContent>
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No Results Found</h3>
              <p className="max-w-md mb-4 text-sm text-gray-500">
                We couldn’t find any clinics matching your search. Try adjusting your location, date, or specialty.
              </p>
              <Button
                variant="outline"
                className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Content - Results */}
            <div className="lg:col-span-7">
              <div className="space-y-4">
                {searchResults.map((cabinet) => {
                  const distance = getDistance(cabinet, userLocation)
                  return (
                    <Card
                      key={cabinet.id}
                      className="overflow-hidden transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-300"
                      onMouseEnter={() => setHoveredCabinetId(String(cabinet.id))}
                      onMouseLeave={() => setHoveredCabinetId(null)}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Image Section - Hauteur fixe */}
                          <div className="relative h-58 md:w-72 md:h-full group">
                            <div className="absolute inset-0 z-10" />
                            <img
                              src={cabinet.image || "/placeholder.svg?height=250&width=300&query=medical clinic"}
                              alt={`${cabinet.name || "Clinic"} image`}
                              className="object-cover w-full h-full"
                            />
                            <Badge className="absolute px-2 py-1 text-xs font-bold text-white bg-orange-500 border-0 top-3 left-3">
                              ⭐ 5.0
                            </Badge>
                          </div>

                          {/* Content Section - Scroll si nécessaire */}
                          <div className="flex flex-col flex-1 p-4 overflow-hidden">
                            <div className="flex-1 overflow-y-auto">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="mb-1 text-lg font-bold text-gray-900 transition-colors cursor-pointer hover:text-blue-800 line-clamp-1">
                                    {cabinet.name || "Unnamed Clinic"}
                                  </h3>
                                  {/* Location & Distance */}
                                  <div className="flex flex-col gap-1 mb-2 text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      <MapIcon className="flex-shrink-0 w-5 h-5 text-green-600" />
                                      <span className="text-md line-clamp-1">
                                        {cabinet.address || "Address not available"}, {cabinet.postal_code} {cabinet.city}
                                      </span>
                                      <EqualApproximately className="flex-shrink-0 w-3 h-3 text-primary" />
                                      <LucideMapPinned className="flex-shrink-0 w-5 h-5 text-red-500" />
                                      <span className="text-sm font-medium">{distance}</span>
                                    </div>
                                  </div>
                                  {/* Owner */}
                                  <div className="flex items-center gap-1.5 mb-2 text-gray-600">
                                    <User className="flex-shrink-0 w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-md">Owner:</span>
                                    <span className="text-sm">salma</span>
                                  </div>
                                  {/* Contact */}
                                  <div className="flex items-center gap-1.5 mb-3 text-gray-600">
                                    <Mail className="flex-shrink-0 w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-md">Contact:</span>
                                    <span className="text-sm text-blue-600 cursor-pointer hover:underline line-clamp-1">
                                      {cabinet.email}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Specialties */}
                              <div className="mb-2">
                                <h4 className="mb-1 font-semibold text-gray-700 text-md">Specialties :</h4>
                                <div className="flex flex-wrap gap-1">
                                  {(cabinet.specialities || []).slice(0, 3).map((specialty) => (
                                    <span
                                      key={specialty.id}
                                      className="px-2 py-1 text-xs font-medium text-blue-700 transition-colors border border-blue-200 rounded-full bg-blue-50 hover:bg-blue-100 line-clamp-1"
                                    >
                                      {specialty.name}
                                    </span>
                                  ))}
                                  {(cabinet.specialities || []).length > 3 && (
                                    <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                      +{(cabinet.specialities || []).length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Footer with CTA - Position fixe en bas */}
                            <div className="flex items-center justify-end pt-3 mt-2">
                              <Link
                                to={`/cabinets/${cabinet.id}`}
                                className="mr-4 font-semibold text-blue-600 transition-colors cursor-pointer text-md hover:text-blue-800"
                              >
                                View Details →
                              </Link>
                              <Button
                                className="px-6 py-4 font-semibold text-white transition-all duration-200 rounded-lg shadow-sm text-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow"
                                onClick={() => navigate(`/reservations/${cabinet.id}`)}
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
            {/* Right Side - Map */}
            <div className="lg:col-span-5">
              <div className="sticky top-6">
                {searchResults.length > 0 && loading === "succeeded" && (
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "calc(100vh)", width: "100%" }}
                    className="border border-gray-200 rounded-lg"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapBounds cabinets={searchResults} />
                    {searchResults
                      .filter(
                        (cabinet): cabinet is Cabinet & { latitude: string; longitude: string } =>
                          cabinet.latitude !== undefined &&
                          cabinet.longitude !== undefined &&
                          !isNaN(Number.parseFloat(cabinet.latitude)) &&
                          !isNaN(Number.parseFloat(cabinet.longitude)),
                      )
                      .map((cabinet) => (
                        <Marker
                          key={cabinet.id}
                          position={[Number.parseFloat(cabinet.latitude), Number.parseFloat(cabinet.longitude)]}
                          icon={
                            hoveredCabinetId !== null && hoveredCabinetId === String(cabinet.id)
                              ? greenIcon
                              : new L.Icon.Default()
                          }
                          ref={(ref) => {
                            if (ref) markerRefs.current[cabinet.id] = ref
                          }}
                        >
                          <Popup>
                            <div className="rounded-lg">
                              <div className="relative h-32 overflow-hidden rounded-t-lg w-80">
                                <img
                                  src={cabinet.image || "/placeholder.svg?height=128&width=320&query=medical clinic"}
                                  alt={`${cabinet.name || "Clinic"} image`}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="pr-2 text-lg font-bold text-gray-900">
                                    {cabinet.name || "Unnamed Clinic"}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-600">
                                      <strong>{cabinet.doctors?.length || 0}</strong> doctors
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-gray-600">
                                      <strong>{(cabinet.specialities || []).length}</strong> specialties
                                    </span>
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <h5 className="mb-2 text-xs font-semibold text-gray-500 uppercase">Specialties</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {(cabinet.specialities || []).slice(0, 3).map((specialty) => (
                                      <span
                                        key={specialty.id}
                                        className="px-2 py-1 text-xs text-blue-700 border border-blue-200 rounded-full bg-blue-50"
                                      >
                                        {specialty.name}
                                      </span>
                                    ))}
                                    {(cabinet.specialities || []).length > 3 && (
                                      <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                                        +{(cabinet.specialities || []).length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}