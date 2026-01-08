// =============================================
// TRANSIGO - CARPOOL STORE (Zustand)
// =============================================

import { create } from 'zustand';

export interface SharedRide {
    id: string;
    creator_id: string;
    creator_phone: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lon: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lon: number;
    vehicle_type: string;
    driver_name?: string;
    driver_phone?: string;
    base_price: number;
    current_price_per_person: number;
    max_passengers: number;
    current_passengers: number;
    status: 'searching' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
    is_accepting_passengers: boolean;
    created_at: string;
    departure_time?: string;
}

export interface SharedRidePassenger {
    id: string;
    shared_ride_id: string;
    user_id: string;
    user_phone: string;
    user_name: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lon: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lon: number;
    price_to_pay: number;
    status: 'waiting' | 'picked_up' | 'dropped_off' | 'cancelled';
    pickup_order: number;
    joined_at: string;
}

interface CarpoolState {
    // Liste des courses disponibles
    availableRides: SharedRide[];

    // Course active (si l'utilisateur en a créé ou rejoint une)
    activeRide: SharedRide | null;

    // Passagers de la course active
    passengers: SharedRidePassenger[];

    // État de chargement
    isLoading: boolean;

    // Actions
    setAvailableRides: (rides: SharedRide[]) => void;
    setActiveRide: (ride: SharedRide | null) => void;
    setPassengers: (passengers: SharedRidePassenger[]) => void;
    addPassenger: (passenger: SharedRidePassenger) => void;
    updatePassengerStatus: (passengerId: string, status: SharedRidePassenger['status']) => void;
    updateRidePassengerCount: (rideId: string, count: number, newPrice: number) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

export const useCarpoolStore = create<CarpoolState>((set) => ({
    availableRides: [],
    activeRide: null,
    passengers: [],
    isLoading: false,

    setAvailableRides: (rides) => set({ availableRides: rides }),

    setActiveRide: (ride) => set({ activeRide: ride }),

    setPassengers: (passengers) => set({ passengers }),

    addPassenger: (passenger) => set((state) => ({
        passengers: [...state.passengers, passenger]
    })),

    updatePassengerStatus: (passengerId, status) => set((state) => ({
        passengers: state.passengers.map(p =>
            p.id === passengerId ? { ...p, status } : p
        )
    })),

    updateRidePassengerCount: (rideId, count, newPrice) => set((state) => ({
        availableRides: state.availableRides.map(r =>
            r.id === rideId ? { ...r, current_passengers: count, current_price_per_person: newPrice } : r
        ),
        activeRide: state.activeRide?.id === rideId
            ? { ...state.activeRide, current_passengers: count, current_price_per_person: newPrice }
            : state.activeRide
    })),

    setLoading: (loading) => set({ isLoading: loading }),

    reset: () => set({
        availableRides: [],
        activeRide: null,
        passengers: [],
        isLoading: false
    })
}));
