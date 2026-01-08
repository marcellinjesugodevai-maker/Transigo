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
}

// --- MOCK DATA ---

const MOCK_CLUBS: Club[] = [
    { id: '1', name: 'Les Aigles de Cocody', zone: 'Cocody', members: 142, avatar: '🦅', description: 'Le club des chauffeurs elite de Cocody.', lastMessage: 'Embouteillage sur le pont !', lastMessageTime: '12m', unread: 2 },
    { id: '2', name: 'Yopougon Express', zone: 'Yopougon', members: 89, avatar: '⚡', description: 'Rapidité et efficacité à Yopougon.', unread: 0 },
    { id: '3', name: 'Marcory V.I.P', zone: 'Marcory', members: 56, avatar: '💎', description: 'Service premium pour la zone 4.', unread: 5 },
];

const MOCK_CHALLENGES: Challenge[] = [
    { id: 'c1', title: 'Roi du Matin', description: 'Faire 5 courses entre 6h et 9h', target: 5, current: 2, reward: 500, expiresIn: '12h', type: 'rides' },
    { id: 'c2', title: 'Week-end Guerrier', description: 'Gagner 50.000F ce week-end', target: 50000, current: 15000, reward: 1000, expiresIn: '2j', type: 'earnings' },
];

const MOCK_PREDICTIONS: ZonePrediction[] = [
    { id: 'z1', zone: 'Cocody Centre', currentDemand: 'high', predictedDemand: 'surge', confidence: 85, trend: 'up', surgeMultiplier: 1.2, reason: 'Sorties bureaux', changePercent: 45, inMinutes: 15, recommendation: 'Allez-y maintenant' },
    { id: 'z2', zone: 'Plateau', currentDemand: 'medium', predictedDemand: 'high', confidence: 70, trend: 'up', surgeMultiplier: 1.0, reason: 'Conférence', changePercent: 30, inMinutes: 30, recommendation: 'Préparez-vous' },
    { id: 'z3', zone: 'Aéroport FHB', currentDemand: 'low', predictedDemand: 'surge', confidence: 90, trend: 'up', surgeMultiplier: 1.5, reason: 'Vol AF703', changePercent: 90, inMinutes: 60, recommendation: 'Captez les arrivées' },
];

// --- STORE ---

export const useDriverPremiumsStore = create<DriverPremiumState>((set, get) => ({
    // Initial State
    xp: 2450,
    level: 3, // Bronze
    gloryPoints: 120,
    streakDays: 4,

    joinedClubs: [],
    availableClubs: MOCK_CLUBS,

    activeChallenges: MOCK_CHALLENGES,

    predictions: MOCK_PREDICTIONS,
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
        balance: 15000,
        goal: 100000,
        autoSavePercentage: 5,
    },

    // Actions implementation
    addXp: (amount) => set((state) => {
        const newXp = state.xp + amount;
        // Simple level logic: 1000xp per level
        const newLevel = Math.floor(newXp / 1000) + 1;
        return { xp: newXp, level: newLevel };
    }),

    joinClub: (club) => set((state) => ({
        joinedClubs: [...state.joinedClubs, club],
        availableClubs: state.availableClubs.filter(c => c.id !== club.id)
    })),

    leaveClub: (clubId) => set((state) => {
        const club = state.joinedClubs.find(c => c.id === clubId);
        if (!club) return state;
        return {
            joinedClubs: state.joinedClubs.filter(c => c.id !== clubId),
            availableClubs: [...state.availableClubs, club]
        };
    }),

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

    refreshPredictions: () => set((state) => {
        // Mock refresh: shuffle demand
        const demands: ('low' | 'medium' | 'high' | 'surge')[] = ['low', 'medium', 'high', 'surge'];
        const newPredictions = state.predictions.map(p => ({
            ...p,
            currentDemand: demands[Math.floor(Math.random() * demands.length)],
            trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down',
        }));
        return { predictions: newPredictions, lastPredictionUpdate: new Date() };
    }),

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
