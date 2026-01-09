// =============================================
// TRANSIGO - RIDE STORE (Zustand)
// =============================================

import { create } from 'zustand';
import type { Location, ServiceType, Driver } from '@transigo/shared';

// Types pour le flux de réservation
export type RideStatus =
    | 'idle'           // Aucune course en cours
    | 'searching'      // Recherche d'un chauffeur
    | 'accepted'       // Chauffeur trouvé, en route vers pickup
    | 'arriving'       // Chauffeur presque arrivé
    | 'arrived'        // Chauffeur arrivé au point de pickup
    | 'started'        // Course en cours
    | 'completed'      // Course terminée
    | 'cancelled';     // Course annulée

export type VehicleType = 'waka' | 'djassa' | 'prime' | 'elite' | 'family' | 'flash';

export interface Stop {
    address: string;
    latitude: number;
    longitude: number;
}
export type PaymentMethod = 'cash' | 'wallet' | 'card' | 'mobile_money';

export interface VehicleOption {
    type: VehicleType;
    name: string;
    description: string;
    icon: string;
    priceMultiplier: number;
    etaMinutes: number;
}

export interface DriverInfo {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    photo: string;
    rating: number;
    totalRides: number;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate: string;
    currentLocation: Location | null;
}

export interface DriverOffer {
    driver: Driver;
    price: number;
    eta: number;
    distance: number;
}

export interface ActiveRide {
    id: string;
    status: RideStatus;
    pickup: Location;
    dropoff: Location;
    pickupAddress: string;
    dropoffAddress: string;
    driver: DriverInfo | null;
    vehicleType: VehicleType;
    paymentMethod: PaymentMethod;
    price: number;
    distance: number;
    duration: number;
    stops?: Stop[];
    startedAt: Date | null;
    completedAt: Date | null;
}

interface RideState {
    // Status global
    rideStatus: RideStatus;

    // Course active
    activeRide: ActiveRide | null;

    // Booking state (avant confirmation)
    pickup: Location | null;
    dropoff: Location | null;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLandmark: string;
    dropoffLandmark: string;
    selectedVehicle: VehicleType;
    paymentMethod: PaymentMethod;
    estimatedPrice: number;
    estimatedDuration: number;
    estimatedDistance: number;
    routeCoordinates: { latitude: number; longitude: number }[];
    stops: Stop[];

    // Chauffeur
    assignedDriver: DriverInfo | null;
    driverEta: number;
    driverLocation: Location | null;

    // Négociation (legacy)
    passengerOffer: number | null;
    availableDrivers: DriverOffer[];
    selectedDriver: DriverOffer | null;

    // Options
    womenSafetyMode: boolean;
    isSharedRide: boolean;
    scheduledTime: Date | null;

    // Actions - Booking
    setPickup: (location: Location, address: string, landmark?: string) => void;
    setDropoff: (location: Location, address: string, landmark?: string) => void;
    setRouteCoordinates: (coords: { latitude: number; longitude: number }[]) => void;
    setSelectedVehicle: (vehicle: VehicleType) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setEstimates: (price: number, duration: number, distance: number) => void;
    addStop: (stop: Stop) => void;
    removeStop: (index: number) => void;
    clearStops: () => void;

    // Actions - Course
    startSearching: () => void;
    driverAccepted: (driver: DriverInfo, eta: number) => void;
    driverArriving: () => void;
    driverArrived: () => void;
    startRide: () => void;
    completeRide: () => void;
    cancelRide: () => void;
    updateDriverLocation: (location: Location) => void;
    updateDriverEta: (eta: number) => void;

    // Actions - Options
    setWomenSafetyMode: (enabled: boolean) => void;
    setIsSharedRide: (enabled: boolean) => void;
    setScheduledTime: (time: Date | null) => void;

    // Actions - Legacy
    setPassengerOffer: (offer: number | null) => void;
    setAvailableDrivers: (drivers: DriverOffer[]) => void;
    setSelectedDriver: (driver: DriverOffer | null) => void;

    // Reset
    resetBooking: () => void;
    resetAll: () => void;
}

const initialState = {
    rideStatus: 'idle' as RideStatus,
    activeRide: null,
    pickup: null,
    dropoff: null,
    pickupAddress: '',
    dropoffAddress: '',
    pickupLandmark: '',
    dropoffLandmark: '',
    selectedVehicle: 'djassa' as VehicleType,
    paymentMethod: 'cash' as PaymentMethod,
    estimatedPrice: 0,
    estimatedDuration: 0,
    estimatedDistance: 0,
    routeCoordinates: [],
    assignedDriver: null,
    driverEta: 0,
    driverLocation: null,
    passengerOffer: null,
    availableDrivers: [],
    selectedDriver: null,
    womenSafetyMode: false,
    isSharedRide: false,
    scheduledTime: null,
    stops: [],
};

// Calcul de prix par type de véhicule TransiGo
export const VEHICLE_OPTIONS: VehicleOption[] = [
    {
        type: 'waka',
        name: 'Waka',
        description: 'Économique',
        icon: '🚗',
        priceMultiplier: 0.8,
        etaMinutes: 3,
    },
    {
        type: 'djassa',
        name: 'Djassa',
        description: 'Confort standard',
        icon: '🚙',
        priceMultiplier: 1.0,
        etaMinutes: 5,
    },
    {
        type: 'prime',
        name: 'Prime',
        description: 'Confort climatisé',
        icon: '🚘',
        priceMultiplier: 1.4,
        etaMinutes: 6,
    },
    {
        type: 'elite',
        name: 'Elite',
        description: 'Premium luxe',
        icon: '✨',
        priceMultiplier: 2.0,
        etaMinutes: 8,
    },
    {
        type: 'family',
        name: 'Family',
        description: 'Van 6+ places',
        icon: '🚐',
        priceMultiplier: 2.2,
        etaMinutes: 10,
    },
    {
        type: 'flash',
        name: 'Flash',
        description: 'Moto rapide',
        icon: '🏍️',
        priceMultiplier: 0.6,
        etaMinutes: 2,
    },
];

