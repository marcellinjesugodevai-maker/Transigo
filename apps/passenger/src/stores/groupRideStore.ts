// =============================================
// TRANSIGO - GROUP RIDE STORE
// =============================================

import { create } from 'zustand';

export interface Location {
    address: string;
    latitude: number;
    longitude: number;
}

export interface GroupParticipant {
    id: string;
    userId?: string;
    phone: string;
    name: string;
    status: 'pending' | 'paid' | 'declined';
    amount: number;
    paidAt?: Date;
}

export interface GroupRide {
    id: string;
    initiatorId: string;
    initiatorName: string;
    participants: GroupParticipant[];
    totalPrice: number;
    rideDetails: {
        pickup: Location;
        dropoff: Location;
        vehicleType: string;
        vehicleCount: number;
        scheduledTime?: Date;
    };
    status: 'awaiting_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
    expiresAt: Date;
}

interface GroupRideStore {
    currentGroupRide: GroupRide | null;

    createGroupRide: (details: {
        pickup: Location;
        dropoff: Location;
        vehicleType: string;
        totalPrice: number;
        initiatorName: string;
    }) => void;

    addParticipant: (participant: Omit<GroupParticipant, 'id' | 'status' | 'amount'>) => void;

    removeParticipant: (participantId: string) => void;

    confirmParticipantPayment: (participantId: string) => void;

    declineParticipant: (participantId: string) => void;

    confirmGroupRide: () => void;

    cancelGroupRide: () => void;

    clearCurrentRide: () => void;

    isAllPaid: () => boolean;

    getPendingCount: () => number;
}

export const useGroupRideStore = create<GroupRideStore>((set, get) => ({
    currentGroupRide: null,

    createGroupRide: (details) => {
        const groupRide: GroupRide = {
            id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            initiatorId: 'current_user_id', // TODO: Get from auth store
            initiatorName: details.initiatorName,
            participants: [],
            totalPrice: details.totalPrice,
            rideDetails: {
                pickup: details.pickup,
                dropoff: details.dropoff,
                vehicleType: details.vehicleType,
                vehicleCount: 1,
            },
            status: 'awaiting_payment',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        };
        set({ currentGroupRide: groupRide });
    },

    addParticipant: (participant) => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            const totalPeople = state.currentGroupRide.participants.length + 2; // +2 for initiator and new participant
            const amountPerPerson = Math.round(state.currentGroupRide.totalPrice / totalPeople);

            const newParticipant: GroupParticipant = {
                ...participant,
                id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'pending',
                amount: amountPerPerson,
            };

            // Recalculate amounts for all
            const updatedParticipants = [
                ...state.currentGroupRide.participants,
                newParticipant,
            ].map(p => ({ ...p, amount: amountPerPerson }));

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    participants: updatedParticipants,
                },
            };
        });
    },

    removeParticipant: (participantId) => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            const updatedParticipants = state.currentGroupRide.participants.filter(
                (p) => p.id !== participantId
            );

            const totalPeople = updatedParticipants.length + 1; // +1 for initiator
            const amountPerPerson = Math.round(state.currentGroupRide.totalPrice / totalPeople);

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    participants: updatedParticipants.map(p => ({ ...p, amount: amountPerPerson })),
                },
            };
        });
    },

    confirmParticipantPayment: (participantId) => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    participants: state.currentGroupRide.participants.map((p) =>
                        p.id === participantId
                            ? { ...p, status: 'paid' as const, paidAt: new Date() }
                            : p
                    ),
                },
            };
        });
    },

    declineParticipant: (participantId) => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    participants: state.currentGroupRide.participants.map((p) =>
                        p.id === participantId ? { ...p, status: 'declined' as const } : p
                    ),
                },
            };
        });
    },

    confirmGroupRide: () => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    status: 'confirmed',
                },
            };
        });
    },

    cancelGroupRide: () => {
        set((state) => {
            if (!state.currentGroupRide) return state;

            return {
                currentGroupRide: {
                    ...state.currentGroupRide,
                    status: 'cancelled',
                },
            };
        });
    },

    clearCurrentRide: () => {
        set({ currentGroupRide: null });
    },

    isAllPaid: () => {
        const state = get();
        if (!state.currentGroupRide) return false;

        return state.currentGroupRide.participants.every(
            (p) => p.status === 'paid' || p.status === 'declined'
        );
    },

    getPendingCount: () => {
        const state = get();
        if (!state.currentGroupRide) return 0;

        return state.currentGroupRide.participants.filter((p) => p.status === 'pending').length;
    },
}));
