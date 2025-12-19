/**
 * Geocoding and Distance Calculation Utilities
 * For filtering stints by distance from professional's location
 */

// Coordinate type
export interface Coordinates {
    lat: number;
    lng: number;
}

// Static geocoding data for East African cities
// In production, you could use Google Maps Geocoding API or OpenStreetMap Nominatim
export const CITY_COORDINATES: Record<string, Coordinates> = {
    // Kenya - Major Cities
    'Nairobi': { lat: -1.2921, lng: 36.8219 },
    'Mombasa': { lat: -4.0435, lng: 39.6682 },
    'Kisumu': { lat: -0.1022, lng: 34.7617 },
    'Eldoret': { lat: 0.5143, lng: 35.2698 },
    'Nakuru': { lat: -0.3031, lng: 36.0800 },
    'Thika': { lat: -1.0334, lng: 37.0692 },

    // Kenya - Other Towns
    'Malindi': { lat: -3.2138, lng: 40.1169 },
    'Nyeri': { lat: -0.4197, lng: 36.9553 },
    'Machakos': { lat: -1.5177, lng: 37.2634 },
    'Kisii': { lat: -0.6698, lng: 34.7675 },
    'Kitale': { lat: 1.0169, lng: 35.0062 },
    'Naivasha': { lat: -0.7172, lng: 36.4320 },
    'Nanyuki': { lat: 0.0065, lng: 37.0742 },
    'Garissa': { lat: -0.4536, lng: 39.6401 },
    'Kakamega': { lat: 0.2827, lng: 34.7519 },
    'Meru': { lat: 0.0500, lng: 37.6500 },
    'Kericho': { lat: -0.3689, lng: 35.2863 },
    'Embu': { lat: -0.5375, lng: 37.4594 },
    'Migori': { lat: -1.0634, lng: 34.4731 },
    'Bungoma': { lat: 0.5635, lng: 34.5606 },
    'Kiambu': { lat: -1.1714, lng: 36.8356 },
    'Ruiru': { lat: -1.1489, lng: 36.9606 },
    'Lamu': { lat: -2.2717, lng: 40.9020 },

    // Uganda
    'Kampala': { lat: 0.3476, lng: 32.5825 },
    'Entebbe': { lat: 0.0512, lng: 32.4637 },
    'Jinja': { lat: 0.4244, lng: 33.2041 },
    'Mbarara': { lat: -0.6072, lng: 30.6545 },
    'Gulu': { lat: 2.7747, lng: 32.2990 },
    'Lira': { lat: 2.2499, lng: 32.8999 },
    'Mbale': { lat: 1.0647, lng: 34.1797 },
    'Masaka': { lat: -0.3412, lng: 31.7319 },
    'Soroti': { lat: 1.7147, lng: 33.6111 },
    'Fort Portal': { lat: 0.6603, lng: 30.2750 },

    // Tanzania
    'Dar es Salaam': { lat: -6.7924, lng: 39.2083 },
    'Arusha': { lat: -3.3869, lng: 36.6830 },
    'Mwanza': { lat: -2.5164, lng: 32.9175 },
    'Dodoma': { lat: -6.1630, lng: 35.7516 },
    'Zanzibar': { lat: -6.1659, lng: 39.2026 },
    'Zanzibar City': { lat: -6.1659, lng: 39.2026 },
    'Tanga': { lat: -5.0689, lng: 39.0993 },
    'Moshi': { lat: -3.3350, lng: 37.3401 },
    'Morogoro': { lat: -6.8208, lng: 37.6602 },
    'Mbeya': { lat: -8.9094, lng: 33.4608 },
    'Tabora': { lat: -5.0167, lng: 32.8000 },

    // Rwanda
    'Kigali': { lat: -1.9403, lng: 29.8739 },
    'Butare': { lat: -2.5977, lng: 29.7394 },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate (lat, lng)
 * @param coord2 Second coordinate (lat, lng)
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers

    const lat1Rad = toRadians(coord1.lat);
    const lat2Rad = toRadians(coord2.lat);
    const deltaLat = toRadians(coord2.lat - coord1.lat);
    const deltaLng = toRadians(coord2.lng - coord1.lng);

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a city name
 * @param cityName Name of the city
 * @returns Coordinates or null if not found
 */
export function getCityCoordinates(cityName: string): Coordinates | null {
    // Try exact match first
    if (CITY_COORDINATES[cityName]) {
        return CITY_COORDINATES[cityName];
    }

    // Try case-insensitive match
    const normalizedCity = Object.keys(CITY_COORDINATES).find(
        city => city.toLowerCase() === cityName.toLowerCase()
    );

    if (normalizedCity) {
        return CITY_COORDINATES[normalizedCity];
    }

    return null;
}

/**
 * Get the user's current GPS location
 * @returns Promise with coordinates or null if unavailable/denied
 */
export function getCurrentLocation(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.log('Error getting location:', error.message);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // Cache location for 1 minute
            }
        );
    });
}

/**
 * Filter stints by distance from a location
 * @param stints Array of stints with city field
 * @param userLocation User's coordinates
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns Filtered stints with distance property added
 */
export function filterStintsByDistance(
    stints: any[],
    userLocation: Coordinates,
    maxDistanceKm: number
): any[] {
    return stints
        .map(stint => {
            const stintCoords = getCityCoordinates(stint.city);
            if (!stintCoords) {
                // If we can't geocode the stint location, include it but with a large distance
                return { ...stint, distance: Infinity, distanceUnknown: true };
            }

            const distance = calculateDistance(userLocation, stintCoords);
            return { ...stint, distance, distanceUnknown: false };
        })
        .filter(stint => stint.distance <= maxDistanceKm || stint.distanceUnknown)
        .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string
 */
export function formatDistance(distanceKm: number): string {
    if (!isFinite(distanceKm)) {
        return 'Unknown';
    }

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }

    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)}km`;
    }

    return `${Math.round(distanceKm)}km`;
}

/**
 * Get distance category label
 */
export function getDistanceCategory(distanceKm: number): 'nearby' | 'close' | 'moderate' | 'far' {
    if (distanceKm < 5) return 'nearby';
    if (distanceKm < 15) return 'close';
    if (distanceKm < 50) return 'moderate';
    return 'far';
}

/**
 * Distance filter thresholds
 */
export const DISTANCE_THRESHOLDS = {
    'near': 10,
    '20km': 20,
    '50km': 50,
    'any': Infinity,
} as const;
