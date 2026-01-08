// =============================================
// TRANSIGO DRIVER - RIDE REQUESTS HOOK
// Hook pour recevoir les courses en temps réel via Supabase
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, rideService } from './supabaseService';
import { Alert } from 'react-native';

export interface RideRequest {
    id: string;
    passengerName: string;
    passengerRating: number;
    pickup: string;
    dropoff: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    distance: number;
    duration: number;
    price: number;
    bonus: number;
    womenOnly: boolean;
    stops?: { latitude: number; longitude: number; address: string }[];
    createdAt: Date;
}

interface UseRideRequestsReturn {
    currentRequest: RideRequest | null;
    isLoading: boolean;
    acceptRide: (driverId: string) => Promise<boolean>;
    rejectRide: () => void;
    completeRide: () => Promise<boolean>;
    updateStatus: (status: string) => Promise<boolean>;
}

import { DriverProfile } from '../stores/driverStore';

export function useRideRequests(driver: DriverProfile | null, isOnline: boolean): UseRideRequestsReturn {
    const [currentRequest, setCurrentRequest] = useState<RideRequest | null>(null);
    const [activeRideId, setActiveRideId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Écouter les nouvelles courses
    useEffect(() => {
        if (!isOnline || !driver) {
            setCurrentRequest(null);
            return;
        }

        // S'abonner aux nouvelles demandes
        const channel = rideService.subscribeToNewRides((newRide) => {
            // Filtrer: Si Mode Femme et chauffeur n'est pas une femme
            if (newRide.women_only && driver.gender !== 'female') {
                return;
            }

            // Transformer les données Supabase en format local
            const request: RideRequest = {
                id: newRide.id,
                passengerName: 'Passager', // À améliorer avec jointure
                passengerRating: 4.5,
                pickup: newRide.pickup_address,
                dropoff: newRide.dropoff_address,
                pickupLat: newRide.pickup_lat,
                pickupLng: newRide.pickup_lng,
                dropoffLat: newRide.dropoff_lat,
                dropoffLng: newRide.dropoff_lng,
                distance: newRide.distance_km,
                duration: newRide.duration_min,
                price: newRide.price,
                bonus: 0,
                womenOnly: newRide.women_only || false,
                stops: newRide.stops,
                createdAt: new Date(newRide.created_at),
            };

            // Ne montrer que si pas déjà en course
            if (!activeRideId) {
                setCurrentRequest(request);
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOnline, driver, activeRideId]);

    // Accepter une course
    const acceptRide = useCallback(async (driverId: string): Promise<boolean> => {
        if (!currentRequest) return false;

        setIsLoading(true);
        try {
            const { ride, error } = await rideService.acceptRide(currentRequest.id, driverId);

            if (error) {
                if (error.message.includes('0 rows')) {
                    Alert.alert('Course déjà prise', 'Cette course a été acceptée par un autre chauffeur.');
                } else {
                    Alert.alert('Erreur', error.message);
                }
                setCurrentRequest(null);
                return false;
            }

            setActiveRideId(ride.id);
            setCurrentRequest(null);
            return true;
        } catch (e: any) {
            Alert.alert('Erreur', e.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentRequest]);

    // Rejeter une course
    const rejectRide = useCallback(() => {
        setCurrentRequest(null);
    }, []);

    // Mettre à jour le statut de la course
    const updateStatus = useCallback(async (status: string): Promise<boolean> => {
        if (!activeRideId) return false;

        try {
            const { error } = await rideService.updateRideStatus(activeRideId, status);
            return !error;
        } catch (e) {
            return false;
        }
    }, [activeRideId]);

    // Terminer la course
    const completeRide = useCallback(async (): Promise<boolean> => {
        if (!activeRideId) return false;

        try {
            const { error } = await rideService.updateRideStatus(activeRideId, 'completed');
            if (!error) {
                setActiveRideId(null);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }, [activeRideId]);

    return {
        currentRequest,
        isLoading,
        acceptRide,
        rejectRide,
        completeRide,
        updateStatus,
    };
}

// ============================================
// Hook pour le wallet avec Supabase
// ============================================
export function useSupabaseWallet(driverId: string | null) {
    const [balance, setBalance] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const MINIMUM_BALANCE = 1000;

    useEffect(() => {
        if (!driverId) return;

        const loadWallet = async () => {
            const { balance: walletBalance } = await supabase
                .from('drivers')
                .select('wallet_balance')
                .eq('id', driverId)
                .single()
                .then(({ data }) => ({ balance: data?.wallet_balance || 0 }));

            setBalance(walletBalance);
            setIsBlocked(walletBalance < MINIMUM_BALANCE);
            setIsLoading(false);
        };

        loadWallet();

        // Realtime
        const channel = supabase
            .channel(`wallet-${driverId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${driverId}` },
                (payload) => {
                    const newBalance = payload.new.wallet_balance;
                    setBalance(newBalance);
                    setIsBlocked(newBalance < MINIMUM_BALANCE);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driverId]);

    const checkAvailability = () => ({
        canGoOnline: balance >= MINIMUM_BALANCE,
        message: balance < MINIMUM_BALANCE
            ? `Solde insuffisant. Minimum: ${MINIMUM_BALANCE} FCFA. Votre solde: ${balance} FCFA`
            : 'Solde suffisant',
    });

    return { balance, isBlocked, isLoading, checkAvailability };
}
