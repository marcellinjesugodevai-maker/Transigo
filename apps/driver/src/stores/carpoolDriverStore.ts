// Driver Carpool Store (Zustand)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type SharedRide = {
    id: string;
    driver_id: string | null;
    passenger_id: string;
    pickup_lat: number;
    pickup_lon: number;
    dest_lat: number;
    dest_lon: number;
    status: 'open' | 'accepted' | 'completed';
    created_at: string;
    updated_at: string;
};

type CarpoolDriverState = {
    sharedRides: SharedRide[];
    setSharedRides: (rides: SharedRide[]) => void;
    addSharedRide: (ride: SharedRide) => void;
    updateRideStatus: (id: string, status: SharedRide['status']) => void;
};

export const useCarpoolDriverStore = create<CarpoolDriverState>()(
    devtools(
        persist(
            (set) => ({
                sharedRides: [],
                setSharedRides: (rides) => set({ sharedRides: rides }),
                addSharedRide: (ride) =>
                    set((state) => {
                        const exists = state.sharedRides.some((r) => r.id === ride.id);
                        if (exists) return state;
                        return { sharedRides: [...state.sharedRides, ride] };
                    }),
                updateRideStatus: (id, status) =>
                    set((state) => ({
                        sharedRides: state.sharedRides.map((r) =>
                            r.id === id ? { ...r, status } : r
                        ),
                    })),
            }),
            { name: 'driver-carpool-store' }
        )
    )
);
