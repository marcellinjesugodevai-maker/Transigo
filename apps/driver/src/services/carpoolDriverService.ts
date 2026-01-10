// Driver Carpool Service (Supabase interactions)
import { supabase } from './supabaseService';

export const carpoolDriverService = {
    // Subscribe to newly created shared rides (status = 'searching')
    subscribeToSharedRides: (callback: (ride: any) => void) => {
        return supabase
            .channel('shared-rides')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shared_rides',
                    filter: 'status=eq.searching',
                },
                (payload) => callback(payload.new)
            )
            .subscribe();
    },

    // Accept a shared ride (driver takes the ride)
    acceptSharedRide: async (sharedRideId: string, driverId: string) => {
        const { data, error } = await supabase
            .from('shared_rides')
            .update({
                driver_id: driverId,
                status: 'driver_assigned',
                updated_at: new Date().toISOString(),
            })
            .eq('id', sharedRideId)
            .eq('status', 'searching') // ensure not already taken
            .select()
            .single();
        return { ride: data, error };
    },

    // Update ride status (e.g., in_progress, completed, cancelled)
    updateRideStatus: async (sharedRideId: string, status: string) => {
        const updates: any = { status };
        if (status === 'in_progress') updates.started_at = new Date().toISOString();
        if (status === 'completed') updates.completed_at = new Date().toISOString();
        if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('shared_rides')
            .update(updates)
            .eq('id', sharedRideId)
            .select()
            .single();
        return { ride: data, error };
    },

    // Get passengers for a shared ride
    getRidePassengers: async (sharedRideId: string) => {
        const { data, error } = await supabase
            .from('shared_ride_passengers')
            .select('*')
            .eq('shared_ride_id', sharedRideId);
        return { passengers: data, error };
    },

    // Publish a driver's route for dynamic carpooling
    publishRoute: async (params: {
        driverId: string;
        driverName: string;
        driverPhone: string;
        pickup: { address: string; lat: number; lon: number };
        dropoff: { address: string; lat: number; lon: number };
        trajectory: { latitude: number; longitude: number }[];
        basePrice: number;
        vehicleType?: string;
        destinationMode: 'home' | 'custom';
    }) => {
        const { data, error } = await supabase
            .from('shared_rides')
            .insert({
                creator_id: params.driverId,
                driver_id: params.driverId, // Ajout de la colonne driver_id
                driver_name: params.driverName,
                driver_phone: params.driverPhone,
                pickup_address: params.pickup.address,
                pickup_lat: params.pickup.lat,
                pickup_lon: params.pickup.lon,
                dropoff_address: params.dropoff.address,
                dropoff_lat: params.dropoff.lat,
                dropoff_lon: params.dropoff.lon,
                route_trajectory: params.trajectory,
                current_lat: params.pickup.lat,
                current_lon: params.pickup.lon,
                base_price: params.basePrice,
                current_price_per_person: params.basePrice,
                vehicle_type: params.vehicleType || 'standard',
                status: 'driver_assigned',
                ride_type: 'driver_planned', // Préciser que c'est une offre chauffeur
                destination_mode: params.destinationMode,
                is_accepting_passengers: true
            })
            .select()
            .single();
        return { ride: data, error };
    },

    // Update driver's current position on the shared ride trajectory
    updateRouteProgress: async (sharedRideId: string, lat: number, lon: number) => {
        const { error } = await supabase
            .from('shared_rides')
            .update({
                current_lat: lat,
                current_lon: lon,
                updated_at: new Date().toISOString()
            })
            .eq('id', sharedRideId);
        return { error };
    },

    // Subscribe to new passengers for a shared ride
    subscribeToPassengers: (sharedRideId: string, onNewPassenger: (passenger: any) => void) => {
        return supabase
            .channel(`passengers_${sharedRideId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shared_ride_passengers',
                    filter: `shared_ride_id=eq.${sharedRideId}`,
                },
                (payload) => onNewPassenger(payload.new)
            )
            .subscribe();
    },
};
