// =============================================
// TRANSIGO - RECURRING RIDE STORE
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Location {
    address: string;
    latitude: number;
    longitude: number;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface RecurringRide {
    id: string;
    pickup: Location;
    dropoff: Location;
    days: DayOfWeek[];
    time: string; // "07:30"
    vehicleType: 'classic' | 'comfort' | 'xl';
    preferredDriverId?: string;
    preferredDriverName?: string;
    monthlyPrice: number;
    pricePerRide: number;
    estimatedRidesPerMonth: number;
    status: 'active' | 'paused' | 'expired';
    startDate: Date;
    endDate?: Date;
    completedRides: number;
    createdAt: Date;
}

interface RecurringRideStore {
    rides: RecurringRide[];
    addRide: (ride: Omit<RecurringRide, 'id' | 'completedRides' | 'createdAt'>) => void;
    updateRide: (id: string, updates: Partial<RecurringRide>) => void;
    togglePause: (id: string) => void;
    deleteRide: (id: string) => void;
    getRideById: (id: string) => RecurringRide | undefined;
    getActiveRides: () => RecurringRide[];
}

export const useRecurringRideStore = create<RecurringRideStore>()(
    persist(
        (set, get) => ({
            rides: [],

            addRide: (ride) => {
                const newRide: RecurringRide = {
                    ...ride,
                    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    completedRides: 0,
                    createdAt: new Date(),
                };
                set((state) => ({
                    rides: [...state.rides, newRide],
                }));
            },

            updateRide: (id, updates) => {
                set((state) => ({
                    rides: state.rides.map((ride) =>
                        ride.id === id ? { ...ride, ...updates } : ride
                    ),
                }));
            },

            togglePause: (id) => {
                set((state) => ({
                    rides: state.rides.map((ride) =>
                        ride.id === id
                            ? { ...ride, status: ride.status === 'active' ? 'paused' : 'active' }
                            : ride
                    ),
                }));
            },

            deleteRide: (id) => {
                set((state) => ({
                    rides: state.rides.filter((ride) => ride.id !== id),
                }));
            },

            getRideById: (id) => {
                return get().rides.find((ride) => ride.id === id);
            },

            getActiveRides: () => {
                return get().rides.filter((ride) => ride.status === 'active');
            },
        }),
        {
            name: 'transigo-recurring-rides',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
