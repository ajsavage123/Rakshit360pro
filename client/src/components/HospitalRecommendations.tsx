import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Star, Navigation, AlertCircle, Share2, Search } from "lucide-react";
import { geoapifyService, Location, Hospital } from "@/lib/geoapify";

interface HospitalRecommendationsProps {
  specialty: string;
  userLocation?: Location;
  summary?: string;
}

const HospitalRecommendations = ({ specialty, userLocation, summary }: HospitalRecommendationsProps) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Detecting your location...");
  const [locationName, setLocationName] = useState<string>("");

  useEffect(() => {
    // Always try to get user's real location first
    if (navigator.geolocation) {
      setLocationStatus("Getting your current location...");
      
      // Check if we have permission first
      navigator.permissions?.query({ name: 'geolocation' }).then((permissionStatus) => {
        console.log('Geolocation permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          setError("Location access denied. Please allow location access in your browser settings or enter your location manually.");
          setLoading(false);
          return;
        }
        
        // Request location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setError(null); // Clear any previous location errors when access is granted
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(userLocation);
            setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
            
            // Get the city/place name
            try {
              const placeName = await geoapifyService.getLocationName(userLocation);
              setLocationName(placeName);
              setLocationStatus(`Found your location: ${placeName}`);
            } catch (error) {
              console.error('Error getting location name:', error);
              setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
            }
            
            fetchHospitals(userLocation);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationStatus("Could not get your location automatically");
            
            // Handle different types of geolocation errors
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setError("Location access denied. Please allow location access in your browser settings or enter your location manually.");
                break;
              case error.POSITION_UNAVAILABLE:
                setError("Location information unavailable. Please enter your location manually.");
                break;
              case error.TIMEOUT:
                setError("Location request timed out. Please try again or enter your location manually.");
                break;
              default:
                setError("Unable to get location. Please enter your location manually.");
                break;
            }
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }).catch(() => {
        // If permissions API is not supported, try direct geolocation
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setError(null);
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(userLocation);
            setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
            
            try {
              const placeName = await geoapifyService.getLocationName(userLocation);
              setLocationName(placeName);
              setLocationStatus(`Found your location: ${placeName}`);
            } catch (error) {
              console.error('Error getting location name:', error);
              setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
            }
            
            fetchHospitals(userLocation);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationStatus("Could not get your location automatically");
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setError("Location access denied. Please allow location access in your browser settings or enter your location manually.");
                break;
              case error.POSITION_UNAVAILABLE:
                setError("Location information unavailable. Please enter your location manually.");
                break;
              case error.TIMEOUT:
                setError("Location request timed out. Please try again or enter your location manually.");
                break;
              default:
                setError("Unable to get location. Please enter your location manually.");
                break;
            }
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          }
        );
      });
    } else {
      setLocationStatus("Geolocation not supported by your browser");
      setError("Geolocation is not supported by your browser. Please enter your location manually.");
      setLoading(false);
    }
  }, [specialty, userLocation]);

  const fetchHospitals = async (location: Location) => {
    try {
      setLoading(true);
      setError(null);
      // Pass the specialty to filter hospitals by recommended specialty
      const hospitalData = await geoapifyService.searchHospitals(location, specialty);
      setHospitals(hospitalData);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError('Failed to fetch hospital data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (hospital: Hospital) => {
    // Use hospital name and address as a text query for best pin accuracy
    const query = encodeURIComponent(`${hospital.name} ${hospital.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const handleCallHospital = (phone: string) => {
    if (phone && phone !== 'Phone not available') {
      // Optionally, you could show a modal with the summary before calling
      window.location.href = `tel:${phone}`;
    }
  };

  const handleShareWhatsApp = (hospital: Hospital) => {
    const text = `Patient Details:\n${summary || ''}\n\nHospital: ${hospital.name}\nAddress: ${hospital.address}`;
    let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (hospital.phone && hospital.phone !== 'Phone not available') {
      // Remove spaces, dashes, and parentheses from phone number
      const phone = hospital.phone.replace(/[^\d+]/g, '');
      url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const handleManualSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      let location: Location;
      
      // If user entered lat,lng
      if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(manualLocation.trim())) {
        const [lat, lng] = manualLocation.split(",").map(Number);
        location = { lat, lng };
      } else {
        // Otherwise, treat as address and geocode it
        const geocodeResult = await geoapifyService.geocodeAddress(manualLocation);
        if (!geocodeResult) {
          throw new Error("Could not find location");
        }
        location = { lat: geocodeResult.lat, lng: geocodeResult.lon };
      }
      
      setCurrentLocation(location);
      
      // Get the city/place name
      try {
        const placeName = await geoapifyService.getLocationName(location);
        setLocationName(placeName);
        setLocationStatus(`Searching near: ${placeName}`);
      } catch (error) {
        console.error('Error getting location name:', error);
        setLocationStatus(`Searching near: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      }
      
      fetchHospitals(location);
    } catch (err) {
      setError("Could not find location. Please enter a valid address or coordinates.");
    } finally {
      setSearching(false);
    }
  };

  // Sort hospitals by distance (shortest first) before rendering
  const sortedHospitals = [...hospitals].sort((a, b) => {
    // Extract numeric value in meters or kilometers
    const parseDistance = (d: string | undefined) => {
      if (!d) return Number.MAX_SAFE_INTEGER;
      if (d.endsWith('km')) return parseFloat(d) * 1000;
      if (d.endsWith('m')) return parseFloat(d);
      return Number.MAX_SAFE_INTEGER;
    };
    return parseDistance(a.distance) - parseDistance(b.distance);
  });

  // Filter hospitals by recommended specialty
  const filteredHospitals = sortedHospitals.filter(hospital => {
    if (!specialty || specialty === '') return true; // Show all if no specialty specified
    
    const hospitalName = hospital.name.toLowerCase();
    const hospitalAddress = hospital.address.toLowerCase();
    const specialtyLower = specialty.toLowerCase();
    
    // Check if hospital name or address contains the specialty
    return hospitalName.includes(specialtyLower) || 
           hospitalAddress.includes(specialtyLower) ||
           // Common specialty mappings
           (specialtyLower.includes('cardiology') && (hospitalName.includes('heart') || hospitalName.includes('cardiac'))) ||
           (specialtyLower.includes('orthopedic') && (hospitalName.includes('bone') || hospitalName.includes('joint') || hospitalName.includes('ortho'))) ||
           (specialtyLower.includes('pediatric') && (hospitalName.includes('child') || hospitalName.includes('pediatric') || hospitalName.includes('kids'))) ||
           (specialtyLower.includes('emergency') && (hospitalName.includes('emergency') || hospitalName.includes('trauma') || hospitalName.includes('urgent'))) ||
           (specialtyLower.includes('neurology') && (hospitalName.includes('neuro') || hospitalName.includes('brain') || hospitalName.includes('stroke'))) ||
           (specialtyLower.includes('oncology') && (hospitalName.includes('cancer') || hospitalName.includes('oncology') || hospitalName.includes('tumor'))) ||
           (specialtyLower.includes('dermatology') && (hospitalName.includes('skin') || hospitalName.includes('dermatology'))) ||
           (specialtyLower.includes('psychiatry') && (hospitalName.includes('psych') || hospitalName.includes('mental') || hospitalName.includes('psychiatric')));
  });

  // Fallback: If no hospitals for specialty, show all hospitals and a message
  const showAllHospitalsFallback = filteredHospitals.length === 0 && sortedHospitals.length > 0;
  const hospitalsToShow = showAllHospitalsFallback ? sortedHospitals : filteredHospitals;

  // Helper to build Google Maps search URL
  const getGoogleMapsSearchUrl = () => {
    let query = 'hospitals';
    if (specialty && specialty.trim() !== '' && !showAllHospitalsFallback) {
      query = `${specialty} hospitals`;
    }
    let locationStr = '';
    if (locationName) {
      locationStr = `+near+${encodeURIComponent(locationName)}`;
    } else if (currentLocation) {
      locationStr = `+near+${currentLocation.lat},${currentLocation.lng}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}${locationStr}`;
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">{locationStatus}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-center text-red-500">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
        <div className="flex flex-col gap-2 mt-2 items-center">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs sm:text-sm w-full max-w-xs"
            onClick={() => window.open('https://www.openstreetmap.org/search?query=hospital', '_blank')}
          >
            Search Hospitals on OpenStreetMap
          </Button>
          <Button
            size="sm"
            className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
            onClick={async () => {
              setError(null); // Clear error immediately on retry
              setSearching(true);
              setLocationStatus("Getting your current location...");
              if (!navigator.geolocation) {
                setError("Geolocation is not supported by your browser.");
                setSearching(false);
                return;
              }
              try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000
                  });
                });
                const userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setCurrentLocation(userLocation);
                try {
                  const placeName = await geoapifyService.getLocationName(userLocation);
                  setLocationName(placeName);
                  setLocationStatus(`Found your location: ${placeName}`);
                } catch (error) {
                  setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
                }
                fetchHospitals(userLocation);
              } catch (error: any) {
                setLocationStatus("Could not get your location");
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    setError("Location access denied. Please allow location access in your browser settings.");
                    break;
                  case error.POSITION_UNAVAILABLE:
                    setError("Location information unavailable. Please try again.");
                    break;
                  case error.TIMEOUT:
                    setError("Location request timed out. Please try again.");
                    break;
                  default:
                    setError("Unable to get location. Please enter manually.");
                    break;
                }
              } finally {
                setSearching(false);
              }
            }}
            disabled={searching}
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Use My Location
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4">
        {/* Manual location input and auto detect */}
        <div className="flex flex-col gap-2 items-stretch mb-2 px-1 sm:px-2">
          {/* Specialty Display */}
          {specialty && specialty.trim() !== '' && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Showing hospitals for: <strong>{specialty}</strong></span>
              </div>
            </div>
          )}
          
          {/* Current Location Display */}
          {currentLocation && (
            <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {locationName ? 
                    `Searching near: ${locationName}` : 
                    `Searching near: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  }
                </span>
              </div>
            </div>
          )}
          
          <input
            type="text"
            value={manualLocation}
            onChange={e => setManualLocation(e.target.value)}
            placeholder="Enter address or lat,lng to search different location"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            disabled={searching}
            style={{ minWidth: 0 }}
          />
          <div className="flex flex-row gap-2 w-full">
            <Button
              size="sm"
              onClick={handleManualSearch}
              disabled={searching || !manualLocation.trim()}
              className="flex-1 items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2"
            >
              <Search className="w-3 h-3 sm:w-4 sm:h-4" />
              Search
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setError(null); // Clear error immediately on retry
                setSearching(true);
                setLocationStatus("Getting your current location...");
                
                if (!navigator.geolocation) {
                  setError("Geolocation is not supported by your browser.");
                  setSearching(false);
                  return;
                }

                try {
                  // Check permission status first
                  if (navigator.permissions) {
                    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                    console.log('Permission status:', permissionStatus.state);
                    
                    if (permissionStatus.state === 'denied') {
                      setError("Location access denied. Please allow location access in your browser settings.");
                      setSearching(false);
                      return;
                    }
                  }

                  // Use a promise-based approach to better handle the permission prompt
                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                      enableHighAccuracy: true,
                      timeout: 15000,
                      maximumAge: 300000
                    });
                  });
                  
                  const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  
                  setCurrentLocation(userLocation);
                  
                  // Get the city/place name
                  try {
                    const placeName = await geoapifyService.getLocationName(userLocation);
                    setLocationName(placeName);
                    setLocationStatus(`Found your location: ${placeName}`);
                  } catch (error) {
                    console.error('Error getting location name:', error);
                    setLocationStatus(`Found your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
                  }
                  
                  fetchHospitals(userLocation);
                } catch (error: any) {
                  console.error('Geolocation error:', error);
                  setLocationStatus("Could not get your location");
                  
                  // Handle different types of geolocation errors
                  switch (error.code) {
                    case error.PERMISSION_DENIED:
                      setError("Location access denied. Please allow location access in your browser settings.");
                      break;
                    case error.POSITION_UNAVAILABLE:
                      setError("Location information unavailable. Please try again.");
                      break;
                    case error.TIMEOUT:
                      setError("Location request timed out. Please try again.");
                      break;
                    default:
                      setError("Unable to get location. Please enter manually.");
                      break;
                  }
                } finally {
                  setSearching(false);
                }
              }}
              disabled={searching}
              className="flex-1 items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2"
            >
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              Use My Location
            </Button>
          </div>
        </div>
        {/* Hospital cards */}
        <div className="grid gap-4 sm:gap-6 px-2 sm:px-4 bg-black rounded-xl">
          {hospitalsToShow.length === 0 ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <MapPin className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-600" />
              <p className="text-sm sm:text-base">No hospitals found in your area</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 text-xs sm:text-sm"
                onClick={() => window.open(getGoogleMapsSearchUrl(), '_blank')}
              >
                Search on Google Maps
              </Button>
            </div>
          ) : (
            <>
              {showAllHospitalsFallback && (
                <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md mb-2">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  No hospitals found for <strong>{specialty}</strong>. Showing all nearby hospitals instead.
                </div>
              )}
              {hospitalsToShow.map((hospital, index) => (
                <Card key={`${hospital.name}-${hospital.address}-${hospital.distance}-${index}`} className="border border-gray-700 shadow-md hover:shadow-xl transition-all duration-200 rounded-xl overflow-hidden bg-black text-gray-100">
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base break-words">
                          {hospital.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                          {hospital.address}
                        </p>
                        <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {hospital.rating > 0 && (
                            <div className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {hospital.rating}
                            </div>
                          )}
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                            {hospital.distance}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCallHospital(hospital.phone || '')}
                        className="w-full border-green-500 text-green-700 hover:bg-green-50 flex items-center justify-center text-xs sm:text-sm py-2"
                        disabled={!hospital.phone || hospital.phone === 'Phone not available'}
                        title={hospital.phone && hospital.phone !== 'Phone not available' ? `Call ${hospital.phone}` : 'Phone number not available'}
                      >
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
                        {hospital.phone && hospital.phone !== 'Phone not available' ? 'Call' : 'Not Available'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareWhatsApp(hospital)}
                        className="w-full border-green-500 text-green-700 hover:bg-green-50 flex items-center justify-center text-xs sm:text-sm py-2"
                        title={hospital.phone && hospital.phone !== 'Phone not available' ? `WhatsApp ${hospital.phone}` : 'WhatsApp message'}
                      >
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOnMap(hospital)}
                        className="w-full border-blue-500 text-blue-700 hover:bg-blue-50 flex items-center justify-center text-xs sm:text-sm py-2"
                      >
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-500" />
                        View on Map
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalRecommendations;
