// =============================================
// TRANSIGO BUSINESS - Profile Terminology Hook
// Returns correct labels based on driver profile (VTC vs Delivery)
// =============================================

import { useDriverStore } from '../stores/driverStore';

export interface ProfileTerms {
    // Singular
    trip: string;           // "course" ou "livraison"
    tripCapital: string;    // "Course" ou "Livraison"

    // Plural
    trips: string;          // "courses" ou "livraisons"
    tripsCapital: string;   // "Courses" ou "Livraisons"

    // Icon names
    tripIcon: string;       // "car" ou "cube"

    // Other terms
    client: string;         // "passager" ou "client"
    clientCapital: string;  // "Passager" ou "Client"

    isDelivery: boolean;
    isVTC: boolean;
}

const VTC_TERMS: ProfileTerms = {
    trip: 'course',
    tripCapital: 'Course',
    trips: 'courses',
    tripsCapital: 'Courses',
    tripIcon: 'car',
    client: 'passager',
    clientCapital: 'Passager',
    isDelivery: false,
    isVTC: true,
};

const DELIVERY_TERMS: ProfileTerms = {
    trip: 'livraison',
    tripCapital: 'Livraison',
    trips: 'livraisons',
    tripsCapital: 'Livraisons',
    tripIcon: 'cube',
    client: 'client',
    clientCapital: 'Client',
    isDelivery: true,
    isVTC: false,
};

/**
 * Hook to get the correct terminology based on driver's profile type
 * @returns ProfileTerms object with all the labels for the current profile
 */
export function useProfileTerms(): ProfileTerms {
    const { driver } = useDriverStore();

    // Default to DELIVERY. Only show VTC terms if explicitly 'driver'
    if (driver?.profileType === 'driver') {
        return VTC_TERMS;
    }

    return DELIVERY_TERMS;
}

/**
 * Get terms without hook (for non-component contexts)
 * @param profileType - 'vtc' or 'delivery'
 */
export function getProfileTerms(profileType?: string): ProfileTerms {
    if (profileType === 'delivery') {
        return DELIVERY_TERMS;
    }
    return VTC_TERMS;
}

export default useProfileTerms;
