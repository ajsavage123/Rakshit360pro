
import { supabase } from './supabase'
import { geoapifyService, Location, Hospital } from './geoapify'

export interface EnhancedHospital extends Hospital {
  specialty: string[]
  opening_hours: string
  location?: { lat: number; lng: number }
  source: 'supabase' | 'geoapify'
}

class HospitalService {
  // Calculate distance between two points using Haversine formula
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180
    const φ2 = point2.lat * Math.PI / 180
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  async searchNearbyHospitals(location: Location, specialty?: string, radius: number = 25000): Promise<EnhancedHospital[]> {
    const hospitals: EnhancedHospital[] = []

    try {
      // 1. First, get hospitals from Supabase database using PostGIS
      const userPoint = `SRID=4326;POINT(${location.lng} ${location.lat})`
      
      let query = supabase
        .from('hospitals')
        .select(`
          id, name, address, phone, rating, specialty, opening_hours,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude,
          ST_Distance(location, ST_GeogFromText('${userPoint}')) as distance_meters
        `)
        .filter('location', 'not.is', null)
        .lte('distance_meters', radius)

      // Add specialty filter if provided
      if (specialty) {
        query = query.contains('specialty', [specialty])
      }

      const { data: supabaseHospitals, error } = await query
        .order('distance_meters', { ascending: true })
        .limit(20)

      if (error) {
        console.warn('Supabase query failed:', error)
      } else if (supabaseHospitals) {
        supabaseHospitals.forEach(hospital => {
          hospitals.push({
            id: hospital.id,
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone,
            rating: hospital.rating,
            distance: this.formatDistance(hospital.distance_meters),
            specialty: hospital.specialty,
            opening_hours: hospital.opening_hours,
            location: { lat: hospital.latitude, lng: hospital.longitude },
            source: 'supabase'
          })
        })
      }

      // 2. If we have fewer than 5 hospitals from Supabase, supplement with Geoapify
      if (hospitals.length < 5) {
        try {
          const geoapifyHospitals = await geoapifyService.searchHospitals(location, specialty)
          
          geoapifyHospitals.forEach(geoHospital => {
            // Avoid duplicates by checking if hospital already exists
            const isDuplicate = hospitals.some(existing => 
              existing.name.toLowerCase() === geoHospital.name.toLowerCase() ||
              existing.address.toLowerCase() === geoHospital.address.toLowerCase()
            )

            if (!isDuplicate) {
              hospitals.push({
                ...geoHospital,
                specialty: specialty ? [specialty] : ['General Medicine'],
                opening_hours: 'Hours not available',
                location: { lat: 0, lng: 0 }, // Will be geocoded if needed
                source: 'geoapify'
              })
            }
          })
        } catch (error) {
          console.warn('Geoapify search failed:', error)
        }
      }

      // Sort by distance and return
      return hospitals
        .sort((a, b) => {
          const distanceA = parseFloat(a.distance?.replace(/[^\d.]/g, '') || '0')
          const distanceB = parseFloat(b.distance?.replace(/[^\d.]/g, '') || '0')
          return distanceA - distanceB
        })
        .slice(0, 20) // Limit to 20 results

    } catch (error) {
      console.error('Hospital search failed:', error)
      // Fallback to Geoapify only
      const geoapifyHospitals = await geoapifyService.searchHospitals(location, specialty)
      return geoapifyHospitals.map(hospital => ({
        ...hospital,
        specialty: specialty ? [specialty] : ['General Medicine'],
        opening_hours: 'Hours not available',
        location: { lat: 0, lng: 0 },
        source: 'geoapify' as const
      }))
    }
  }

  async addHospital(hospitalData: {
    name: string
    address: string
    phone: string
    specialty: string[]
    opening_hours: string
    latitude: number
    longitude: number
    rating?: number
  }) {
    const { data, error } = await supabase
      .rpc('insert_hospital_with_location', {
        hospital_name: hospitalData.name,
        hospital_address: hospitalData.address,
        hospital_phone: hospitalData.phone,
        hospital_specialty: hospitalData.specialty,
        hospital_opening_hours: hospitalData.opening_hours,
        hospital_longitude: hospitalData.longitude,
        hospital_latitude: hospitalData.latitude,
        hospital_rating: hospitalData.rating || 0
      })

    if (error) {
      throw new Error(`Failed to add hospital: ${error.message}`)
    }

    return data
  }
}

export const hospitalService = new HospitalService()
