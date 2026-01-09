// =============================================
// TRANSIGO - AUTOMATIC PUSH NOTIFICATIONS SERVICE
// Envoie automatique des notifications lors des événements
// 100% gratuit via l'API Expo
// =============================================

import { supabase } from './supabaseService';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Types de notifications automatiques
export type AutoNotificationType =
    | 'ride_requested'      // Nouvelle course demandée (→ chauffeurs proches)
    | 'ride_accepted'       // Course acceptée (→ passager)
    | 'driver_arriving'     // Chauffeur en route (→ passager)
    | 'driver_arrived'      // Chauffeur arrivé (→ passager)
    | 'ride_started'        // Course démarrée (→ passager)
    | 'ride_completed'      // Course terminée (→ passager)
    | 'payment_received'    // Paiement reçu (→ chauffeur)
    | 'delivery_available'  // Nouvelle livraison (→ livreurs proches)
    | 'delivery_picked'     // Livraison récupérée (→ client)
    | 'delivery_completed'; // Livraison terminée (→ client)

// Messages prédéfinis pour chaque type
const NOTIFICATION_MESSAGES: Record<AutoNotificationType, { title: string; body: string }> = {
    ride_requested: {
        title: '🚗 Nouvelle course disponible',
        body: 'Une nouvelle demande de course est disponible près de vous',
    },
    ride_accepted: {
        title: '✅ Chauffeur trouvé !',
        body: 'Votre chauffeur est en route vers vous',
    },
    driver_arriving: {
        title: '🚙 Chauffeur en chemin',
        body: 'Votre chauffeur arrive dans quelques minutes',
    },
    driver_arrived: {
        title: '📍 Chauffeur arrivé !',
        body: 'Votre chauffeur vous attend',
    },
    ride_started: {
        title: '🚀 Course démarrée',
        body: 'Bon voyage ! Profitez de votre trajet',
    },
    ride_completed: {
        title: '🎉 Course terminée',
        body: 'Merci d\'avoir voyagé avec TransiGo. Notez votre chauffeur !',
    },
    payment_received: {
        title: '💰 Paiement reçu',
        body: 'Vous avez reçu un nouveau paiement',
    },
    delivery_available: {
        title: '📦 Nouvelle livraison',
        body: 'Une nouvelle livraison est disponible',
    },
    delivery_picked: {
        title: '🚚 Colis récupéré',
        body: 'Le livreur a récupéré votre colis',
    },
    delivery_completed: {
        title: '✅ Livraison effectuée',
        body: 'Votre colis a été livré avec succès',
    },
};

// Fonction pour envoyer une notification automatique
export const sendAutoNotification = async (
    type: AutoNotificationType,
    recipientToken: string,
    customData?: Record<string, any>,
    customBody?: string
): Promise<boolean> => {
    try {
        const message = NOTIFICATION_MESSAGES[type];

        const payload = {
            to: recipientToken,
            sound: 'default',
            title: message.title,
            body: customBody || message.body,
            data: {
                type,
                ...customData,
            },
        };

        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log(`Notification ${type} envoyée:`, result);

        return result.data?.status !== 'error';
    } catch (error) {
        console.error('Erreur envoi notification:', error);
        return false;
    }
};

// Fonction pour récupérer le push token d'un utilisateur
export const getUserPushToken = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.log('Token non trouvé pour user:', userId);
        return null;
    }

    return data.token;
};

// Fonction pour récupérer le push token d'un chauffeur
export const getDriverPushToken = async (driverId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.log('Token non trouvé pour driver:', driverId);
        return null;
    }

    return data.token;
};

// ============================================
// FONCTIONS DE NOTIFICATION SPÉCIFIQUES
// ============================================

// Notifier le passager que sa course a été acceptée
export const notifyRideAccepted = async (
    passengerId: string,
    driverName: string,
    etaMinutes: number
) => {
    const token = await getUserPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'ride_accepted',
        token,
        { screen: 'ride-tracking' },
        `${driverName} arrive dans ${etaMinutes} min`
    );
};

// Notifier le passager que le chauffeur est arrivé
export const notifyDriverArrived = async (passengerId: string, driverName: string) => {
    const token = await getUserPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'driver_arrived',
        token,
        { screen: 'ride-tracking' },
        `${driverName} vous attend à votre point de départ`
    );
};

// Notifier le passager que la course est terminée
export const notifyRideCompleted = async (
    passengerId: string,
    amount: number,
    currency: string = 'FCFA'
) => {
    const token = await getUserPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'ride_completed',
        token,
        { screen: 'ride-complete' },
        `Trajet terminé - ${amount} ${currency}. Notez votre chauffeur !`
    );
};

// Notifier le chauffeur d'un paiement reçu
export const notifyPaymentReceived = async (
    driverId: string,
    amount: number,
    currency: string = 'FCFA'
) => {
    const token = await getDriverPushToken(driverId);
    if (!token) return false;

    return sendAutoNotification(
        'payment_received',
        token,
        { screen: 'earnings' },
        `Vous avez reçu ${amount} ${currency}`
    );
};

// Notifier les chauffeurs proches d'une nouvelle course
export const notifyNearbyDrivers = async (
    driverIds: string[],
    pickupAddress: string,
    estimatedPrice: number
) => {
    const results = await Promise.all(
        driverIds.map(async (driverId) => {
            const token = await getDriverPushToken(driverId);
            if (!token) return false;

            return sendAutoNotification(
                'ride_requested',
                token,
                { screen: 'home' },
                `Nouvelle course: ${pickupAddress} - ${estimatedPrice} FCFA`
            );
        })
    );

    return results.filter(Boolean).length; // Nombre de notifications envoyées
};

// Notifier les livreurs d'une nouvelle livraison
export const notifyNearbyDeliveryDrivers = async (
    driverIds: string[],
    pickupAddress: string,
    estimatedPrice: number
) => {
    const results = await Promise.all(
        driverIds.map(async (driverId) => {
            const token = await getDriverPushToken(driverId);
            if (!token) return false;

            return sendAutoNotification(
                'delivery_available',
                token,
                { screen: 'home' },
                `Nouvelle livraison: ${pickupAddress} - ${estimatedPrice} FCFA`
            );
        })
    );

    return results.filter(Boolean).length;
};
