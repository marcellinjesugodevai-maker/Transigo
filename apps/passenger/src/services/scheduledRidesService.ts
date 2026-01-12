// =============================================
// TRANSIGO - SCHEDULED RIDES SERVICE (Réservations)
// =============================================

import { supabase } from './supabaseService';

export interface ScheduledRideDB {
    id: string;
    user_id: string;
    user_phone?: string;
    driver_id?: string;
    driver_name?: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lon: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lon: number;
    scheduled_date: string;
    scheduled_time: string;
    vehicle_type: string;
    estimated_price: number;
    final_price?: number;
    status: 'pending' | 'confirmed' | 'driver_on_way' | 'in_progress' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'refunded';
    payment_method?: string;
    recurring_ride_id?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateScheduledRideInput {
    pickup: { address: string; lat: number; lon: number };
    dropoff: { address: string; lat: number; lon: number };
    scheduledDate: string; // YYYY-MM-DD
    scheduledTime: string; // HH:MM
    vehicleType: string;
    estimatedPrice: number;
    paymentMethod?: string;
}

export const scheduledRidesService = {
    /**
     * Récupérer toutes les réservations de l'utilisateur
     */
    getMyScheduledRides: async (): Promise<{ rides: ScheduledRideDB[]; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('scheduled_rides')
                .select('*')
                .eq('user_id', user.id)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return { rides: data || [] };
        } catch (error) {
            console.error('getMyScheduledRides error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Récupérer les réservations à venir
     */
    getUpcomingRides: async (): Promise<{ rides: ScheduledRideDB[]; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('scheduled_rides')
                .select('*')
                .eq('user_id', user.id)
                .gte('scheduled_date', today)
                .in('status', ['pending', 'confirmed', 'driver_on_way'])
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return { rides: data || [] };
        } catch (error) {
            console.error('getUpcomingRides error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Créer une nouvelle réservation
     */
    createScheduledRide: async (input: CreateScheduledRideInput): Promise<{ ride?: ScheduledRideDB; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('scheduled_rides')
                .insert({
                    user_id: user.id,
                    pickup_address: input.pickup.address,
                    pickup_lat: input.pickup.lat,
                    pickup_lon: input.pickup.lon,
                    dropoff_address: input.dropoff.address,
                    dropoff_lat: input.dropoff.lat,
                    dropoff_lon: input.dropoff.lon,
                    scheduled_date: input.scheduledDate,
                    scheduled_time: input.scheduledTime,
                    vehicle_type: input.vehicleType,
                    estimated_price: input.estimatedPrice,
                    payment_method: input.paymentMethod || 'wallet',
                })
                .select()
                .single();

            if (error) throw error;
            return { ride: data };
        } catch (error) {
            console.error('createScheduledRide error:', error);
            return { error };
        }
    },

    /**
     * Annuler une réservation
     */
    cancelScheduledRide: async (rideId: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { error } = await supabase
                .from('scheduled_rides')
                .update({ status: 'cancelled' })
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('cancelScheduledRide error:', error);
            return { success: false, error };
        }
    },

    /**
     * Récupérer une réservation par ID
     */
    getScheduledRideById: async (rideId: string): Promise<{ ride?: ScheduledRideDB; error?: any }> => {
        try {
            const { data, error } = await supabase
                .from('scheduled_rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (error) throw error;
            return { ride: data };
        } catch (error) {
            console.error('getScheduledRideById error:', error);
            return { error };
        }
    },

    /**
     * Souscrire aux mises à jour d'une réservation
     */
    subscribeToRide: (
        rideId: string,
        onUpdate: (ride: ScheduledRideDB) => void
    ) => {
        return supabase
            .channel(`scheduled_ride_${rideId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'scheduled_rides', filter: `id=eq.${rideId}` },
                (payload) => {
                    if (payload.new) {
                        onUpdate(payload.new as ScheduledRideDB);
                    }
                }
            )
            .subscribe();
    },

    // ========== CÔTÉ CHAUFFEUR ==========

    /**
     * Récupérer les réservations disponibles pour les chauffeurs
     */
    getAvailableForDrivers: async (): Promise<{ rides: ScheduledRideDB[]; error?: any }> => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('scheduled_rides')
                .select('*')
                .gte('scheduled_date', today)
                .eq('status', 'pending')
                .is('driver_id', null)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return { rides: data || [] };
        } catch (error) {
            console.error('getAvailableForDrivers error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Accepter une réservation (chauffeur)
     */
    acceptScheduledRide: async (rideId: string, driverId: string, driverName: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { error } = await supabase
                .from('scheduled_rides')
                .update({
                    driver_id: driverId,
                    driver_name: driverName,
                    status: 'confirmed',
                })
                .eq('id', rideId)
                .eq('status', 'pending');

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('acceptScheduledRide error:', error);
            return { success: false, error };
        }
    },

    /**
     * Récupérer les réservations acceptées par un chauffeur
     */
    getDriverScheduledRides: async (driverId: string): Promise<{ rides: ScheduledRideDB[]; error?: any }> => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('scheduled_rides')
                .select('*')
                .eq('driver_id', driverId)
                .gte('scheduled_date', today)
                .in('status', ['confirmed', 'driver_on_way', 'in_progress'])
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return { rides: data || [] };
        } catch (error) {
            console.error('getDriverScheduledRides error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Mettre à jour le statut (chauffeur)
     */
    updateRideStatus: async (rideId: string, status: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { error } = await supabase
                .from('scheduled_rides')
                .update({ status })
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('updateRideStatus error:', error);
            return { success: false, error };
        }
    },
};

export default scheduledRidesService;
