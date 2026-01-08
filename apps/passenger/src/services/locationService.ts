/**
 * Service de localisation utilisant OpenStreetMap (Nominatim & OSRM)
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

export interface LocationSearchResult {
    id: string;
    display_name: string;
    latitude: number;
    longitude: number;
}

export interface RouteResult {
    coordinates: { latitude: number; longitude: number }[];
    distance: number; // en km
    duration: number; // en minutes
}

export const locationService = {
    /**
     * Recherche d'adresses (Autocomplete via Nominatim)
     */
    searchPlaces: async (query: string): Promise<LocationSearchResult[]> => {
        if (!query || query.length < 3) return [];

        try {
            // On limite à Abidjan/Côte d'Ivoire pour plus de pertinence si possible
            const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=ci`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TransiGo-App/1.0', // Important pour les politiques d'OSM
                }
            });
            const data = await response.json();

            return data.map((item: any) => ({
                id: item.place_id.toString(),
                display_name: item.display_name,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
            }));
        } catch (error) {
            console.error('Erreur recherche OSM:', error);
            return [];
        }
    },

    /**
     * Reverse Geocoding (Coordonnées -> Adresse)
     */
    reverseGeocode: async (lat: number, lon: number): Promise<string> => {
        try {
            const url = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TransiGo-App/1.0',
                }
            });
            const data = await response.json();
            return data.display_name || 'Adresse inconnue';
        } catch (error) {
            console.error('Erreur reverse geocoding OSM:', error);
            return 'Erreur de localisation';
        }
    },

    /**
     * Calcul d'itinéraire (OSRM)
     */
    getRoute: async (startLat: number, startLon: number, endLat: number, endLon: number): Promise<RouteResult | null> => {
        try {
            const url = `${OSRM_BASE_URL}/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                return null;
            }

            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((c: any) => ({
                latitude: c[1],
                longitude: c[0],
            }));

            return {
                coordinates,
                distance: route.distance / 1000, // mètres -> km
                duration: route.duration / 60, // secondes -> minutes
            };
        } catch (error) {
            console.error('Erreur itinéraire OSRM:', error);
            return null;
        }
    }
};
