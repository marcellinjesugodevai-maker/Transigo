// =============================================
// TRANSIGO - RECURRING RIDE STORE (Zustand + Supabase)
// =============================================

import { create } from 'zustand';
import { recurringRidesService, RecurringRideDB, CreateRecurringRideInput } from '@/services/recurringRidesService';

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
    time: string;
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

// Convertir DB vers local
const dbToLocal = (db: RecurringRideDB): RecurringRide => ({
    id: db.id,
    pickup: {
        address: db.pickup_address,
        latitude: db.pickup_lat,
        longitude: db.pickup_lon,
    },
    dropoff: {
        address: db.dropoff_address,
        latitude: db.dropoff_lat,
        longitude: db.dropoff_lon,
    },
    days: db.days_of_week as DayOfWeek[],
    time: db.departure_time,
    vehicleType: db.vehicle_type as 'classic' | 'comfort' | 'xl',
    preferredDriverId: db.preferred_driver_id,
    preferredDriverName: db.preferred_driver_name,
    monthlyPrice: db.monthly_price || db.price_per_ride * db.estimated_rides_per_month,
    pricePerRide: db.price_per_ride,
    estimatedRidesPerMonth: db.estimated_rides_per_month,
    status: db.status as 'active' | 'paused' | 'expired',
    startDate: new Date(db.start_date),
    endDate: db.end_date ? new Date(db.end_date) : undefined,
    completedRides: db.completed_rides,
    createdAt: new Date(db.created_at),
});

interface RecurringRideStore {
    rides: RecurringRide[];
    isLoading: boolean;
    error: string | null;

    // Actions locales
    setRides: (rides: RecurringRide[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Actions Supabase
    fetchRides: () => Promise<void>;
    addRide: (input: {
        pickup: Location;
        dropoff: Location;
        days: DayOfWeek[];
        time: string;
        vehicleType: string;
        pricePerRide: number;
        preferredDriverId?: string;
        preferredDriverName?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    updateRide: (id: string, updates: Partial<RecurringRide>) => Promise<{ success: boolean }>;
    togglePause: (id: string) => Promise<{ success: boolean }>;
    deleteRide: (id: string) => Promise<{ success: boolean }>;

    // Helpers
    getRideById: (id: string) => RecurringRide | undefined;
    getActiveRides: () => RecurringRide[];
}

export const useRecurringRideStore = create<RecurringRideStore>((set, get) => ({
    rides: [],
    isLoading: false,
    error: null,

    setRides: (rides) => set({ rides }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    fetchRides: async () => {
        set({ isLoading: true, error: null });
        const { rides, error } = await recurringRidesService.getMyRecurringRides();
        if (error) {
            set({ isLoading: false, error: 'Erreur de chargement' });
        } else {
            set({ rides: rides.map(dbToLocal), isLoading: false });
        }
    },

    addRide: async (input) => {
        set({ isLoading: true });
        const serviceInput: CreateRecurringRideInput = {
            pickup: { address: input.pickup.address, lat: input.pickup.latitude, lon: input.pickup.longitude },
            dropoff: { address: input.dropoff.address, lat: input.dropoff.latitude, lon: input.dropoff.longitude },
            daysOfWeek: input.days,
            departureTime: input.time,
            vehicleType: input.vehicleType,
            pricePerRide: input.pricePerRide,
            preferredDriverId: input.preferredDriverId,
            preferredDriverName: input.preferredDriverName,
        };

        const { ride, error } = await recurringRidesService.createRecurringRide(serviceInput);
        set({ isLoading: false });

        if (error || !ride) {
            return { success: false, error: 'Erreur de création' };
        }

        // Ajouter au state local
        set((state) => ({
            rides: [dbToLocal(ride), ...state.rides],
        }));

        return { success: true };
    },

    updateRide: async (id, updates) => {
        const serviceUpdates: any = {};
        if (updates.pickup) {
            serviceUpdates.pickup = {
                address: updates.pickup.address,
                lat: updates.pickup.latitude,
                lon: updates.pickup.longitude,
            };
        }
        if (updates.dropoff) {
            serviceUpdates.dropoff = {
                address: updates.dropoff.address,
                lat: updates.dropoff.latitude,
                lon: updates.dropoff.longitude,
            };
        }
        if (updates.days) serviceUpdates.daysOfWeek = updates.days;
        if (updates.time) serviceUpdates.departureTime = updates.time;
        if (updates.vehicleType) serviceUpdates.vehicleType = updates.vehicleType;
        if (updates.pricePerRide) serviceUpdates.pricePerRide = updates.pricePerRide;
        if (updates.status) serviceUpdates.status = updates.status;

        const { success } = await recurringRidesService.updateRecurringRide(id, serviceUpdates);

        if (success) {
            set((state) => ({
                rides: state.rides.map((r) => (r.id === id ? { ...r, ...updates } : r)),
            }));
        }

        return { success };
    },

    togglePause: async (id) => {
        const ride = get().rides.find((r) => r.id === id);
        if (!ride) return { success: false };

        const { success } = await recurringRidesService.togglePause(id, ride.status);

        if (success) {
            set((state) => ({
                rides: state.rides.map((r) =>
                    r.id === id
                        ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
                        : r
                ),
            }));
        }

        return { success };
    },

    deleteRide: async (id) => {
        const { success } = await recurringRidesService.deleteRecurringRide(id);

        if (success) {
            set((state) => ({
                rides: state.rides.filter((r) => r.id !== id),
            }));
        }

        return { success };
    },

    getRideById: (id) => get().rides.find((r) => r.id === id),

    getActiveRides: () => get().rides.filter((r) => r.status === 'active'),
}));
