// =============================================
// TRANSIGO DRIVER - RIDE REQUEST STORE
// Gestion des demandes de courses
// =============================================

import { create } from 'zustand';
import { useDriverWalletStore } from './driverWalletStore';

// Types
export interface RideRequest {
    id: string;
    passengerId: string;
    passengerName: string;
    passengerRating: number;
    passengerPhone: string;
    passengerPhoto?: string;

    // Trajet
    pickup: {
        lat: number;
        lng: number;
        address: string;
    };
    dropoff: {
        lat: number;
        lng: number;
        address: string;
    };

    // Infos course
    distance: number; // km
    duration: number; // minutes
    price: number;
    pricePerKm: number;

    // Bonus
    bonus: number;
    bonusReason?: string;

    // Meta
    rideType: 'standard' | 'comfort' | 'premium' | 'moto';
    paymentMethod: 'cash' | 'card' | 'wallet';
    requestedAt: Date;
    expiresAt: Date;

    // Arrêts (pour Moto)
    stops?: { latitude: number; longitude: number; address: string }[];

    // Score de matching
    matchScore: number;
}

export interface ActiveRide extends RideRequest {
    status: 'accepted' | 'arriving' | 'waiting' | 'in_progress' | 'completed';
    acceptedAt: Date;
    arrivedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    actualRoute?: { lat: number; lng: number }[];
    tip?: number;
}

interface RideRequestState {
    // Current request
    currentRequest: RideRequest | null;
    requestCountdown: number;

    // Active ride
    activeRide: ActiveRide | null;

    // History for today
    todayRides: ActiveRide[];

    // Queue
    requestQueue: RideRequest[];

    // Actions
    setRequest: (request: RideRequest | null) => void;
    acceptRequest: () => void;
    rejectRequest: () => void;
    updateCountdown: (seconds: number) => void;
    updateRideStatus: (status: ActiveRide['status']) => void;
    completeRide: (tip?: number) => void;
    addToQueue: (request: RideRequest) => void;
    removeFromQueue: (requestId: string) => void;

    // Matching score calculator
    calculateMatchScore: (request: RideRequest, driverLocation: { lat: number; lng: number }, preferences: any) => number;
}

// Calcul de distance simple (formule de Haversine simplifiée)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const useRideRequestStore = create<RideRequestState>((set, get) => ({
    currentRequest: null,
    requestCountdown: 30,
    activeRide: null,
    todayRides: [],
    requestQueue: [],

    setRequest: (request) => set({
        currentRequest: request,
        requestCountdown: request ? 30 : 0,
    }),

    acceptRequest: () => {
        const { currentRequest } = get();
        if (!currentRequest) return;

        const activeRide: ActiveRide = {
            ...currentRequest,
            status: 'accepted',
            acceptedAt: new Date(),
        };

        set({
            activeRide,
            currentRequest: null,
            requestCountdown: 0,
        });
    },

    rejectRequest: () => set({
        currentRequest: null,
        requestCountdown: 0,
    }),

    updateCountdown: (seconds) => set({ requestCountdown: seconds }),

    updateRideStatus: (status) => set((state) => ({
        activeRide: state.activeRide ? {
            ...state.activeRide,
            status,
            ...(status === 'arriving' && { arrivedAt: new Date() }),
            ...(status === 'in_progress' && { startedAt: new Date() }),
        } : null,
    })),

    completeRide: (tip = 0) => {
        const { activeRide, todayRides } = get();
        if (!activeRide) return;

        const completedRide: ActiveRide = {
            ...activeRide,
            status: 'completed',
            completedAt: new Date(),
            tip,
        };

        // Prélever la commission automatiquement (15%)
        const walletState = useDriverWalletStore.getState();
        const ridePrice = activeRide.price + (activeRide.bonus || 0);
        const commissionOk = walletState.deductCommission(activeRide.id, ridePrice);

        if (!commissionOk) {
            // Le chauffeur sera automatiquement mis hors ligne par le store
            console.log('[TransiGo] Solde insuffisant après course - Chauffeur passé hors ligne');
        }

        set({
            activeRide: null,
            todayRides: [...todayRides, completedRide],
        });
    },

    addToQueue: (request) => set((state) => ({
        requestQueue: [...state.requestQueue, request].sort((a, b) => b.matchScore - a.matchScore),
    })),

    removeFromQueue: (requestId) => set((state) => ({
        requestQueue: state.requestQueue.filter(r => r.id !== requestId),
    })),

    // Algorithme de matching intelligent
    calculateMatchScore: (request, driverLocation, preferences) => {
        let score = 0;

        // 1. Proximité (30% du score) - Plus proche = meilleur score
        const pickupDistance = calculateDistance(
            driverLocation.lat, driverLocation.lng,
            request.pickup.lat, request.pickup.lng
        );
        const proximityScore = Math.max(0, 100 - (pickupDistance * 10)); // -10 points par km
        score += proximityScore * 0.3;

        // 2. Rentabilité (25% du score) - Prix/km
        const profitabilityScore = Math.min(100, (request.pricePerKm / 500) * 100); // 500 F/km = 100%
        score += profitabilityScore * 0.25;

        // 3. Direction vers maison (20% du score)
        if (preferences.homeDirection) {
            const toHome = calculateDistance(
                request.dropoff.lat, request.dropoff.lng,
                preferences.homeDirection.lat, preferences.homeDirection.lng
            );
            const currentToHome = calculateDistance(
                driverLocation.lat, driverLocation.lng,
                preferences.homeDirection.lat, preferences.homeDirection.lng
            );
            const directionScore = toHome < currentToHome ? 100 : Math.max(0, 100 - (toHome - currentToHome) * 5);
            score += directionScore * 0.2;
        } else {
            score += 50 * 0.2; // Score neutre si pas de direction
        }

        // 4. Note passager (15% du score)
        const passengerScore = (request.passengerRating / 5) * 100;
        score += passengerScore * 0.15;

        // 5. Bonus (10% du score)
        const bonusScore = request.bonus > 0 ? 100 : 0;
        score += bonusScore * 0.1;

        // Bonus zones préférées
        const isPreferredZone = preferences.preferredZones?.some((zone: string) =>
            request.pickup.address.toLowerCase().includes(zone.toLowerCase()) ||
            request.dropoff.address.toLowerCase().includes(zone.toLowerCase())
        );
        if (isPreferredZone) score += 10;

        // Pénalité zones évitées
        const isAvoidZone = preferences.avoidZones?.some((zone: string) =>
            request.pickup.address.toLowerCase().includes(zone.toLowerCase()) ||
            request.dropoff.address.toLowerCase().includes(zone.toLowerCase())
        );
        if (isAvoidZone) score -= 20;

        return Math.max(0, Math.min(100, score));
    },
}));
