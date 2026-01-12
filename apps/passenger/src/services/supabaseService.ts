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
    // ============================================
    // Fonction utilitaire : Calcul de distance Haversine
    // Retourne la distance en km entre deux points GPS
    // ============================================
    haversineDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance en km
    },

    // Récupérer les chauffeurs en ligne à proximité (AMÉLIORÉ)
    getNearbyDrivers: async (
        lat: number,
        lng: number,
        radiusKm: number = 5,
        vehicleType?: string,
        profileType?: 'driver' | 'delivery'
    ) => {
        // 1️⃣ Récupérer tous les chauffeurs en ligne et vérifiés
        const { data, error } = await supabase
            .from('drivers')
            .select('id, first_name, last_name, current_lat, current_lng, rating, vehicle_type, profile_type, avatar_url, phone')
            .eq('is_online', true)
            .eq('is_verified', true) // Seulement les chauffeurs validés !
            .not('current_lat', 'is', null);

        if (error || !data) {
            return { drivers: [], error };
        }

        // 2️⃣ Calculer la distance avec Haversine et enrichir les données
        const driversWithDistance = data
            .map(driver => {
                if (!driver.current_lat || !driver.current_lng) return null;

                const distance = rideService.haversineDistance(
                    lat, lng,
                    driver.current_lat, driver.current_lng
                );

                return {
                    ...driver,
                    distance: Math.round(distance * 100) / 100, // Arrondi à 2 décimales
                    distanceText: distance < 1
                        ? `${Math.round(distance * 1000)}m`
                        : `${distance.toFixed(1)}km`,
                    eta: Math.ceil(distance * 2), // Estimation: 30km/h en ville = 2min/km
                };
            })
            .filter((d): d is NonNullable<typeof d> => d !== null);

        // 3️⃣ Filtrer par rayon et par type si spécifié
        let filteredDrivers = driversWithDistance.filter(d => d.distance <= radiusKm);

        if (vehicleType) {
            filteredDrivers = filteredDrivers.filter(d => d.vehicle_type === vehicleType);
        }

        if (profileType) {
            filteredDrivers = filteredDrivers.filter(d => d.profile_type === profileType);
        }

        // 4️⃣ Trier par distance (le plus proche en premier)
        filteredDrivers.sort((a, b) => a.distance - b.distance);

        return {
            drivers: filteredDrivers,
            error: null,
            totalFound: filteredDrivers.length,
            closestDriver: filteredDrivers[0] || null,
        };
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

    // ============================================
    // SYSTÈME DE NOTIFICATION CASCADE
    // Notifie les chauffeurs un par un (le plus proche en premier)
    // Si pas de réponse après timeout, passe au suivant
    // ============================================

    // Notifier un seul chauffeur via push notification
    notifyDriver: async (driverId: string, rideId: string, rideInfo: {
        pickupAddress: string;
        dropoffAddress: string;
        price: number;
        distance: number;
    }) => {
        try {
            // Récupérer le push token du chauffeur
            const { data: driver } = await supabase
                .from('drivers')
                .select('push_token, first_name')
                .eq('id', driverId)
                .single();

            if (!driver?.push_token) {
                console.log(`Driver ${driverId} has no push token`);
                return { success: false, reason: 'no_token' };
            }

            // Mettre à jour la course avec le chauffeur notifié actuellement
            await supabase
                .from('rides')
                .update({
                    current_notified_driver: driverId,
                    notified_at: new Date().toISOString()
                })
                .eq('id', rideId);

            // Envoyer la notification push via Expo
            const message = {
                to: driver.push_token,
                sound: 'default',
                title: '🚗 Nouvelle course !',
                body: `${rideInfo.pickupAddress} → ${rideInfo.dropoffAddress}\n💰 ${rideInfo.price.toLocaleString('fr-FR')} F • ${rideInfo.distance.toFixed(1)} km`,
                data: {
                    type: 'new_ride',
                    rideId,
                    pickupAddress: rideInfo.pickupAddress,
                    dropoffAddress: rideInfo.dropoffAddress,
                    price: rideInfo.price,
                },
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log(`Push sent to driver ${driverId}:`, result);

            return { success: true, pushResult: result };
        } catch (error) {
            console.error('Error notifying driver:', error);
            return { success: false, reason: 'error', error };
        }
    },

    // Système de notification cascade complet
    notifyDriversCascade: async (
        rideId: string,
        pickupLat: number,
        pickupLng: number,
        rideInfo: {
            pickupAddress: string;
            dropoffAddress: string;
            price: number;
            distance: number;
            vehicleType?: string;
        },
        options: {
            timeoutSeconds?: number;  // Temps d'attente avant de passer au suivant
            maxDrivers?: number;       // Nombre max de chauffeurs à notifier
            radiusKm?: number;         // Rayon de recherche
        } = {}
    ) => {
        const {
            timeoutSeconds = 15,
            maxDrivers = 5,
            radiusKm = 5
        } = options;

        // 1️⃣ Récupérer les chauffeurs proches triés par distance
        const { drivers } = await rideService.getNearbyDrivers(
            pickupLat,
            pickupLng,
            radiusKm,
            rideInfo.vehicleType
        );

        if (!drivers || drivers.length === 0) {
            return {
                success: false,
                reason: 'no_drivers_available',
                driversNotified: 0
            };
        }

        // Limiter le nombre de chauffeurs à notifier
        const driversToNotify = drivers.slice(0, maxDrivers);

        console.log(`[Cascade] Found ${drivers.length} drivers, will notify ${driversToNotify.length}`);

        // 2️⃣ Notifier le premier chauffeur
        let currentIndex = 0;
        let accepted = false;

        const notifyNext = async (): Promise<{
            success: boolean;
            acceptedBy?: string;
            driversNotified: number;
        }> => {
            if (currentIndex >= driversToNotify.length) {
                return { success: false, driversNotified: currentIndex };
            }

            const driver = driversToNotify[currentIndex];
            console.log(`[Cascade] Notifying driver #${currentIndex + 1}: ${driver.first_name} (${driver.distanceText} away)`);

            // Notifier ce chauffeur
            await rideService.notifyDriver(driver.id, rideId, rideInfo);

            // Attendre le timeout ou l'acceptation
            return new Promise((resolve) => {
                const timeout = setTimeout(async () => {
                    // Vérifier si la course a été acceptée
                    const { ride } = await rideService.getRide(rideId);

                    if (ride?.status === 'accepted') {
                        resolve({
                            success: true,
                            acceptedBy: ride.driver_id,
                            driversNotified: currentIndex + 1
                        });
                    } else {
                        // Pas acceptée, passer au suivant
                        console.log(`[Cascade] Driver ${driver.id} didn't respond, trying next...`);
                        currentIndex++;
                        resolve(notifyNext());
                    }
                }, timeoutSeconds * 1000);

                // Aussi s'abonner aux changements pour réagir plus vite si acceptée
                const channel = supabase
                    .channel(`cascade-${rideId}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'rides',
                        filter: `id=eq.${rideId}`
                    }, (payload) => {
                        if (payload.new.status === 'accepted') {
                            clearTimeout(timeout);
                            supabase.removeChannel(channel);
                            resolve({
                                success: true,
                                acceptedBy: payload.new.driver_id,
                                driversNotified: currentIndex + 1
                            });
                        }
                    })
                    .subscribe();
            });
        };

        return notifyNext();
    },

    // Rejeter une course (quand un chauffeur refuse explicitement)
    rejectRide: async (rideId: string, driverId: string, reason?: string) => {
        // Ajouter ce chauffeur à la liste des rejets
        const { data: ride } = await supabase
            .from('rides')
            .select('rejected_drivers')
            .eq('id', rideId)
            .single();

        const rejectedDrivers = ride?.rejected_drivers || [];
        rejectedDrivers.push({
            driver_id: driverId,
            rejected_at: new Date().toISOString(),
            reason: reason || 'declined'
        });

        await supabase
            .from('rides')
            .update({
                rejected_drivers: rejectedDrivers,
                current_notified_driver: null
            })
            .eq('id', rideId);

        return { success: true };
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
