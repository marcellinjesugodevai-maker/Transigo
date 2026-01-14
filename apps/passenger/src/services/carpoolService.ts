// =============================================
// TRANSIGO - CARPOOL SERVICE
// =============================================

import { supabase } from './supabaseService';
import { SharedRide, SharedRidePassenger } from '@/stores/carpoolStore';

// Calculer la distance entre deux points (Haversine)
const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Calculer le prix par personne
const calculatePricePerPerson = (basePrice: number, passengerCount: number): number => {
    return Math.ceil(basePrice / passengerCount);
};

export const carpoolService = {
    /**
     * Récupérer une course covoiturage par ID
     */
    getRide: async (rideId: string): Promise<{ ride?: SharedRide; error?: any }> => {
        try {
            const { data, error } = await supabase
                .from('shared_rides')
                .select('*')
                .eq('id', rideId)
                .single();
            return { ride: data, error };
        } catch (error) {
            return { error };
        }
    },

    /**
     * Chercher les courses disponibles vers une destination
     */
    findAvailableRides: async (
        destLat: number,
        destLon: number,
        maxDistanceKm: number = 3
    ): Promise<{ rides: SharedRide[]; error?: any }> => {
        try {
            const { data, error } = await supabase
                .from('shared_rides')
                .select('*')
                .eq('is_accepting_passengers', true)
                .in('status', ['searching', 'driver_assigned'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filtrer par distance de destination
            const filteredRides = (data || []).filter(ride => {
                const distance = calculateDistance(
                    destLat, destLon,
                    ride.dropoff_lat, ride.dropoff_lon
                );
                return distance <= maxDistanceKm;
            });

            return { rides: filteredRides };
        } catch (error) {
            console.error('findAvailableRides error:', error);
            return { rides: [], error };
        }
    },

    /**
     * Créer une course partageable
     */
    createSharedRide: async (
        creatorId: string,
        creatorPhone: string,
        pickup: { address: string; lat: number; lon: number },
        dropoff: { address: string; lat: number; lon: number },
        vehicleType: string,
        basePrice: number,
        acceptPassengers: boolean = true
    ): Promise<{ ride?: SharedRide; error?: any }> => {
        try {
            const { data, error } = await supabase
                .from('shared_rides')
                .insert({
                    creator_id: creatorId,
                    creator_phone: creatorPhone,
                    pickup_address: pickup.address,
                    pickup_lat: pickup.lat,
                    pickup_lon: pickup.lon,
                    dropoff_address: dropoff.address,
                    dropoff_lat: dropoff.lat,
                    dropoff_lon: dropoff.lon,
                    vehicle_type: vehicleType,
                    base_price: basePrice,
                    current_price_per_person: basePrice,
                    is_accepting_passengers: acceptPassengers,
                })
                .select()
                .single();

            if (error) throw error;

            // Ajouter le créateur comme premier passager
            await supabase.from('shared_ride_passengers').insert({
                shared_ride_id: data.id,
                user_id: creatorId,
                user_phone: creatorPhone,
                user_name: 'Créateur',
                pickup_address: pickup.address,
                pickup_lat: pickup.lat,
                pickup_lon: pickup.lon,
                dropoff_address: dropoff.address,
                dropoff_lat: dropoff.lat,
                dropoff_lon: dropoff.lon,
                price_to_pay: basePrice,
                pickup_order: 1,
            });

            return { ride: data };
        } catch (error) {
            console.error('createSharedRide error:', error);
            return { error };
        }
    },

    /**
     * Rejoindre une course existante
     */
    joinRide: async (
        rideId: string,
        userId: string,
        userPhone: string,
        userName: string,
        pickup: { address: string; lat: number; lon: number },
        dropoff: { address: string; lat: number; lon: number }
    ): Promise<{ success: boolean; newPrice?: number; error?: any }> => {
        try {
            // Récupérer la course
            const { data: ride, error: rideError } = await supabase
                .from('shared_rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (rideError || !ride) throw rideError || new Error('Course non trouvée');

            if (!ride.is_accepting_passengers) {
                throw new Error('Cette course n\'accepte plus de passagers');
            }

            if (ride.current_passengers >= ride.max_passengers) {
                throw new Error('Course complète');
            }

            const newPassengerCount = ride.current_passengers + 1;
            const isInterception = ride.status === 'driver_assigned' || ride.status === 'in_progress';

            // Calcul du prix de base par personne (partagé)
            let newPricePerPerson = calculatePricePerPerson(ride.base_price, newPassengerCount);

            // Si c'est une interception, le nouveau passager paie 15% de plus
            const priceToPayForNew = isInterception
                ? Math.round(newPricePerPerson * 1.15)
                : newPricePerPerson;

            // Ajouter le passager
            const { error: passengerError } = await supabase
                .from('shared_ride_passengers')
                .insert({
                    shared_ride_id: rideId,
                    user_id: userId,
                    user_phone: userPhone,
                    user_name: userName,
                    pickup_address: pickup.address,
                    pickup_lat: pickup.lat,
                    pickup_lon: pickup.lon,
                    dropoff_address: dropoff.address,
                    dropoff_lat: dropoff.lat,
                    dropoff_lon: dropoff.lon,
                    price_to_pay: priceToPayForNew,
                    pickup_order: newPassengerCount,
                });

            if (passengerError) throw passengerError;

            // Mettre à jour le compte de passagers et le prix de base partagé
            const { error: updateError } = await supabase
                .from('shared_rides')
                .update({
                    current_passengers: newPassengerCount,
                    current_price_per_person: newPricePerPerson,
                })
                .eq('id', rideId);

            if (updateError) throw updateError;

            // Mettre à jour le prix pour les ANCIENS passagers (ils bénéficient du partage)
            // Le nouveau passager garde son prix avec bonus +15%
            await supabase
                .from('shared_ride_passengers')
                .update({ price_to_pay: newPricePerPerson })
                .eq('shared_ride_id', rideId)
                .neq('user_id', userId); // Ne pas écraser le prix du nouveau qui a payé le bonus

            return { success: true, newPrice: priceToPayForNew };
        } catch (error: any) {
            console.error('joinRide error:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Récupérer les passagers d'une course
     */
    getRidePassengers: async (rideId: string): Promise<{ passengers: SharedRidePassenger[]; error?: any }> => {
        try {
            const { data, error } = await supabase
                .from('shared_ride_passengers')
                .select('*')
                .eq('shared_ride_id', rideId)
                .order('pickup_order', { ascending: true });

            if (error) throw error;

            return { passengers: data || [] };
        } catch (error) {
            console.error('getRidePassengers error:', error);
            return { passengers: [], error };
        }
    },

    /**
     * Souscrire aux mises à jour d'une course (realtime)
     */
    subscribeToRide: (
        rideId: string,
        onUpdate: (ride: SharedRide) => void
    ) => {
        return supabase
            .channel(`shared_ride_${rideId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shared_rides', filter: `id=eq.${rideId}` },
                (payload) => {
                    if (payload.new) {
                        onUpdate(payload.new as SharedRide);
                    }
                }
            )
            .subscribe();
    },

    /**
     * Souscrire aux nouveaux passagers
     */
    subscribeToPassengers: (
        rideId: string,
        onNewPassenger: (passenger: SharedRidePassenger) => void
    ) => {
        return supabase
            .channel(`passengers_${rideId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'shared_ride_passengers', filter: `shared_ride_id=eq.${rideId}` },
                (payload) => {
                    if (payload.new) {
                        onNewPassenger(payload.new as SharedRidePassenger);
                    }
                }
            )
            .subscribe();
    },

    /**
     * Annuler une participation
     */
    leaveRide: async (rideId: string, passengerId: string): Promise<{ success: boolean; error?: any }> => {
        try {
            await supabase
                .from('shared_ride_passengers')
                .update({ status: 'cancelled' })
                .eq('id', passengerId);

            // Mettre à jour le compte
            const { data: ride } = await supabase
                .from('shared_rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (ride && ride.current_passengers > 1) {
                const newCount = ride.current_passengers - 1;
                const newPrice = calculatePricePerPerson(ride.base_price, newCount);

                await supabase
                    .from('shared_rides')
                    .update({
                        current_passengers: newCount,
                        current_price_per_person: newPrice
                    })
                    .eq('id', rideId);

                // Mettre à jour le prix pour les passagers restants
                await supabase
                    .from('shared_ride_passengers')
                    .update({ price_to_pay: newPrice })
                    .eq('shared_ride_id', rideId)
                    .neq('status', 'cancelled');
            }

            return { success: true };
        } catch (error) {
            console.error('leaveRide error:', error);
            return { success: false, error };
        }
    }
};

export default carpoolService;
