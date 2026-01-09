// =============================================
// TRANSIGO PASSENGER - SUPABASE SERVICE
// Intégration avec le backend Supabase
// =============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zndgvloyaitopczhjddq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZGd2bG95YWl0b3BjemhqZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTc1MDgsImV4cCI6MjA4MzEzMzUwOH0.KTHGtMaaWW_GhXacarRN40iqlFUp2KPirp_5peHWBls';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Service: Authentification Passager
// ============================================
export const authService = {
    signInWithPhone: async (phone: string) => {
        const { data, error } = await supabase.auth.signInWithOtp({ phone });
        return { data, error };
    },

    verifyOtp: async (phone: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        return { data, error };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        return { session: data.session, error };
    },
};

// ============================================
// Service: Profil Passager
// ============================================
export const userService = {
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return { user: data, error };
    },

    createProfile: async (userId: string, profile: { phone: string; first_name: string; last_name: string }) => {
        const { data, error } = await supabase
            .from('users')
            .insert({ id: userId, ...profile })
            .select()
            .single();
        return { user: data, error };
    },

    updatePushToken: async (userId: string, token: string) => {
        const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', userId);
        return { error };
    },
};

// ============================================
// Service: Réservation de Course
// ============================================
export const rideService = {
    // Créer une nouvelle demande de course
    createRide: async (rideData: {
        passenger_id: string;
        pickup_address: string;
        pickup_lat: number;
        pickup_lng: number;
        dropoff_address: string;
        dropoff_lat: number;
        dropoff_lng: number;
        distance_km: number;
        duration_min: number;
        price: number;
        discount?: number;
        user_pays?: number;
        vehicle_type?: string;
        service_type?: 'ride' | 'delivery';
        stops?: any[];
        women_only?: boolean;
    }) => {
        const { data, error } = await supabase
            .from('rides')
            .insert({
                ...rideData,
                status: 'requested',
                service_type: rideData.service_type || 'ride',
                discount: rideData.discount || 0,
                user_pays: rideData.user_pays !== undefined ? rideData.user_pays : rideData.price,
                vehicle_type: rideData.vehicle_type || 'standard',
                stops: rideData.stops || null,
                women_only: rideData.women_only || false,
            })
            .select()
            .single();
        return { ride: data, error };
    },

    // Récupérer une course par ID
    getRide: async (rideId: string) => {
        const { data, error } = await supabase
            .from('rides')
            .select('*, drivers!driver_id(*)')
            .eq('id', rideId)
            .single();
        return { ride: data, error };
    },

    // Annuler une course
    cancelRide: async (rideId: string, reason?: string) => {
        const { data, error } = await supabase
            .from('rides')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
            })
            .eq('id', rideId)
            .select()
            .single();
        return { ride: data, error };
    },

    // Noter le chauffeur
    rateDriver: async (rideId: string, rating: number) => {
        const { error } = await supabase
            .from('rides')
            .update({ rating_by_passenger: rating })
            .eq('id', rideId);
        return { error };
    },

    // S'abonner aux mises à jour d'une course (Realtime)
    subscribeToRide: (rideId: string, callback: (ride: any) => void) => {
        return supabase
            .channel(`ride-${rideId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rides',
                    filter: `id=eq.${rideId}`
                },
                (payload) => callback(payload.new)
            )
            .subscribe();
    },

    // Récupérer les chauffeurs en ligne à proximité
    getNearbyDrivers: async (lat: number, lng: number, radiusKm: number = 5) => {
        // Note: En production, utiliser PostGIS pour une vraie recherche géospatiale
        const { data, error } = await supabase
            .from('drivers')
            .select('id, first_name, current_lat, current_lng, rating, vehicle_type, profile_type')
            .eq('is_online', true)
            .not('current_lat', 'is', null);

        // Filtrer par distance (approximation simple)
        const nearbyDrivers = data?.filter(driver => {
            if (!driver.current_lat || !driver.current_lng) return false;
            const distance = Math.sqrt(
                Math.pow(driver.current_lat - lat, 2) +
                Math.pow(driver.current_lng - lng, 2)
            ) * 111; // Approximation en km
            return distance <= radiusKm;
        });

        return { drivers: nearbyDrivers || [], error };
    },

    // Historique des courses du passager
    getRideHistory: async (passengerId: string) => {
        const { data, error } = await supabase
            .from('rides')
            .select('*, drivers!driver_id(first_name, last_name, rating)')
            .eq('passenger_id', passengerId)
            .order('created_at', { ascending: false })
            .limit(20);
        return { rides: data, error };
    },
};

// ============================================
// Service: Push Notifications
// ============================================
export const pushTokenService = {
    // Sauvegarder ou mettre à jour le push token
    savePushToken: async (userId: string, token: string) => {
        // Vérifier si le token existe déjà
        const { data: existing } = await supabase
            .from('push_tokens')
            .select('id')
            .eq('token', token)
            .single();

        if (existing) {
            // Mettre à jour le token existant
            const { error } = await supabase
                .from('push_tokens')
                .update({
                    user_id: userId,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('token', token);
            return { error };
        } else {
            // Créer un nouveau token
            const { error } = await supabase
                .from('push_tokens')
                .insert({
                    user_id: userId,
                    token: token,
                    app_type: 'passenger',
                    device_type: 'android',
                    is_active: true,
                });
            return { error };
        }
    },

    // Désactiver un token (quand l'utilisateur se déconnecte)
    deactivateToken: async (token: string) => {
        const { error } = await supabase
            .from('push_tokens')
            .update({ is_active: false })
            .eq('token', token);
        return { error };
    },
};
