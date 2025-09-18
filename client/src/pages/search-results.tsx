"use client";
import { ArrowRight, Search, MapPin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { actGetAllCabinetsActive } from "@/store/cabinets/act/actGetAllCabinetsActive";
import type { Cabinet } from "@/types/cabinet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";

// Fix for Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green icon for hover state
const greenIcon = new L.Icon({
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Modal component for copy confirmation
function CopyConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  coordinates,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coordinates: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
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

// Component to handle map bounds
function MapBounds({ cabinets }: { cabinets: Cabinet[] }) {
  const map = useMap();

  useEffect(() => {
    if (!cabinets.length) return;

    const validCabinets = cabinets.filter(
      (c) =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );

    if (validCabinets.length === 0) return;

    if (validCabinets.length === 1) {
      const { latitude, longitude } = validCabinets[0];
      map.setView([parseFloat(latitude!), parseFloat(longitude!)], 15);
    } else {
      const bounds = L.latLngBounds(
        validCabinets.map((c) => [parseFloat(c.latitude!), parseFloat(c.longitude!)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [cabinets, map]);

  return null;
}

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

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  const navigate = useNavigate();
  const { cabinets, loading } = useAppSelector((state) => state.cabinets);
  const dispatch = useAppDispatch();

  // Fetch cabinets on mount
  useEffect(() => {
    dispatch(actGetAllCabinetsActive());
  }, [dispatch]);

  // Handle clicks outside search container to hide suggestions
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

  // Filter cabinets and suggestions based on search term
  useEffect(() => {
    if (loading) return;

    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch) {
      const filtered = cabinets.filter(
        (cabinet) =>
          (cabinet.name?.toLowerCase()?.includes(lowerSearch) || false) ||
          (cabinet.description?.toLowerCase()?.includes(lowerSearch) || false) ||
          (cabinet.address?.toLowerCase()?.includes(lowerSearch) || false)
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

  // Open popup for hovered cabinet
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

  // Calculate map center (fallback for initial render)
  const mapCenter = useMemo((): [number, number] => {
    const validCabinets = filteredCabinets.filter(
      (c) =>
        c.latitude !== undefined &&
        c.longitude !== undefined &&
        !isNaN(parseFloat(c.latitude)) &&
        !isNaN(parseFloat(c.longitude))
    );
    if (validCabinets.length === 0) {
      return [33.5731, -7.5898];
    }
    const avgLat = validCabinets.reduce((sum, c) => sum + parseFloat(c.latitude || "0"), 0) / validCabinets.length;
    const avgLng = validCabinets.reduce((sum, c) => sum + parseFloat(c.longitude || "0"), 0) / validCabinets.length;
    return [avgLat, avgLng];
  }, [filteredCabinets]);

  // Format coordinates for display
  const formatCoordinates = (lat?: string, lng?: string) => {
    if (!lat || !lng) return "Coordonnées non disponibles";
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return "Coordonnées non disponibles";
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  };

  // Function to open modal with coordinates
  const handleOpenCopyModal = (lat?: string, lng?: string) => {
    const coordinates = formatCoordinates(lat, lng);
    if (coordinates !== "Coordonnées non disponibles") {
      setSelectedCoordinates(coordinates);
      setIsModalOpen(true);
    } else {
      toast.error("Coordonnées invalides, impossible de copier.");
    }
  };

  // Function to copy coordinates to clipboard with fallback
  const handleCopyLocation = () => {
    if (!selectedCoordinates || selectedCoordinates === "Coordonnées non disponibles") {
      toast.error("Aucune coordonnée valide à copier.");
      setIsModalOpen(false);
      return;
    }

    // Modern clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(selectedCoordinates).then(() => {
        toast.success("Localisation copiée avec succès", {
          duration: 1000,
          position: "bottom-right",
        });
        setIsModalOpen(false);
      }).catch((err) => {
        console.error("Erreur lors de la copie avec navigator.clipboard :", err);
        // Fallback to document.execCommand
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
      // Fallback for older browsers without clipboard API
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
                  placeholder="Rechercher cabinet médical, médecins, services..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyPress={handleKeyPress}
                  className="h-12 pl-12 text-xl font-medium bg-transparent border-none focus:outline-none"
                  aria-label="Rechercher services médicaux, cabinets ou médecins"
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
              <div className="absolute left-0 z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center gap-3 p-3 text-lg transition-colors duration-150 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyPress={(e) => e.key === "Enter" && handleSuggestionClick(suggestion)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Sélectionner ${suggestion.name || "Cabinet sans nom"}`}
                  >
                    <img
                      src={suggestion.image || "/placeholder.svg"}
                      alt={suggestion.name || "Cabinet"}
                      className="object-cover w-10 h-10 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium truncate">{suggestion.name || "Cabinet sans nom"}</div>
                      <div className="text-sm text-gray-500 truncate">{suggestion.address}</div>
                    </div>
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      <section className="container px-4 py-8 mx-auto">
        <h4 className="mb-6 text-3xl font-bold text-start">Résultats de recherche</h4>
        {searchTerm && (
          <span className="mb-6 text-gray-600 text-start">
            Résultats pour: "<span className="font-semibold">{searchTerm}</span>"
            {!loading && ` (${filteredCabinets.length} résultat${filteredCabinets.length > 1 ? "s" : ""})`}
          </span>
        )}

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
              filteredCabinets.map((cabinet) => (
                <div
                  key={cabinet.id}
                  className="relative p-6 overflow-hidden transition-shadow duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md"
                  onMouseEnter={() => setHoveredCabinetId(String(cabinet.id))}
                  onMouseLeave={() => setHoveredCabinetId(null)}
                >
                  <div className="flex flex-col gap-4 md:flex-row">
                    <img
                      src={cabinet.image || "/placeholder.svg"}
                      alt={cabinet.name || "Cabinet"}
                      className="object-cover w-full h-48 rounded-lg md:w-48"
                    />
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">
                        {cabinet.name || "Cabinet sans nom"}
                      </h3>

                      <div className="mb-3 space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              hoveredCabinetId !== null && hoveredCabinetId === String(cabinet.id)
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          />
                          <span
                            className={
                              hoveredCabinetId !== null && hoveredCabinetId === String(cabinet.id)
                                ? "text-green-500"
                                : ""
                            }
                          >
                            {cabinet.address || "Adresse non disponible"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">Coordonnées:</span>
                          <span className="px-2 py-1 font-mono text-xs text-blue-600 rounded bg-blue-50">
                            {formatCoordinates(cabinet.latitude, cabinet.longitude)}
                          </span>
                        </div>
                      </div>

                      <p className="mb-4 text-sm text-gray-700 line-clamp-3">
                        {cabinet.description || "Aucune description disponible"}
                      </p>

                      <Button
                        className="px-6 py-2 text-white transition-colors duration-200 bg-primary hover:bg-primary/90"
                        onClick={() => navigate(`/cabinets/${cabinet.id}`)}
                      >
                        Voir les détails
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
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
                    (cabinet) =>
                      cabinet.latitude !== undefined &&
                      cabinet.longitude !== undefined &&
                      !isNaN(parseFloat(cabinet.latitude)) &&
                      !isNaN(parseFloat(cabinet.longitude))
                  )
                  .map((cabinet) => (
                    <Marker
                      key={cabinet.id}
                      position={[parseFloat(cabinet.latitude!), parseFloat(cabinet.longitude!)]}
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