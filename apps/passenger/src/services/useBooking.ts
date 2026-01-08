// =============================================
// TRANSIGO PASSENGER - BOOKING SERVICE
// Gérer les réservations de courses via Supabase
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, rideService } from './supabaseService';
import { Alert } from 'react-native';

export interface BookingData {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    distanceKm: number;
    durationMin: number;
    price: number;
    vehicleType?: 'standard' | 'comfort' | 'premium';
}

export interface ActiveRide {
    id: string;
    status: 'requested' | 'accepted' | 'arriving' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
    driverName?: string;
    driverPhone?: string;
    driverRating?: number;
    vehiclePlate?: string;
    vehicleModel?: string;
    eta?: number;
    pickup: string;
    dropoff: string;
    price: number;
}

interface UseBookingReturn {
    activeRide: ActiveRide | null;
    isLoading: boolean;
    createBooking: (passengerId: string, data: BookingData) => Promise<string | null>;
    cancelBooking: (reason?: string) => Promise<boolean>;
    rateDriver: (rating: number) => Promise<boolean>;
}

export function useBooking(passengerId: string | null): UseBookingReturn {
    const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
    const [rideId, setRideId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Écouter les mises à jour de la course active
    useEffect(() => {
        if (!rideId) {
            setActiveRide(null);
            return;
        }

        // Charger la course initiale
        const loadRide = async () => {
            const { ride, error } = await rideService.getRide(rideId);
            if (ride) {
                setActiveRide({
                    id: ride.id,
                    status: ride.status,
                    driverName: ride.drivers?.first_name,
                    driverRating: ride.drivers?.rating,
                    pickup: ride.pickup_address,
                    dropoff: ride.dropoff_address,
                    price: ride.price,
                });
            }
        };

        loadRide();

        // S'abonner aux mises à jour
        const channel = rideService.subscribeToRide(rideId, (updatedRide) => {
            setActiveRide(prev => prev ? {
                ...prev,
                status: updatedRide.status,
            } : null);

            // Si terminée ou annulée, réinitialiser après un délai
            if (['completed', 'cancelled'].includes(updatedRide.status)) {
                setTimeout(() => {
                    setRideId(null);
                    setActiveRide(null);
                }, 5000);
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rideId]);

    // Créer une réservation
    const createBooking = useCallback(async (passengerId: string, data: BookingData): Promise<string | null> => {
        setIsLoading(true);

        try {
            const { ride, error } = await rideService.createRide({
                passenger_id: passengerId,
                pickup_address: data.pickupAddress,
                pickup_lat: data.pickupLat,
                pickup_lng: data.pickupLng,
                dropoff_address: data.dropoffAddress,
                dropoff_lat: data.dropoffLat,
                dropoff_lng: data.dropoffLng,
                distance_km: data.distanceKm,
                duration_min: data.durationMin,
                price: data.price,
                vehicle_type: data.vehicleType || 'standard',
            });

            if (error) {
                Alert.alert('Erreur', error.message);
                return null;
            }

            if (ride) {
                setRideId(ride.id);
                setActiveRide({
                    id: ride.id,
                    status: 'requested',
                    pickup: data.pickupAddress,
                    dropoff: data.dropoffAddress,
                    price: data.price,
                });
                return ride.id;
            }

            return null;
        } catch (e: any) {
            Alert.alert('Erreur', e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Annuler la réservation
    const cancelBooking = useCallback(async (reason?: string): Promise<boolean> => {
        if (!rideId) return false;

        try {
            const { error } = await rideService.cancelRide(rideId, reason);
            if (!error) {
                setRideId(null);
                setActiveRide(null);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }, [rideId]);

    // Noter le chauffeur
    const rateDriver = useCallback(async (rating: number): Promise<boolean> => {
        if (!rideId) return false;

        try {
            const { error } = await rideService.rateDriver(rideId, rating);
            return !error;
        } catch (e) {
            return false;
        }
    }, [rideId]);

    return {
        activeRide,
        isLoading,
        createBooking,
        cancelBooking,
        rateDriver,
    };
}

// ============================================
// Hook pour les chauffeurs à proximité
// ============================================
export function useNearbyDrivers(lat: number | null, lng: number | null) {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!lat || !lng) return;

        const loadDrivers = async () => {
            setIsLoading(true);
            const { drivers: nearbyDrivers } = await rideService.getNearbyDrivers(lat, lng, 5);
            setDrivers(nearbyDrivers);
            setIsLoading(false);
        };

        loadDrivers();

        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(loadDrivers, 30000);
        return () => clearInterval(interval);
    }, [lat, lng]);

    return { drivers, isLoading };
}