// =============================================
// TARIFICATION TRANSIGO (FCFA)
// =============================================
export const BASE_FARE = 500;         // Prise en charge de base
export const PER_KM_RATE = 350;       // Prix par kilomètre
export const PER_MIN_RATE = 50;       // Prix par minute
export const MIN_FARE = 800;          // Prix minimum (même pour trajets très courts)

// ---------------------------------------------
// DYNAMIC PRICING MULTIPLIERS (Competitive Grid)
// ---------------------------------------------
const getDynamicMultiplier = (): number => {
    const hour = new Date().getHours();

    // Nuit Profonde (22h - 05h) -> Chauffeurs rares
    if (hour >= 22 || hour < 5) return 1.5;

    // Tôt Matin (05h - 07h) -> Compétitif
    if (hour >= 5 && hour < 7) return 1.1;

    // Rush Matin (07h - 10h) -> Forte demande
    if (hour >= 7 && hour < 10) return 1.3;

    // Creux Matinée (10h - 12h) -> Baseline
    if (hour >= 10 && hour < 12) return 1.0;

    // Midi (12h - 14h) -> Déplacements lunch
    if (hour >= 12 && hour < 14) return 1.1;

    // Après-midi (14h - 17h) -> Baseline
    if (hour >= 14 && hour < 17) return 1.0;

    // Rush Soir (17h - 20h) -> Max demande
    if (hour >= 17 && hour < 20) return 1.4;

    // Soirée (20h - 22h) -> Sorties
    if (hour >= 20 && hour < 22) return 1.2;

    return 1.0;
};

// Fonction principale de calcul du prix
export const calculatePrice = (distance: number, duration: number, vehicleType: VehicleType): number => {
    const option = VEHICLE_OPTIONS.find(v => v.type === vehicleType) || VEHICLE_OPTIONS[1]; // Djassa par défaut

    // Prix de base: prise en charge + distance + durée
    let basePrice = BASE_FARE + (distance * PER_KM_RATE) + (duration * PER_MIN_RATE);

    // Appliquer le multiplicateur du véhicule
    basePrice = basePrice * option.priceMultiplier;

    // Appliquer la tarification dynamique (Time-based Surge)
    basePrice = basePrice * getDynamicMultiplier();

    // Appliquer le prix minimum
    basePrice = Math.max(basePrice, MIN_FARE);

    // Arrondir à 100 FCFA près
    return Math.round(basePrice / 100) * 100;
};

export const useRideStore = create<RideState>((set, get) => ({
    ...initialState,

    // Booking actions
    setPickup: (location, address, landmark = '') =>
        set({ pickup: location, pickupAddress: address, pickupLandmark: landmark }),

    setDropoff: (location, address, landmark = '') =>
        set({ dropoff: location, dropoffAddress: address, dropoffLandmark: landmark }),

    setRouteCoordinates: (coords) =>
        set({ routeCoordinates: coords }),

    setSelectedVehicle: (vehicle) => {
        const { estimatedDistance, estimatedDuration } = get();
        const newPrice = calculatePrice(estimatedDistance, estimatedDuration, vehicle);
        set({ selectedVehicle: vehicle, estimatedPrice: newPrice });
    },

    setPaymentMethod: (method) =>
        set({ paymentMethod: method }),

    setEstimates: (price, duration, distance) =>
        set({ estimatedPrice: price, estimatedDuration: duration, estimatedDistance: distance }),

    addStop: (stop) => set((state) => ({ stops: [...state.stops, stop] })),

    removeStop: (index) => set((state) => ({
        stops: state.stops.filter((_, i) => i !== index)
    })),

    clearStops: () => set({ stops: [] }),

    // Course flow actions
    startSearching: () => set({ rideStatus: 'searching' }),

    driverAccepted: (driver, eta) => set({
        rideStatus: 'accepted',
        assignedDriver: driver,
        driverEta: eta
    }),

    driverArriving: () => set({ rideStatus: 'arriving' }),

    driverArrived: () => set({ rideStatus: 'arrived' }),

    startRide: () => set({ rideStatus: 'started' }),

    completeRide: () => set({ rideStatus: 'completed' }),

    cancelRide: () => set({ rideStatus: 'cancelled', assignedDriver: null }),

    updateDriverLocation: (location) => set({ driverLocation: location }),

    updateDriverEta: (eta) => set({ driverEta: eta }),

    // Options
    setWomenSafetyMode: (enabled) => set({ womenSafetyMode: enabled }),

    setIsSharedRide: (enabled) => set({ isSharedRide: enabled }),

    setScheduledTime: (time) => set({ scheduledTime: time }),

    // Legacy actions
    setPassengerOffer: (offer) => set({ passengerOffer: offer }),

    setAvailableDrivers: (drivers) => set({ availableDrivers: drivers }),

    setSelectedDriver: (driver) => set({ selectedDriver: driver }),

    // Reset
    resetBooking: () => set({
        pickup: null,
        dropoff: null,
        pickupAddress: '',
        dropoffAddress: '',
        pickupLandmark: '',
        dropoffLandmark: '',
        selectedVehicle: 'waka' as VehicleType,
        estimatedPrice: 0,
        estimatedDuration: 0,
        estimatedDistance: 0,
        routeCoordinates: [],
        stops: [],
    }),

    resetAll: () => set(initialState),
}));
