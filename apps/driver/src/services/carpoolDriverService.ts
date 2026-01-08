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
};
