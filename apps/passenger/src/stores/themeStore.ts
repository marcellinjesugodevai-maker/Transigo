// =============================================
// TRANSIGO - THEME STORE
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS as BASE_COLORS } from '@/constants';

export interface ThemeColors {
    primary: string;
    primaryDark: string;
    primaryBg: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    white: string;
    border: string;
    error: string;
    success: string;
}

const LIGHT_THEME: ThemeColors = {
    primary: '#FF8C00',
    primaryDark: '#E07B00',
    primaryBg: '#FFF4E6',
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    white: '#FFFFFF',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
};

const DARK_THEME: ThemeColors = {
    primary: '#FF8C00',
    primaryDark: '#E07B00',
    primaryBg: '#2D1A00',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    white: '#FFFFFF',
    border: '#333333',
    error: '#EF5350',
    success: '#66BB6A',
};

interface ThemeStore {
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            isDark: false,
            colors: LIGHT_THEME,

            toggleTheme: () => {
                set((state) => ({
                    isDark: !state.isDark,
                    colors: !state.isDark ? DARK_THEME : LIGHT_THEME,
                }));
            },

            setTheme: (isDark) => {
                set({
                    isDark,
                    colors: isDark ? DARK_THEME : LIGHT_THEME,
                });
            },
        }),
        {
            name: 'transigo-theme',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
