// =============================================
// TRANSIGO - AUTH STORE (Zustand)
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@transigo/shared';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setToken: (token) => set({ token }),

            login: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false
            }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false
            }),

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'transigo-auth',
            storage: createJSONStorage(() => secureStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);
