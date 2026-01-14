// =============================================
// TRANSIGO DRIVER - PREMIUM FEATURES STORE
// Gestion Gamification, IA, Clubs, Premium
// =============================================

import { create } from 'zustand';

// --- TYPES ---

export interface Club {
    id: string;
    name: string;
    zone: string;
    members: number;
    avatar: string; // Renamed from image
    description: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unread?: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    reward: number; // XP ou Points
    expiresIn: string; // "2j 5h"
    type: 'rides' | 'earnings' | 'rating';
}

export interface ZonePrediction {
    id: string;
    zone: string; // Renamed from name
    currentDemand: 'low' | 'medium' | 'high' | 'surge';
    predictedDemand: 'low' | 'medium' | 'high' | 'surge';
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    surgeMultiplier: number;
    // New UI fields
    reason: string;
    changePercent: number;
    inMinutes: number;
    recommendation: string;
    distance?: number;
}

export interface PremiumPlan {
    id: 'free' | 'pro' | 'gold';
    name: string;
    price: number;
    commissionRate: number;
    features: string[];
}

export interface DriverPremiumState {
    // Gamification
    xp: number;
    level: number;
    gloryPoints: number; // Pour acheter des trucs ou classement
    streakDays: number;

    // Clubs
    joinedClubs: Club[];
    availableClubs: Club[];

    // Challenges
    activeChallenges: Challenge[];

    // IA Predictions
    predictions: ZonePrediction[];
    lastPredictionUpdate: Date;

    // Home Mode
    homeMode: {
        active: boolean;
        address: string;
        lat: number;
        lng: number;
        radius: number; // km
    };

    // Premium Subscription
    subscription: {
        plan: 'free' | 'pro' | 'gold';
        expiresAt: Date | null;
        autoRenew: boolean;
    };

    // Wallet Savings
    savings: {
        balance: number;
        goal: number;
        autoSavePercentage: number;
    };

    // --- ACTIONS ---
    addXp: (amount: number) => void;
    joinClub: (club: Club) => void;
    leaveClub: (clubId: string) => void;
    toggleHomeMode: () => void;
    setHomeAddress: (address: string, lat?: number, lng?: number) => void;
    subscribe: (planId: 'free' | 'pro' | 'gold') => void;
    refreshPredictions: () => void;
    addToSavings: (amount: number) => void;
    withdrawSavings: (amount: number) => void;
    completeChallenge: (id: string) => void;
    fetchData: () => Promise<void>;
}

// --- STORE ---

import { premiumsService } from '../services/premiumsService';
import { useDriverStore } from './driverStore';

export const useDriverPremiumsStore = create<DriverPremiumState>((set, get) => ({
    // Initial State
    xp: 0,
    level: 1,
    gloryPoints: 0,
    streakDays: 0,

    joinedClubs: [],
    availableClubs: [],

    activeChallenges: [],

    predictions: [],
    lastPredictionUpdate: new Date(),

    homeMode: {
        active: false,
        address: 'Domicile',
        lat: 5.3500,
        lng: -4.0000,
        radius: 2,
    },

    subscription: {
        plan: 'free',
        expiresAt: null,
        autoRenew: false,
    },

    savings: {
        balance: 15000, // Mock for now, needs DB field
        goal: 100000,
        autoSavePercentage: 5,
    },

    // Actions implementation

    // Initial Load
    fetchData: async () => {
        const driverId = useDriverStore.getState().driver?.id;
        if (!driverId) return;

        // Load Stats
        const { stats } = await premiumsService.getDriverStats(driverId);
        if (stats) set({
            xp: stats.xp || 0,
            level: stats.level || 1,
            streakDays: stats.streak_days || 0,
            gloryPoints: stats.glory_points || 0
        });

        // Load Predictions
        const { predictions } = await premiumsService.getPredictions();
        if (predictions) set({ predictions });

        // Load Challenges
        const { challenges } = await premiumsService.getChallenges(driverId);
        if (challenges) set({ activeChallenges: challenges });

        // Load Clubs
        const { clubs: myClubs } = await premiumsService.getMyClubs(driverId);
        if (myClubs) set({ joinedClubs: myClubs });

        const { clubs: allClubs } = await premiumsService.getClubs();
        if (allClubs) {
            // Filter out joined clubs
            const joinedIds = new Set(myClubs?.map(c => c.id) || []);
            set({ availableClubs: allClubs.filter(c => !joinedIds.has(c.id)) });
        }
    },

    addXp: async (amount) => {
        const driverId = useDriverStore.getState().driver?.id;
        if (!driverId) return;

        // Optimistic update
        set((state) => {
            const newXp = state.xp + amount;
            const newLevel = Math.floor(newXp / 1000) + 1;
            return { xp: newXp, level: newLevel };
        });

        await premiumsService.addXp(driverId, amount);
    },

    joinClub: async (club) => {
        const driverId = useDriverStore.getState().driver?.id;
        if (!driverId) return;

        await premiumsService.joinClub(driverId, club.id);

        set((state) => ({
            joinedClubs: [...state.joinedClubs, club],
            availableClubs: state.availableClubs.filter(c => c.id !== club.id)
        }));
    },

    leaveClub: async (clubId) => {
        const driverId = useDriverStore.getState().driver?.id;
        if (!driverId) return;

        await premiumsService.leaveClub(driverId, clubId);

        set((state) => {
            const club = state.joinedClubs.find(c => c.id === clubId);
            if (!club) return state;
            return {
                joinedClubs: state.joinedClubs.filter(c => c.id !== clubId),
                availableClubs: [...state.availableClubs, club]
            };
        });
    },

    toggleHomeMode: () => set((state) => ({
        homeMode: { ...state.homeMode, active: !state.homeMode.active }
    })),

    setHomeAddress: (address, lat = 5.35, lng = -4.00) => set((state) => ({
        homeMode: { ...state.homeMode, address, lat, lng }
    })),

    subscribe: (planId) => set((state) => ({
        subscription: {
            plan: planId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            autoRenew: true
        }
    })),

    refreshPredictions: async () => {
        const { predictions } = await premiumsService.getPredictions();
        if (predictions) {
            set({ predictions, lastPredictionUpdate: new Date() });
        }
    },

    addToSavings: (amount) => set((state) => ({
        savings: { ...state.savings, balance: state.savings.balance + amount }
    })),

    withdrawSavings: (amount) => set((state) => ({
        savings: { ...state.savings, balance: Math.max(0, state.savings.balance - amount) }
    })),

    completeChallenge: (id) => set((state) => ({
        activeChallenges: state.activeChallenges.filter(c => c.id !== id),
        xp: state.xp + (state.activeChallenges.find(c => c.id === id)?.reward || 0)
    })),
}));
