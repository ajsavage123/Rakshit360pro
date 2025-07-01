export interface Location {
  lat: number;
  lng: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  distance?: string;
  openingHours?: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
}

// Get API key from environment variable
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '2b8e5b5d63744b3383ef4215ecb21ec7';

// If using placeholder, show instructions
if (GEOAPIFY_API_KEY === 'YOUR_API_KEY_HERE') {
  console.warn('⚠️ Please add your Geoapify API key to .env file: VITE_GEOAPIFY_API_KEY=your_actual_api_key');
  console.warn('📝 Get free API key from: https://www.geoapify.com/');
}

class GeoapifyService {
  private apiKey: string;

  constructor() {
    this.apiKey = GEOAPIFY_API_KEY;
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async searchHospitals(location: Location, specialty?: string): Promise<Hospital[]> {
    const hospitals: Hospital[] = [];
    const searchRadius = 10000; // 10km radius for nearby hospitals only

    try {
      // Method 1: Try Geoapify Places API first
      if (this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE') {
        try {
          // Use circle filter for proper nearby search - only hospitals, not pharmacies or nursing homes
          const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${location.lng},${location.lat},${searchRadius}&limit=20&apiKey=${this.apiKey}`;

          const data = await this.makeRequest(url);

          if (data.features) {
            data.features.forEach((feature: any) => {
              const properties = feature.properties;
              const hospitalLat = feature.geometry.coordinates[1];
              const hospitalLng = feature.geometry.coordinates[0];

              // Filter out non-hospitals (pharmacies, nursing homes, clinics)
              const name = (properties.name || '').toLowerCase();
              const category = (properties.categories || []).join(' ').toLowerCase();

              // Skip if it's a pharmacy, nursing home, clinic, or medical center that's not a hospital
              if (name.includes('pharmacy') || name.includes('chemist') || name.includes('drug store') ||
                  name.includes('nursing home') || name.includes('care home') || name.includes('assisted living') ||
                  category.includes('pharmacy') || category.includes('nursing') || 
                  (name.includes('clinic') && !name.includes('hospital')) ||
                  (name.includes('medical center') && !name.includes('hospital') && !name.includes('medical centre'))) {
                return; // Skip this entry
              }

              const distance = this.calculateDistance(location, {
                lat: hospitalLat,
                lng: hospitalLng
              });

              // Only include hospitals within radius
              if (distance <= searchRadius) {
                // Build comprehensive address
                let address = '';
                if (properties.formatted) {
                  address = properties.formatted;
                } else {
                  const addressParts = [];
                  if (properties.housenumber) addressParts.push(properties.housenumber);
                  if (properties.street) addressParts.push(properties.street);
                  if (properties.district) addressParts.push(properties.district);
                  if (properties.city) addressParts.push(properties.city);
                  if (properties.state) addressParts.push(properties.state);
                  if (properties.postcode) addressParts.push(properties.postcode);
                  address = addressParts.join(', ') || 'Address not available';
                }

                hospitals.push({
                  id: feature.properties.place_id || `geoapify_${Date.now()}_${Math.random()}`,
                  name: properties.name || 'Hospital',
                  address: address,
                  phone: properties.phone || properties.contact_phone || 'Phone not available',
                  rating: properties.rating || 0,
                  distance: this.formatDistance(distance),
                  openingHours: properties.opening_hours || 'Hours not available'
                });
              }
            });
          }
        } catch (error) {
          console.warn('Geoapify Places API failed, trying OpenStreetMap:', error);
        }
      }

      // Method 2: OpenStreetMap Overpass API as fallback
      if (hospitals.length === 0) {
        try {
          const query = `
            [out:json][timeout:25];
            (
              node["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
              way["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
              relation["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
            );
            out body;
            >;
            out skel qt;
          `;

          const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
          const data = await this.makeRequest(url);

          if (data.elements) {
            data.elements.forEach((element: any) => {
              if (element.tags && element.tags.amenity === 'hospital' && (element.lat || element.center?.lat)) {
                const hospitalLat = element.lat || element.center?.lat;
                const hospitalLng = element.lon || element.center?.lon;

                // Filter out non-hospitals
                const name = (element.tags.name || '').toLowerCase();
                const healthcare = (element.tags.healthcare || '').toLowerCase();

                // Skip if it's a pharmacy, nursing home, clinic, etc.
                if (name.includes('pharmacy') || name.includes('chemist') || name.includes('drug store') ||
                    name.includes('nursing home') || name.includes('care home') || name.includes('assisted living') ||
                    healthcare.includes('pharmacy') || healthcare.includes('nursing') ||
                    element.tags.amenity === 'pharmacy' || element.tags.amenity === 'nursing_home' ||
                    (name.includes('clinic') && !name.includes('hospital'))) {
                  return; // Skip this entry
                }

                const distance = this.calculateDistance(location, {
                  lat: hospitalLat,
                  lng: hospitalLng
                });

                // Only include hospitals strictly within radius
                if (distance <= searchRadius) {
                  // Build comprehensive address from OSM tags
                  let address = '';
                  const addressParts = [];

                  if (element.tags['addr:housenumber']) addressParts.push(element.tags['addr:housenumber']);
                  if (element.tags['addr:street']) addressParts.push(element.tags['addr:street']);
                  if (element.tags['addr:suburb']) addressParts.push(element.tags['addr:suburb']);
                  if (element.tags['addr:city']) addressParts.push(element.tags['addr:city']);
                  if (element.tags['addr:state']) addressParts.push(element.tags['addr:state']);
                  if (element.tags['addr:postcode']) addressParts.push(element.tags['addr:postcode']);

                  address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

                  hospitals.push({
                    id: `osm_${element.id}`,
                    name: element.tags.name || element.tags['name:en'] || 'Hospital',
                    address: address,
                    phone: element.tags.phone || element.tags['contact:phone'] || 'Phone not available',
                    rating: 0,
                    distance: this.formatDistance(distance),
                    openingHours: element.tags.opening_hours || 'Hours not available'
                  });
                }
              }
            });
          }
        } catch (error) {
          console.warn('OpenStreetMap API failed:', error);
        }
      }

      // Method 3: Additional search using Nominatim if still no results
      if (hospitals.length === 0) {
        try {
          const searchQuery = specialty ? `hospital ${specialty}` : 'hospital';
          // Use bounded search within 10km radius  
          const latDegree = searchRadius / 111000;
          const lngDegree = searchRadius / (111000 * Math.cos(location.lat * Math.PI / 180));
          const bounds = {
            minLat: location.lat - latDegree,
            maxLat: location.lat + latDegree,
            minLng: location.lng - lngDegree,
            maxLng: location.lng + lngDegree
          };
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=20&addressdetails=1&viewbox=${bounds.minLng},${bounds.maxLat},${bounds.maxLng},${bounds.minLat}&bounded=1`;

          const data = await this.makeRequest(url);

          if (Array.isArray(data)) {
            data.forEach((place: any) => {
              if ((place.type === 'hospital' || place.class === 'amenity') && place.lat && place.lon) {
                const hospitalLat = parseFloat(place.lat);
                const hospitalLng = parseFloat(place.lon);

                // Filter out non-hospitals
                const displayName = (place.display_name || '').toLowerCase();
                const placeType = (place.type || '').toLowerCase();

                // Skip if it's a pharmacy, nursing home, clinic, etc.
                if (displayName.includes('pharmacy') || displayName.includes('chemist') || displayName.includes('drug store') ||
                    displayName.includes('nursing home') || displayName.includes('care home') || displayName.includes('assisted living') ||
                    placeType === 'pharmacy' || placeType === 'nursing_home' ||
                    (displayName.includes('clinic') && !displayName.includes('hospital')) ||
                    (displayName.includes('medical center') && !displayName.includes('hospital'))) {
                  return; // Skip this entry
                }

                const distance = this.calculateDistance(location, {
                  lat: hospitalLat,
                  lng: hospitalLng
                });

                // Strict radius filtering
                if (distance <= searchRadius) {
                  // Extract hospital name (first part before comma)
                  const hospitalName = place.display_name.split(',')[0].trim() || 'Hospital';

                  // Build better address from address details
                  let address = '';
                  if (place.address) {
                    const addressParts = [];
                    if (place.address.house_number) addressParts.push(place.address.house_number);
                    if (place.address.road) addressParts.push(place.address.road);
                    if (place.address.suburb) addressParts.push(place.address.suburb);
                    if (place.address.city || place.address.town || place.address.village) {
                      addressParts.push(place.address.city || place.address.town || place.address.village);
                    }
                    if (place.address.state) addressParts.push(place.address.state);
                    if (place.address.postcode) addressParts.push(place.address.postcode);

                    address = addressParts.length > 0 ? addressParts.join(', ') : place.display_name;
                  } else {
                    address = place.display_name || 'Address not available';
                  }

                  hospitals.push({
                    id: `nominatim_${place.place_id}`,
                    name: hospitalName,
                    address: address,
                    phone: 'Phone not available',
                    rating: 0,
                    distance: this.formatDistance(distance),
                    openingHours: 'Hours not available'
                  });
                }
              }
            });
          }
        } catch (error) {
          console.warn('Nominatim search failed:', error);
        }
      }

    } catch (error) {
      console.error('All hospital search methods failed:', error);
      throw new Error('Failed to fetch hospital data');
    }

    // Sort hospitals by distance (closest first) and remove duplicates
    const uniqueHospitals = hospitals.filter((hospital, index, self) =>
      index === self.findIndex(h => h.name === hospital.name && h.address === hospital.address)
    );

    return uniqueHospitals.sort((a, b) => {
      const distanceA = parseFloat(a.distance?.replace(/[^\d.]/g, '') || '0');
      const distanceB = parseFloat(b.distance?.replace(/[^\d.]/g, '') || '0');
      return distanceA - distanceB;
    });
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Try Geoapify Geocoding first
      if (this.apiKey) {
        try {
          const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${this.apiKey}`;
          const data = await this.makeRequest(url);

          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0]
            };
          }
        } catch (error) {
          console.warn('Geoapify geocoding failed, trying Nominatim:', error);
        }
      }

      // Fallback to Nominatim
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const data = await this.makeRequest(url);

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  async getLocationName(location: Location): Promise<string> {
    try {
      // Try Geoapify Reverse Geocoding first
      if (this.apiKey) {
        try {
          const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${location.lat}&lon=${location.lng}&apiKey=${this.apiKey}`;
          const data = await this.makeRequest(url);

          if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            return properties.city || properties.town || properties.village || properties.county || 'Unknown location';
          }
        } catch (error) {
          console.warn('Geoapify reverse geocoding failed, trying Nominatim:', error);
        }
      }

      // Fallback to Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`;
      const data = await this.makeRequest(url);

      if (data.address) {
        return data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown location';
      }

      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return 'Unknown location';
    }
  }

  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}

export const geoapifyService = new GeoapifyService();