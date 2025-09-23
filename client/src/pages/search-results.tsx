"use client";
import { Search, MapPin, Copy, Calendar, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { actGetAllCabinetsActive } from "@/store/cabinets/act/actGetAllCabinetsActive";
import type { Cabinet } from "@/types/cabinet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { Marker as LeafletMarker, type LatLngExpression } from "leaflet";
import { toast } from "sonner";

// Define a type for Leaflet Icon prototype to avoid `any`
interface IconDefaultPrototype {
  _getIconUrl?: () => string;
}

// Fix for Leaflet default marker icons with proper typing
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green icon for hover state with proper typing
const greenIcon = new L.Icon({
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Modal component for copy confirmation with typed props
interface CopyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coordinates: string;
}

function CopyConfirmationModal({ isOpen, onClose, onConfirm, coordinates }: CopyConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg outline-none"
      >
        <p className="mb-4 text-gray-700">
          Les coordonnées suivantes sont prêtes à être copiées :{" "}
          <span className="font-mono">{coordinates}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
            aria-label="Annuler la copie des coordonnées"
          >
            Annuler
          </Button>
          <Button
            className="px-4 py-2 text-white bg-primary hover:bg-primary/90"
            onClick={onConfirm}
            aria-label="Confirmer la copie des coordonnées"
          >
            Copier
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component to handle map bounds with typed props
interface MapBoundsProps {
  cabinets: Cabinet[];
}

function MapBounds({ cabinets }: MapBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!cabinets.length) return;

    const validCabinets = cabinets.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );

    if (validCabinets.length === 0) return;

    if (validCabinets.length === 1) {
      const { latitude, longitude } = validCabinets[0];
      map.setView([parseFloat(latitude), parseFloat(longitude)], 15);
    } else {
      const bounds = L.latLngBounds(
        validCabinets.map((c) => [parseFloat(c.latitude), parseFloat(c.longitude)] as LatLngExpression)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [cabinets, map]);

  return null;
}

// Helper function to calculate distance using the Haversine formula
const getDistance = (cabinet: Cabinet, userLocation: { lat: number; lng: number } | null): string => {
  if (
    !userLocation ||
    !cabinet.latitude ||
    !cabinet.longitude ||
    isNaN(parseFloat(cabinet.latitude)) ||
    isNaN(parseFloat(cabinet.longitude))
  ) {
    return "Distance non disponible";
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = parseFloat(cabinet.latitude);
  const lon1 = parseFloat(cabinet.longitude);
  const lat2 = userLocation.lat;
  const lon2 = userLocation.lng;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance >= 1) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${(distance * 1000).toFixed(0)} m`;
  }
};

export default function SearchResults() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearchTerm = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [suggestions, setSuggestions] = useState<Cabinet[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCabinets, setFilteredCabinets] = useState<Cabinet[]>([]);
  const [hoveredCabinetId, setHoveredCabinetId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: LeafletMarker }>({});

  const navigate = useNavigate();
  const { cabinets, loading } = useAppSelector((state) => state.cabinets);
  const dispatch = useAppDispatch();

  // Fetch cabinets and user location
  useEffect(() => {
    dispatch(actGetAllCabinetsActive());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocation({ lat: 33.5731, lng: -7.5898 }); // Fallback to Casablanca
          toast.info("Impossible de récupérer votre position. Utilisation de Casablanca comme position par défaut.");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 33.5731, lng: -7.5898 });
      toast.info("Géolocalisation non supportée. Utilisation de Casablanca comme position par défaut.");
    }
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch) {
      const filtered = cabinets.filter((cabinet) =>
        [
          cabinet.name?.toLowerCase(),
          cabinet.description?.toLowerCase(),
          cabinet.address?.toLowerCase(),
          ...(cabinet.specialities || []).map((s: { name: string }) => s.name.toLowerCase()),
        ].some((field) => field?.includes(lowerSearch))
      );

      if (showSuggestions && lowerSearch.length > 0) {
        setSuggestions(filtered.slice(0, 5));
      }

      if (initialSearchTerm) {
        setFilteredCabinets(filtered);
      }
    } else {
      setSuggestions([]);
      setFilteredCabinets([]);
    }
  }, [searchTerm, cabinets, loading, showSuggestions, initialSearchTerm]);

  useEffect(() => {
    if (hoveredCabinetId && markerRefs.current[hoveredCabinetId]) {
      markerRefs.current[hoveredCabinetId].openPopup();
    }
  }, [hoveredCabinetId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (cabinet: Cabinet) => {
    setSearchTerm(cabinet.name || "");
    setShowSuggestions(false);
    setFilteredCabinets([cabinet]);
    navigate(`/search?q=${encodeURIComponent(cabinet.name || "")}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const mapCenter = useMemo((): [number, number] => {
    const validCabinets = filteredCabinets.filter(
      (c): c is Cabinet & { latitude: string; longitude: string } =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );
    if (validCabinets.length === 0) {
      return [33.5731, -7.5898]; // Default to Casablanca
    }
    const avgLat = validCabinets.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / validCabinets.length;
    const avgLng = validCabinets.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / validCabinets.length;
    return [avgLat, avgLng];
  }, [filteredCabinets]);

  const formatCoordinates = (lat?: string, lng?: string): string => {
    if (!lat || !lng) return "Coordonnées non disponibles";
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return isNaN(latNum) || isNaN(lngNum) ? "Coordonnées non disponibles" : `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  };

  const handleOpenCopyModal = (lat?: string, lng?: string) => {
    const coordinates = formatCoordinates(lat, lng);
    if (coordinates !== "Coordonnées non disponibles") {
      setSelectedCoordinates(coordinates);
      setIsModalOpen(true);
    } else {
      toast.error("Coordonnées invalides, impossible de copier.");
    }
  };

  const handleCopyLocation = () => {
    if (!selectedCoordinates || selectedCoordinates === "Coordonnées non disponibles") {
      toast.error("Aucune coordonnée valide à copier.");
      setIsModalOpen(false);
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(selectedCoordinates)
        .then(() => {
          toast.success("Localisation copiée avec succès", {
            duration: 1000,
            position: "bottom-right",
          });
          setIsModalOpen(false);
        })
        .catch((err) => {
          console.error("Erreur lors de la copie avec navigator.clipboard :", err);
          try {
            const textarea = document.createElement("textarea");
            textarea.value = selectedCoordinates;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Localisation copiée avec succès", {
              duration: 1000,
              position: "bottom-right",
            });
            setIsModalOpen(false);
          } catch (fallbackErr) {
            console.error("Erreur lors de la copie avec execCommand :", fallbackErr);
            toast.error("Erreur lors de la copie des coordonnées.");
            setIsModalOpen(false);
          }
        });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = selectedCoordinates;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Localisation copiée avec succès", {
          duration: 1000,
          position: "bottom-right",
        });
        setIsModalOpen(false);
      } catch (err) {
        console.error("Erreur lors de la copie avec execCommand :", err);
        toast.error("Erreur lors de la copie des coordonnées.");
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <CopyConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCopyLocation}
        coordinates={selectedCoordinates}
      />
      {/* Search Bar Section */}
      <section className="flex justify-end py-8">
        <div className="container px-4 mx-auto">
          <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto">
            <div className="flex flex-col gap-3 p-2 bg-white border border-gray-200 shadow-sm sm:flex-row rounded-xl">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-4 top-1/2" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher cabinet médical, médecins, spécialités..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyPress={handleKeyPress}
                  className="h-12 pl-12 text-xl font-medium bg-transparent border-none focus:outline-none"
                  aria-label="Rechercher services médicaux, cabinets ou spécialités"
                />
              </div>
              <Button
                size="lg"
                className="h-12 px-8 font-semibold text-white bg-secondary hover:bg-secondary/90"
                onClick={handleSearch}
              >
                Rechercher
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute left-0 z-20 w-full mt-1 overflow-y-auto border border-gray-200 rounded-md shadow-lg bg-white/95 backdrop-blur-sm"
                style={{ maxHeight: "240px" }}
              >
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-3 p-3 text-lg cursor-pointer hover:bg-gray-100 text-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyPress={(e) => e.key === "Enter" && handleSuggestionClick(suggestion)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Sélectionner ${suggestion.name || "Cabinet sans nom"}`}
                  >
                    <img
                      src={suggestion.image || "/placeholder.svg"}
                      alt={`${suggestion.name || "Cabinet"} image`}
                      className="object-cover w-12 h-12 rounded-md"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-foreground">
                        {suggestion.name || "Cabinet sans nom"}
                      </span>
                      <span className="text-sm text-emerald-500">{suggestion.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      <section className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Cabinet Cards */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center">
                <p>Chargement en cours...</p>
              </div>
            ) : filteredCabinets.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="mb-2 text-xl">Aucun résultat trouvé</p>
                <p>Essayez de modifier vos termes de recherche</p>
              </div>
            ) : (
              filteredCabinets.map((cabinet) => {
                const distance = getDistance(cabinet, userLocation);

                return (
                  <div
                    key={cabinet.id}
                    className="relative p-4 transition-shadow duration-200 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl"
                    onMouseEnter={() => setHoveredCabinetId(String(cabinet.id))}
                    onMouseLeave={() => setHoveredCabinetId(null)}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={cabinet.image || "/placeholder.svg"}
                        alt={cabinet.name || "Cabinet"}
                        className="object-cover w-32 h-32 rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">{cabinet.name || "Cabinet sans nom"}</h3>
                          <span className="text-blue-600">✓</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span>
                            {cabinet.address || "Adresse non disponible"}, {cabinet.postal_code} {cabinet.city}
                          </span>
                          <span className="ml-2 text-gray-400">≈ {distance}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6">
                          {(cabinet.specialities || []).map((specialty: { name: string }) => (
                            <span
                              key={specialty.name}
                              className="px-2 py-1 text-sm text-blue-600 bg-blue-100 rounded-full"
                            >
                              {specialty.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-green-600">
                            <Calendar className="inline-block w-4 h-4" /> 5 créneaux dispo
                          </span>
                          <span>
                            <Clock3 className="inline-block w-4 h-4" /> Next: 14h30
                          </span>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            className="px-4 py-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Plus d'infos
                          </Button>
                          <Button
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700"
                            onClick={() => navigate(`/cabinets/${cabinet.id}`)}
                          >
                            Prendre RDV
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Map */}
          <div className="h-96 lg:h-[calc(100vh-200px)] sticky top-20">
            {filteredCabinets.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="border border-gray-200 rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds cabinets={filteredCabinets} />
                {filteredCabinets
                  .filter(
                    (cabinet): cabinet is Cabinet & { latitude: string; longitude: string } =>
                      cabinet.latitude !== undefined &&
                      cabinet.longitude !== undefined &&
                      !isNaN(parseFloat(cabinet.latitude)) &&
                      !isNaN(parseFloat(cabinet.longitude))
                  )
                  .map((cabinet) => (
                    <Marker
                      key={cabinet.id}
                      position={[parseFloat(cabinet.latitude), parseFloat(cabinet.longitude)]}
                      icon={
                        hoveredCabinetId !== null && hoveredCabinetId === String(cabinet.id)
                          ? greenIcon
                          : new L.Icon.Default()
                      }
                      ref={(ref) => {
                        if (ref) markerRefs.current[cabinet.id] = ref;
                      }}
                    >
                      <Popup>
                        <div className="min-w-48">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{cabinet.name || "Cabinet sans nom"}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => handleOpenCopyModal(cabinet.latitude, cabinet.longitude)}
                              aria-label="Copier les coordonnées du cabinet"
                            >
                              <Copy className="w-4 h-4" />
                              Copier
                            </Button>
                          </div>
                          <p className="mb-2 text-sm text-green-500">{cabinet.address}</p>
                          <p className="font-mono text-xs text-gray-600">
                            {formatCoordinates(cabinet.latitude, cabinet.longitude)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>La carte s'affichera avec les résultats</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}