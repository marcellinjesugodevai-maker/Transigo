// =============================================
// TRANSIGO - CONSTANTES PARTAGÉES
// =============================================

// ============ COULEURS (Charte Graphique) ============
export const COLORS = {
    // Couleurs principales
    primary: '#FF6B00',      // Orange
    secondary: '#00C853',    // Vert
    white: '#E8D5C8',        // Rosy Beige (unified theme)
    black: '#1A1A2E',

    // Nuances d'orange
    primaryLight: '#FF8A3D',
    primaryDark: '#E55A00',
    primaryBg: '#FFF3E8',

    // Nuances de vert
    secondaryLight: '#4ADE80',
    secondaryDark: '#00A344',
    secondaryBg: '#E8FFF0',

    // Gris
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Sémantiques
    success: '#00C853',
    warning: '#FFB300',
    error: '#FF3D00',
    info: '#2196F3',

    // Fond
    background: '#E8D5C8',   // Rosy Beige
    backgroundDark: '#1A1A2E',
    surface: '#FFFFFF',      // Keep pure white for cards
    surfaceDark: '#252542',

    // Texte
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#FFFFFF',
    textMuted: '#9E9E9E',
} as const;

// ============ TYPOGRAPHY ============
export const FONTS = {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
} as const;

export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
} as const;

// ============ SPACING ============
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
} as const;

// ============ BORDER RADIUS ============
export const RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
} as const;

// ============ COMMISSION ============
export const COMMISSION_RATE = 0.12; // 12%

// ============ PRIX ============
export const PRICING = {
    // Prix par km selon le type de service
    perKm: {
        car: 200,      // FCFA/km
        car_ac: 250,   // FCFA/km
        moto: 100,     // FCFA/km
        delivery: 150, // FCFA/km
        food: 150,     // FCFA/km
    },
    // Prix par minute
    perMinute: {
        car: 10,
        car_ac: 15,
        moto: 5,
        delivery: 10,
        food: 10,
    },
    // Prix de base
    baseFare: {
        car: 500,
        car_ac: 700,
        moto: 300,
        delivery: 500,
        food: 500,
    },
    // Prix minimum
    minimumFare: {
        car: 1000,
        car_ac: 1500,
        moto: 500,
        delivery: 1000,
        food: 1000,
    },
} as const;

// ============ ABONNEMENTS ============
export const SUBSCRIPTION_PLANS = {
    basic: {
        id: 'basic' as const,
        name: 'Basic',
        nameFr: 'Basic',
        price: 20000,
        ridesIncluded: 15,
        discount: 25,
        features: ['15 courses incluses', 'Économie de 25%'],
    },
    pro: {
        id: 'pro' as const,
        name: 'Pro',
        nameFr: 'Pro',
        price: 45000,
        ridesIncluded: 40,
        discount: 35,
        features: ['40 courses incluses', 'Économie de 35%', 'Priorité chauffeurs'],
    },
    unlimited: {
        id: 'unlimited' as const,
        name: 'Unlimited',
        nameFr: 'Illimité',
        price: 90000,
        ridesIncluded: -1, // Illimité
        discount: 50,
        features: ['Courses illimitées', 'Véhicules Premium', '0 attente garantie'],
    },
    student: {
        id: 'student' as const,
        name: 'Student',
        nameFr: 'Étudiant',
        price: 10000,
        ridesIncluded: 10,
        discount: 30,
        features: ['10 courses incluses', '-30% sur toutes les courses'],
    },
} as const;

// ============ LOTERIE ============
export const LOTTERY_PRIZES = [
    { position: 1, amount: 100000 },
    { position: 2, amount: 50000 },
    { position: 3, amount: 25000 },
    { position: 4, amount: 5000 },
    { position: 5, amount: 5000 },
    { position: 6, amount: 5000 },
    { position: 7, amount: 5000 },
    { position: 8, amount: 5000 },
    { position: 9, amount: 5000 },
    { position: 10, amount: 5000 },
] as const;

