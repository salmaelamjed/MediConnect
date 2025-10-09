"use client"
import {
  Search,
  Copy,
  Loader,
  SearchIcon,
  LucideMapPinned,
  MapIcon,
  Mail,
  User,
} from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import type { Cabinet } from "@/types/cabinet"
import { debounce } from "lodash"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { type Marker as LeafletMarker, type LatLngExpression } from "leaflet"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar28 } from "@/components/shared/Calendar28"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Combobox } from "@/components/ui/combobox"
import { clearSearchResults } from "@/store/cabinets/cabinetsSlice"
import { actSearchCabinet } from "@/store/search/act/actSearchCabinet"

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

// Copy Confirmation Modal
interface CopyConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  coordinates: string
}

function CopyConfirmationModal({ isOpen, onClose, onConfirm, coordinates }: CopyConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <p className="mb-4 text-gray-700">
          The following coordinates are ready to be copied: <span className="font-mono">{coordinates}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} aria-label="Cancel copying coordinates">
            Cancel
          </Button>
          <Button
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={onConfirm}
            aria-label="Confirm copying coordinates"
          >
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
    isNaN(Number.parseFloat(cabinet.longitude))
  ) {
    return "Distance not available"
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const lat1 = Number.parseFloat(cabinet.latitude)
  const lon1 = Number.parseFloat(cabinet.longitude)
  const lat2 = userLocation.lat
  const lon2 = userLocation.lng

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<string>("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const markerRefs = useRef<{ [key: string]: LeafletMarker }>({})
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { searchResults, loading, error } = useAppSelector((state) => state.search)

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      if (term.trim() && term.length >= 2) {
        dispatch(actSearchCabinet({ searchTerm: term, date: selectedDate, specialtyId: selectedSpecialtyId }))
          .unwrap()
          .catch((err:any) => {
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

  // Display errors from Redux state
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          setUserLocation({ lat: 33.5731, lng: -7.5898 }) // Fallback to Casablanca
          toast.info("Unable to retrieve your position. Using Casablanca as default.")
          console.error(error)
        },
      )
    } else {
      setUserLocation({ lat: 33.5731, lng: -7.5898 })
      toast.info("Geolocation not supported. Using Casablanca as default.")
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
    // Removed debounced search here - only triggers on Search button click
  }

  // FIXED: Only update selectedSpecialtyId, don't change searchTerm
  const handleSpecialtyChange = (value: string, id?: number) => {
    setSelectedSpecialtyId(id)
    // Don't update searchTerm or appliedSearchTerm here
    // The search will trigger when user clicks the Search button
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    // Don't trigger search automatically, wait for Search button click
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setAppliedSearchTerm(searchTerm)
      // Fixed URL parameter syntax
      navigate(`/search?q=${encodeURIComponent(searchTerm)}&date=${encodeURIComponent(selectedDate||"")}&speciality=${encodeURIComponent(selectedSpecialtyId?.toString()||"")}`)
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

  const formatCoordinates = (lat?: string, lng?: string): string => {
    if (!lat || !lng) return "Coordinates not available"
    const latNum = Number.parseFloat(lat)
    const lngNum = Number.parseFloat(lng)
    return isNaN(latNum) || isNaN(lngNum) ? "Coordinates not available" : `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
  }

  const handleOpenCopyModal = (lat?: string, lng?: string) => {
    const coordinates = formatCoordinates(lat, lng)
    if (coordinates !== "Coordinates not available") {
      setSelectedCoordinates(coordinates)
      setIsModalOpen(true)
    } else {
      toast.error("Invalid coordinates, cannot copy.")
    }
  }

  const handleCopyLocation = () => {
    if (!selectedCoordinates || selectedCoordinates === "Coordinates not available") {
      toast.error("No valid coordinates to copy.")
      setIsModalOpen(false)
      return
    }
    navigator.clipboard
      .writeText(selectedCoordinates)
      .then(() => {
        toast.success("Location copied successfully", { duration: 1000, position: "bottom-right" })
        setIsModalOpen(false)
      })
      .catch(() => {
        toast.error("Error copying coordinates.")
        setIsModalOpen(false)
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CopyConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCopyLocation}
        coordinates={selectedCoordinates}
      />

      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container w-full px-4 py-6 mx-auto">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="block mb-2 text-sm font-semibold text-gray-700">Where?</Label>
              <div className="relative">
                <InputGroup>
                  <InputGroupInput
                    placeholder="Search by city..."
                    className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                    value={searchTerm}
                    onChange={handleInputChange}
                  />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
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

      <section className="container w-full px-4 py-6 mx-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Content - Results */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {loading === "pending" ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : searchResults.length === 0 && loading === "succeeded" ? (
                <div className="justify-center py-12 text-center text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2 text-xl font-semibold">No results found</p>
                  <p>Try modifying your search terms</p>
                </div>
              ) : (
                searchResults.map((cabinet) => {
                  const distance = getDistance(cabinet, userLocation)

                  return (
                    <Card
                      key={cabinet.id}
                      className="overflow-hidden transition-all duration-200 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200"
                      onMouseEnter={() => setHoveredCabinetId(String(cabinet.id))}
                      onMouseLeave={() => setHoveredCabinetId(null)}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="relative md:w-64 h-42 md:h-auto">
                            <img
                              src={cabinet.image || "/placeholder.svg?height=250&width=300&query=medical clinic"}
                              alt={`${cabinet.name || "Clinic"} image`}
                              className="object-cover w-full h-full"
                            />
                            <Badge className="absolute px-2 py-1 text-xs font-semibold text-white bg-orange-500 top-3 left-3">
                              5 ★
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="flex flex-col justify-between flex-1 p-5">
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="mb-1 text-xl font-bold text-blue-900 cursor-pointer hover:text-blue-700">
                                    {cabinet.name || "Unnamed Clinic"}
                                  </h3>
                                  <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
                                    <MapIcon className="w-4 h-4 text-green-500" />
                                    <span>
                                      {cabinet.address || "Address not available"}, {cabinet.postal_code} {cabinet.city}
                                    </span>
                                    <span>
                                      <LucideMapPinned className="inline-block w-4 h-4 ml-4 text-red-500" />
                                      {distance}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Mail className="w-4 h-4 text-blue-500" />
                                      <span className="font-medium">Contact:</span>
                                      <p className="inline-block">{cabinet.email}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Services */}
                              <div className="flex flex-wrap gap-2 my-3">
                                {(cabinet.specialities || []).map((specialty) => (
                                  <span key={specialty.id} className="px-2 py-1 text-sm text-white rounded-full bg-primary">
                                    {specialty.name}
                                  </span>
                                ))}
                              </div>

                              {/* Doctors */}
                              <div className="my-3">
                                <h4 className="text-sm font-semibold text-gray-700">Doctors</h4>
                                <div className="mt-2 space-y-2">
                                  {(cabinet.doctors || []).length > 0 ? (
                                    cabinet.doctors.map((doctor) => (
                                      <div key={doctor.id} className="flex items-start gap-2 text-sm text-gray-600">
                                        <User className="w-4 h-4 mt-1 text-blue-600" />
                                        <div>
                                          <p className="font-medium">{doctor.name}</p>
                                          <p>Specialty: {doctor.speciality?.name || "N/A"}</p>
                                          <p>Fees: {doctor.consultation_fees || "N/A"}</p>
                                          <p>Available: {(doctor.available_days || []).join(", ") || "N/A"}</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">No doctors available</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom section with price and button */}
                            <div className="flex items-end justify-end mt-4">
                              <div className="text-sm text-gray-600">
                                <p className="mb-1">
                                  <span className="mr-4 font-semibold text-blue-600">View Details</span>
                                </p>
                              </div>
                              <Button
                                className="px-6 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                onClick={() => navigate(`/reservations/${cabinet.id}`)}
                              >
                                Book Appointment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
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
                          <div className="min-w-48">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold">{cabinet.name || "Unnamed Clinic"}</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent"
                                onClick={() => handleOpenCopyModal(cabinet.latitude, cabinet.longitude)}
                                aria-label="Copy clinic coordinates"
                              >
                                <Copy className="w-4 h-4" />
                                Copy
                              </Button>
                            </div>
                            <p className="mb-2 text-sm text-blue-600">{cabinet.address}</p>
                            <p className="font-mono text-xs text-gray-600">
                              {formatCoordinates(cabinet.latitude, cabinet.longitude)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}