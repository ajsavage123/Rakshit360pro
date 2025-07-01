declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  namespace places {
    class PlacesService {
      constructor(attrContainer: Map | Element);
      nearbySearch(
        request: {
          location: LatLng | LatLngLiteral;
          radius: number;
          type: string;
          keyword?: string;
        },
        callback: (
          results: PlaceResult[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
      getDetails(
        request: {
          placeId: string;
          fields: string[];
        },
        callback: (
          place: PlaceResult | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    interface PlaceResult {
      place_id?: string;
      name?: string;
      vicinity?: string;
      formatted_address?: string;
      formatted_phone_number?: string;
      rating?: number;
      geometry?: {
        location: LatLng;
      };
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }
  }

  namespace geometry {
    namespace spherical {
      function computeDistanceBetween(
        from: LatLng,
        to: LatLng
      ): number;
    }
  }
}

// Permissions API declarations
interface NavigatorPermissions {
  query(permissionDesc: { name: string }): Promise<PermissionStatus>;
}

interface PermissionStatus {
  state: 'granted' | 'denied' | 'prompt';
  onchange: ((this: PermissionStatus, ev: Event) => any) | null;
}

interface Navigator {
  permissions?: NavigatorPermissions;
} 