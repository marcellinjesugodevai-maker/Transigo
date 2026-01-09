// =============================================
// TRANSIGO BUSINESS - AUTOMATIC PUSH NOTIFICATIONS SERVICE
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

// Fonction pour récupérer le push token d'un passager
export const getPassengerPushToken = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.log('Token non trouvé pour passager:', userId);
        return null;
    }

    return data.token;
};

// ============================================
// FONCTIONS APPELÉES PAR LE CHAUFFEUR
// ============================================

// Notifier le passager quand le chauffeur accepte la course
export const notifyPassengerRideAccepted = async (
    passengerId: string,
    driverName: string,
    etaMinutes: number,
    rideId: string
) => {
    const token = await getPassengerPushToken(passengerId);
    if (!token) {
        console.log('Pas de token pour notifier le passager');
        return false;
    }

    return sendAutoNotification(
        'ride_accepted',
        token,
        { rideId, screen: 'ride-tracking' },
        `${driverName} arrive dans ${etaMinutes} min`
    );
};

// Notifier le passager quand le chauffeur est en route
export const notifyPassengerDriverOnWay = async (
    passengerId: string,
    driverName: string,
    etaMinutes: number,
    rideId: string
) => {
    const token = await getPassengerPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'driver_arriving',
        token,
        { rideId, screen: 'ride-tracking' },
        `${driverName} arrive dans ${etaMinutes} min`
    );
};

// Notifier le passager quand le chauffeur est arrivé
export const notifyPassengerDriverArrived = async (
    passengerId: string,
    driverName: string,
    rideId: string
) => {
    const token = await getPassengerPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'driver_arrived',
        token,
        { rideId, screen: 'ride-tracking' },
        `${driverName} vous attend à votre point de départ`
    );
};

// Notifier le passager quand la course démarre
export const notifyPassengerRideStarted = async (
    passengerId: string,
    rideId: string
) => {
    const token = await getPassengerPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'ride_started',
        token,
        { rideId, screen: 'ride-in-progress' }
    );
};

// Notifier le passager quand la course est terminée
export const notifyPassengerRideCompleted = async (
    passengerId: string,
    amount: number,
    rideId: string,
    currency: string = 'FCFA'
) => {
    const token = await getPassengerPushToken(passengerId);
    if (!token) return false;

    return sendAutoNotification(
        'ride_completed',
        token,
        { rideId, screen: 'ride-complete', amount },
        `Trajet terminé - ${amount} ${currency}. Notez votre chauffeur !`
    );
};

// ============================================
// FONCTIONS POUR LES LIVRAISONS
// ============================================

// Notifier le client quand le livreur a récupéré le colis
export const notifyClientDeliveryPicked = async (
    clientId: string,
    deliveryId: string
) => {
    const token = await getPassengerPushToken(clientId);
    if (!token) return false;

    return sendAutoNotification(
        'delivery_picked',
        token,
        { deliveryId, screen: 'delivery-tracking' }
    );
};

// Notifier le client quand la livraison est terminée
export const notifyClientDeliveryCompleted = async (
    clientId: string,
    deliveryId: string
) => {
    const token = await getPassengerPushToken(clientId);
    if (!token) return false;

    return sendAutoNotification(
        'delivery_completed',
        token,
        { deliveryId, screen: 'delivery-complete' }
    );
};
