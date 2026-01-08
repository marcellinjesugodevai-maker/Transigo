// =============================================
// TRANSIGO DRIVER - DRIVER STORE
// État global du chauffeur avec Zustand
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Types
export interface DriverProfile {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender?: 'male' | 'female';
    avatar?: string;
    rating: number;
    totalRides: number;
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    commissionRate: number;
    joinedAt: Date;
    isVerified: boolean; // Statut de validation par Admin
    vehiclePlate?: string; // Pour détecter le statut "PENDING"
    profileType?: 'driver' | 'delivery' | 'seller';
}

export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    type: 'standard' | 'comfort' | 'premium' | 'moto';
}

export interface DriverStats {
    todayEarnings: number;
    todayRides: number;
    todayHours: number;
    todayTips: number;
    weekEarnings: number;
    weekRides: number;
    monthEarnings: number;
    monthRides: number;
    acceptRate: number;
    cancelRate: number;
    onlineTime: number; // en minutes
}

export interface DriverPreferences {
    preferredZones: string[];
    avoidZones: string[];
    maxPickupDistance: number; // en km
    minRidePrice: number;
    preferShortRides: boolean;
    homeDirection?: { lat: number; lng: number; address: string };
    workHours: { start: string; end: string };
}

interface DriverState {
    // Profile
    driver: DriverProfile | null;
    vehicle: Vehicle | null;

    // Status
    isOnline: boolean;
    isOnRide: boolean;
    currentLocation: { lat: number; lng: number } | null;

    // Stats
    stats: DriverStats;

    // Preferences
    preferences: DriverPreferences;

    // Actions
    setDriver: (driver: DriverProfile) => void;
    setVehicle: (vehicle: Vehicle) => void;
    goOnline: () => void;
    goOffline: () => void;
    updateLocation: (lat: number, lng: number) => void;
    updateStats: (stats: Partial<DriverStats>) => void;
    addEarning: (amount: number, tip?: number) => void;
    completeRide: () => void;
    updatePreferences: (prefs: Partial<DriverPreferences>) => void;
    getLevel: () => { level: string; commission: number; nextLevel: string | null; ridesNeeded: number };
}

// Calcul du niveau basé sur les courses
const calculateLevel = (totalRides: number): { level: DriverProfile['level']; commission: number } => {
    if (totalRides >= 1000) return { level: 'diamond', commission: 5 };
    if (totalRides >= 500) return { level: 'platinum', commission: 8 };
    if (totalRides >= 300) return { level: 'gold', commission: 10 };
    if (totalRides >= 100) return { level: 'silver', commission: 12 };
    return { level: 'bronze', commission: 15 };
};

const LEVEL_THRESHOLDS = {
    bronze: { min: 0, max: 99, next: 'silver', nextAt: 100 },
    silver: { min: 100, max: 299, next: 'gold', nextAt: 300 },
    gold: { min: 300, max: 499, next: 'platinum', nextAt: 500 },
    platinum: { min: 500, max: 999, next: 'diamond', nextAt: 1000 },
    diamond: { min: 1000, max: Infinity, next: null, nextAt: 0 },
};

// Custom storage for SecureStore
const secureStorage = {
    getItem: async (name: string) => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string) => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string) => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useDriverStore = create<DriverState>()(
    persist(
        (set, get) => ({
            // Initial state (empty because it will be loaded from storage)
            driver: null,
            vehicle: null,

            isOnline: false,
            isOnRide: false,
            currentLocation: { lat: 5.3499, lng: -4.0166 }, // Abidjan

            stats: {
                todayEarnings: 0,
                todayRides: 0,
                todayHours: 0,
                todayTips: 0,
                weekEarnings: 0,
                weekRides: 0,
                monthEarnings: 0,
                monthRides: 0,
                acceptRate: 100,
                cancelRate: 0,
                onlineTime: 0,
            },

            preferences: {
                preferredZones: ['Cocody', 'Plateau', 'Marcory'],
                avoidZones: ['Abobo Nord'],
                maxPickupDistance: 5,
                minRidePrice: 1500,
                preferShortRides: false,
                homeDirection: { lat: 5.3700, lng: -3.9800, address: 'Cocody Riviera 3' },
                workHours: { start: '06:00', end: '22:00' },
            },

            // Actions
            setDriver: (driver) => set({ driver }),

            setVehicle: (vehicle) => set({ vehicle }),

            goOnline: () => set({ isOnline: true }),

            goOffline: () => set({ isOnline: false }),

            updateLocation: (lat, lng) => set({ currentLocation: { lat, lng } }),

            updateStats: (newStats) => set((state) => ({
                stats: { ...state.stats, ...newStats },
            })),

            addEarning: (amount, tip = 0) => set((state) => ({
                stats: {
                    ...state.stats,
                    todayEarnings: state.stats.todayEarnings + amount,
                    todayRides: state.stats.todayRides + 1,
                    todayTips: state.stats.todayTips + tip,
                    weekEarnings: state.stats.weekEarnings + amount,
                    weekRides: state.stats.weekRides + 1,
                    monthEarnings: state.stats.monthEarnings + amount,
                    monthRides: state.stats.monthRides + 1,
                },
                driver: state.driver ? {
                    ...state.driver,
                    totalRides: state.driver.totalRides + 1,
                    ...calculateLevel(state.driver.totalRides + 1),
                } : null,
            })),

            completeRide: () => set({ isOnRide: false }),

            updatePreferences: (prefs) => set((state) => ({
                preferences: { ...state.preferences, ...prefs },
            })),

            getLevel: () => {
                const { driver } = get();
                if (!driver) return { level: 'bronze', commission: 15, nextLevel: 'silver', ridesNeeded: 100 };

                const threshold = LEVEL_THRESHOLDS[driver.level];
                return {
                    level: driver.level,
                    commission: driver.commissionRate,
                    nextLevel: threshold.next,
                    ridesNeeded: threshold.next ? threshold.nextAt - driver.totalRides : 0,
                };
            },
        }),
        {
            name: 'transigo-driver-storage',
            storage: createJSONStorage(() => secureStorage),
            partialize: (state) => ({
                driver: state.driver,
                vehicle: state.vehicle,
                preferences: state.preferences
            }),
        }
    )
);
