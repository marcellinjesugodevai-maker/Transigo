// =============================================
// TRANSIGO - PASSENGER APP CONSTANTS
// =============================================

// Re-export from shared
// Re-export from shared with overrides for Vibrancy
import { COLORS as SHARED_COLORS } from '@transigo/shared';
export { FONTS, FONT_SIZES, SPACING, RADIUS } from '@transigo/shared';

// Override Primary Colors for Passenger App ("Vibrant Orange/Purple")
export const COLORS = {
    ...SHARED_COLORS,
    primary: '#FF6B00',       // Vibrant Orange
    primaryDark: '#E65100',   // Deep Orange
    primaryBg: '#E8D5C8',     // Rosy Beige Background
    secondary: '#7B1FA2',     // Deep Purple
    secondaryDark: '#4A148C',
    secondaryBg: '#F3E5F5',
    accent: '#00E676',        // Vibrant Green
    background: '#E8D5C8',    // Rosy Beige (unified)
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    gray: '#9E9E9E',
};

// App-specific constants
export const APP_NAME = 'TransiGo';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = __DEV__
    ? 'http://192.168.1.64:3005/api'
    : 'https://api.transigo.ci/api';

export const WS_URL = __DEV__
    ? 'ws://192.168.1.64:3005'
    : 'wss://api.transigo.ci';

// Supabase Configuration (Free tier)
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';

// Map Configuration
export const DEFAULT_LOCATION = {
    latitude: 5.3600,  // Abidjan
    longitude: -4.0083,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export const MAP_STYLE = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
};

// Animation durations
export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
};
