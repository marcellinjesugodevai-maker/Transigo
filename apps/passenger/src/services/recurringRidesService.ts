// =============================================
// TRANSIGO - RECURRING RIDES SERVICE (Supabase)
// =============================================

import { supabase } from './supabaseService';

export interface RecurringRideDB {
    id: string;
    user_id: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lon: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lon: number;
    days_of_week: string[];
    departure_time: string;
    vehicle_type: string;
    preferred_driver_id?: string;
    preferred_driver_name?: string;
    price_per_ride: number;
    monthly_price?: number;
    estimated_rides_per_month: number;
    completed_rides: number;
    status: 'active' | 'paused' | 'expired' | 'cancelled';
    start_date: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRecurringRideInput {
    pickup: { address: string; lat: number; lon: number };
    dropoff: { address: string; lat: number; lon: number };
    daysOfWeek: string[];
    departureTime: string;
    vehicleType: string;
    pricePerRide: number;
    preferredDriverId?: string;
    preferredDriverName?: string;
}

export const recurringRidesService = {
    /**
     * Récupérer tous les trajets récurrents de l'utilisateur
     */
    getMyRecurringRides: async (): Promise<{ rides: RecurringRideDB[]; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('recurring_rides')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { rides: data || [] };
        } catch (error) {
            console.error('getMyRecurringRides error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Créer un nouveau trajet récurrent
     */
    createRecurringRide: async (input: CreateRecurringRideInput): Promise<{ ride?: RecurringRideDB; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Calculer le nombre estimé de trajets par mois
            const ridesPerWeek = input.daysOfWeek.length;
            const estimatedRidesPerMonth = ridesPerWeek * 4;
            const monthlyPrice = input.pricePerRide * estimatedRidesPerMonth;

            const { data, error } = await supabase
                .from('recurring_rides')
                .insert({
                    user_id: user.id,
                    pickup_address: input.pickup.address,
                    pickup_lat: input.pickup.lat,
                    pickup_lon: input.pickup.lon,
                    dropoff_address: input.dropoff.address,
                    dropoff_lat: input.dropoff.lat,
                    dropoff_lon: input.dropoff.lon,
                    days_of_week: input.daysOfWeek,
                    departure_time: input.departureTime,
                    vehicle_type: input.vehicleType,
                    preferred_driver_id: input.preferredDriverId || null,
                    preferred_driver_name: input.preferredDriverName || null,
                    price_per_ride: input.pricePerRide,
                    monthly_price: monthlyPrice,
                    estimated_rides_per_month: estimatedRidesPerMonth,
                })
                .select()
                .single();

            if (error) throw error;
            return { ride: data };
        } catch (error) {
            console.error('createRecurringRide error:', error);
            return { error };
        }
    },

    /**
     * Mettre à jour un trajet récurrent
     */
    updateRecurringRide: async (
        rideId: string,
        updates: Partial<CreateRecurringRideInput & { status: string }>
    ): Promise<{ success: boolean; error?: any }> => {
        try {
            const updateData: any = {};

            if (updates.pickup) {
                updateData.pickup_address = updates.pickup.address;
                updateData.pickup_lat = updates.pickup.lat;
                updateData.pickup_lon = updates.pickup.lon;
            }
            if (updates.dropoff) {
                updateData.dropoff_address = updates.dropoff.address;
                updateData.dropoff_lat = updates.dropoff.lat;
                updateData.dropoff_lon = updates.dropoff.lon;
            }
            if (updates.daysOfWeek) {
                updateData.days_of_week = updates.daysOfWeek;
                updateData.estimated_rides_per_month = updates.daysOfWeek.length * 4;
            }
            if (updates.departureTime) updateData.departure_time = updates.departureTime;
            if (updates.vehicleType) updateData.vehicle_type = updates.vehicleType;
            if (updates.pricePerRide) updateData.price_per_ride = updates.pricePerRide;
            if (updates.preferredDriverId) updateData.preferred_driver_id = updates.preferredDriverId;
            if (updates.preferredDriverName) updateData.preferred_driver_name = updates.preferredDriverName;
            if (updates.status) updateData.status = updates.status;

            const { error } = await supabase
                .from('recurring_rides')
                .update(updateData)
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('updateRecurringRide error:', error);
            return { success: false, error };
        }
    },

    /**
     * Mettre en pause / Reprendre un trajet
     */
    togglePause: async (rideId: string, currentStatus: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';

            const { error } = await supabase
                .from('recurring_rides')
                .update({ status: newStatus })
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('togglePause error:', error);
            return { success: false, error };
        }
    },

    /**
     * Supprimer un trajet récurrent
     */
    deleteRecurringRide: async (rideId: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { error } = await supabase
                .from('recurring_rides')
                .delete()
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('deleteRecurringRide error:', error);
            return { success: false, error };
        }
    },

    /**
     * Incrémenter le compteur de courses complétées
     */
    incrementCompletedRides: async (rideId: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { data: ride, error: fetchError } = await supabase
                .from('recurring_rides')
                .select('completed_rides')
                .eq('id', rideId)
                .single();

            if (fetchError) throw fetchError;

            const { error } = await supabase
                .from('recurring_rides')
                .update({ completed_rides: (ride?.completed_rides || 0) + 1 })
                .eq('id', rideId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('incrementCompletedRides error:', error);
            return { success: false, error };
        }
    },

    /**
     * Souscrire aux mises à jour (realtime)
     */
    subscribeToMyRides: (
        userId: string,
        onUpdate: (ride: RecurringRideDB) => void
    ) => {
        return supabase
            .channel(`recurring_rides_${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'recurring_rides', filter: `user_id=eq.${userId}` },
                (payload) => {
                    if (payload.new) {
                        onUpdate(payload.new as RecurringRideDB);
                    }
                }
            )
            .subscribe();
    }
};

export default recurringRidesService;
