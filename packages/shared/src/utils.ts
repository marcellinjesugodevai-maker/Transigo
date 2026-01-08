// =============================================
// TRANSIGO - UTILITAIRES PARTAGÉS
// =============================================

import { PRICING, COMMISSION_RATE, STUDENT_DISCOUNT, DRIVER_LEVELS } from './constants';
import type { ServiceType, DriverLevel, Location } from './types';

// ============ CALCUL DE PRIX ============

/**
 * Calcule le prix d'une course
 */
export function calculateRidePrice(
    serviceType: ServiceType,
    distanceMeters: number,
    durationSeconds: number,
    options?: {
        isStudent?: boolean;
        isShared?: boolean;
        sharedPassengers?: number;
    }
): {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    subtotal: number;
    discount: number;
    total: number;
    commission: number;
    driverEarnings: number;
} {
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = durationSeconds / 60;

    const baseFare = PRICING.baseFare[serviceType];
    const distanceFare = Math.round(distanceKm * PRICING.perKm[serviceType]);
    const timeFare = Math.round(durationMinutes * PRICING.perMinute[serviceType]);

    let subtotal = baseFare + distanceFare + timeFare;

    // Appliquer le minimum
    subtotal = Math.max(subtotal, PRICING.minimumFare[serviceType]);

    // Calcul des réductions
    let discount = 0;

    if (options?.isStudent) {
        discount += subtotal * STUDENT_DISCOUNT;
    }

    if (options?.isShared && options.sharedPassengers && options.sharedPassengers > 1) {
        // Réduction pour trajet partagé (30% par passager supplémentaire, max 70%)
        const sharedDiscount = Math.min((options.sharedPassengers - 1) * 0.30, 0.70);
        discount += (subtotal - discount) * sharedDiscount;
    }

    const total = Math.round(subtotal - discount);
    const commission = Math.round(total * COMMISSION_RATE);
    const driverEarnings = total - commission;

    return {
        baseFare,
        distanceFare,
        timeFare,
        subtotal,
        discount: Math.round(discount),
        total,
        commission,
        driverEarnings,
    };
}

/**
 * Calcule la commission selon le niveau du chauffeur
 */
export function getDriverCommissionRate(level: DriverLevel): number {
    return DRIVER_LEVELS[level].commission;
}

/**
 * Calcule les gains du chauffeur après commission
 */
export function calculateDriverEarnings(
    ridePrice: number,
    driverLevel: DriverLevel
): { earnings: number; commission: number; commissionRate: number } {
    const commissionRate = getDriverCommissionRate(driverLevel);
    const commission = Math.round(ridePrice * commissionRate);
    const earnings = ridePrice - commission;

    return { earnings, commission, commissionRate };
}

// ============ DISTANCE & GÉOLOCALISATION ============

/**
 * Calcule la distance entre deux points en mètres (formule Haversine)
 */
export function calculateDistance(from: Location, to: Location): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(from.latitude)) *
        Math.cos(toRad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Estime le temps de trajet en secondes
 */
export function estimateDuration(distanceMeters: number, serviceType: ServiceType): number {
    // Vitesse moyenne en km/h selon le type
    const speeds: Record<ServiceType, number> = {
        car: 25,     // 25 km/h en ville
        car_ac: 25,
        moto: 35,    // Plus rapide en moto
        delivery: 30,
        food: 30,
    };

    const speedKmH = speeds[serviceType];
    const distanceKm = distanceMeters / 1000;
    const hours = distanceKm / speedKmH;

    return Math.round(hours * 3600); // Convertir en secondes
}

// ============ FORMATAGE ============

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

/**
 * Formate une distance en km ou m
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formate une durée en minutes ou heures
 */
export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
}

/**
 * Formate une date
 */
export function formatDate(date: Date, locale: string = 'fr-FR'): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/**
 * Formate une heure
 */
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// ============ VALIDATION ============

/**
 * Valide un numéro de téléphone ivoirien
 */
export function isValidIvorianPhone(phone: string): boolean {
    // Format: +225 XX XX XX XX XX ou 07XXXXXXXX
    const cleaned = phone.replace(/\s/g, '');
    const patterns = [
        /^\+225[0-9]{10}$/,    // +225XXXXXXXXXX
        /^225[0-9]{10}$/,      // 225XXXXXXXXXX
        /^0[0-9]{9}$/,         // 0XXXXXXXXX
        /^[0-9]{10}$/,         // XXXXXXXXXX
    ];
    return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// ============ GÉNÉRATION ============

/**
 * Génère un code de parrainage unique
 */
export function generateReferralCode(firstName: string): string {
    const prefix = firstName.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============ ÉTOILES / NOTATION ============

/**
 * Calcule la note moyenne
 */
export function calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Retourne le nombre d'étoiles pleines, demi, vides
 */
export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return { full, half, empty };
}

// ============ NIVEAU CHAUFFEUR ============

/**
 * Détermine le niveau du chauffeur selon son nombre de courses
 */
export function getDriverLevel(totalRides: number): DriverLevel {
    if (totalRides >= 1000) return 'diamond';
    if (totalRides >= 500) return 'platinum';
    if (totalRides >= 300) return 'gold';
    if (totalRides >= 100) return 'silver';
    return 'bronze';
}

// ============ SÉCURITÉ ============

/**
 * Masque un numéro de téléphone
 */
export function maskPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
        return cleaned.substring(0, 4) + '****' + cleaned.substring(cleaned.length - 2);
    }
    return '****';
}

/**
 * Masque un email
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
        return `**@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
}