// ============ NIVEAUX CHAUFFEUR ============
export const DRIVER_LEVELS = {
    bronze: {
        id: 'bronze' as const,
        name: 'Bronze',
        minRides: 0,
        commission: 0.12,
        benefits: ['Commission standard 12%'],
    },
    silver: {
        id: 'silver' as const,
        name: 'Argent',
        minRides: 100,
        commission: 0.11,
        benefits: ['Commission réduite 11%', 'Badge visible'],
    },
    gold: {
        id: 'gold' as const,
        name: 'Or',
        minRides: 300,
        commission: 0.10,
        benefits: ['Commission réduite 10%', 'Priorité courses Premium', 'Badge Or'],
    },
    platinum: {
        id: 'platinum' as const,
        name: 'Platine',
        minRides: 500,
        commission: 0.09,
        benefits: ['Commission réduite 9%', 'Accès VIP Events', 'Badge Platine'],
    },
    diamond: {
        id: 'diamond' as const,
        name: 'Diamant',
        minRides: 1000,
        commission: 0.08,
        benefits: ['Commission minimale 8%', 'Tous les avantages', 'Badge Diamant'],
    },
} as const;

// ============ ÉVÉNEMENTS VIP ============
export const VIP_PRICES = {
    wedding: {
        cortege5: 150000, // 5 véhicules
        cortege3: 100000, // 3 véhicules
        single: 50000,    // 1 véhicule
    },
    luxury4h: 50000,   // 4 heures
    airportVip: 35000, // Transfert aéroport VIP
} as const;

// ============ LIEUX POPULAIRES ABIDJAN ============
export const POPULAR_PLACES = [
    { name: 'Aéroport FHB', location: { latitude: 5.2567, longitude: -3.9262 } },
    { name: 'Plateau - Centre-ville', location: { latitude: 5.3167, longitude: -4.0167 } },
    { name: 'Cocody - Riviera', location: { latitude: 5.3500, longitude: -3.9833 } },
    { name: 'Yopougon', location: { latitude: 5.3333, longitude: -4.0833 } },
    { name: 'Adjamé - Gare routière', location: { latitude: 5.3500, longitude: -4.0333 } },
    { name: 'Marcory', location: { latitude: 5.3000, longitude: -3.9833 } },
    { name: 'Treichville', location: { latitude: 5.2833, longitude: -4.0000 } },
    { name: 'Port-Bouët', location: { latitude: 5.2500, longitude: -3.9333 } },
] as const;

// ============ LANGUES ============
export const LANGUAGES = {
    fr: { code: 'fr', name: 'Français', nativeName: 'Français' },
    dioula: { code: 'dioula', name: 'Dioula', nativeName: 'Dioula' },
    baoule: { code: 'baoule', name: 'Baoulé', nativeName: 'Baoulé' },
    en: { code: 'en', name: 'English', nativeName: 'English' },
} as const;

// ============ RÉDUCTION ÉTUDIANTS ============
export const STUDENT_DISCOUNT = 0.30; // 30%

// ============ NUMÉROS D'URGENCE CI ============
export const EMERGENCY_NUMBERS = {
    police: '111',
    pompiers: '180',
    samu: '185',
    transigo: '1234', // Numéro TransiGo
} as const;

// ============ API ENDPOINTS ============
export const API_ENDPOINTS = {
    auth: '/auth',
    users: '/users',
    drivers: '/drivers',
    rides: '/rides',
    payments: '/payments',
    wallet: '/wallet',
    lottery: '/lottery',
    subscriptions: '/subscriptions',
    deliveries: '/deliveries',
    food: '/food',
    vipEvents: '/vip-events',
    notifications: '/notifications',
    referrals: '/referrals',
} as const;

// ============ WEBSOCKET EVENTS ============
export const WS_EVENTS = {
    // Ride events
    RIDE_REQUEST: 'ride:request',
    RIDE_ACCEPTED: 'ride:accepted',
    RIDE_REJECTED: 'ride:rejected',
    RIDE_CANCELLED: 'ride:cancelled',
    RIDE_STARTED: 'ride:started',
    RIDE_COMPLETED: 'ride:completed',
    RIDE_OFFER: 'ride:offer',
    RIDE_COUNTER_OFFER: 'ride:counter_offer',

    // Location events
    DRIVER_LOCATION: 'driver:location',
    PASSENGER_LOCATION: 'passenger:location',

    // Chat events
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',

    // Driver events
    DRIVER_ONLINE: 'driver:online',
    DRIVER_OFFLINE: 'driver:offline',

    // Notifications
    NOTIFICATION: 'notification',
} as const;
