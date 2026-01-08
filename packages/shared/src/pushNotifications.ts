// =============================================
// TRANSIGO - EXPO PUSH NOTIFICATIONS SERVICE
// Service partagé pour envoyer des notifications push
// =============================================

interface PushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
    priority?: 'default' | 'high';
}

// URL de l'API Expo Push
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envoyer une notification push via Expo
 */
export async function sendPushNotification(message: PushMessage): Promise<{ success: boolean; error?: string }> {
    try {
        // Vérifier que le token est valide
        if (!message.to || !message.to.startsWith('ExponentPushToken')) {
            return { success: false, error: 'Invalid push token' };
        }

        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: message.to,
                title: message.title,
                body: message.body,
                data: message.data || {},
                sound: message.sound || 'default',
                priority: message.priority || 'high',
            }),
        });

        const result = await response.json();

        if (result.data?.[0]?.status === 'ok') {
            return { success: true };
        }

        return { success: false, error: result.data?.[0]?.message || 'Unknown error' };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Envoyer des notifications à plusieurs destinataires
 */
export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
    // Filtrer les tokens invalides
    const validMessages = messages.filter(m => m.to?.startsWith('ExponentPushToken'));

    if (validMessages.length === 0) return;

    // Envoyer par batch de 100 (limite Expo)
    const batches = [];
    for (let i = 0; i < validMessages.length; i += 100) {
        batches.push(validMessages.slice(i, i + 100));
    }

    await Promise.all(batches.map(batch =>
        fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(batch),
        })
    ));
}

// ============================================
// Notifications prédéfinies pour TransiGo
// ============================================

export const TransiGoNotifications = {
    // Notifier un chauffeur d'une nouvelle course
    newRideRequest: (driverPushToken: string, rideData: { pickup: string; price: number }) => ({
        to: driverPushToken,
        title: '🚗 Nouvelle course disponible !',
        body: `${rideData.pickup} • ${rideData.price.toLocaleString()} FCFA`,
        data: { type: 'new_ride', ...rideData },
        sound: 'default' as const,
        priority: 'high' as const,
    }),

    // Notifier un passager que sa course est acceptée
    rideAccepted: (passengerPushToken: string, driverData: { name: string; eta: number }) => ({
        to: passengerPushToken,
        title: '✅ Course acceptée !',
        body: `${driverData.name} arrive dans ${driverData.eta} min`,
        data: { type: 'ride_accepted', ...driverData },
        sound: 'default' as const,
    }),

    // Notifier un passager que le chauffeur est arrivé
    driverArrived: (passengerPushToken: string, driverName: string) => ({
        to: passengerPushToken,
        title: '📍 Votre chauffeur est arrivé !',
        body: `${driverName} vous attend`,
        data: { type: 'driver_arrived' },
        sound: 'default' as const,
    }),

    // Notifier de la fin de course
    rideCompleted: (pushToken: string, rideData: { price: number; distance: number }) => ({
        to: pushToken,
        title: '🎉 Course terminée !',
        body: `${rideData.distance} km • ${rideData.price.toLocaleString()} FCFA`,
        data: { type: 'ride_completed', ...rideData },
    }),

    // Notifier un chauffeur de solde bas
    lowBalance: (driverPushToken: string, balance: number) => ({
        to: driverPushToken,
        title: '⚠️ Solde bas',
        body: `Votre solde est de ${balance.toLocaleString()} FCFA. Rechargez pour continuer.`,
        data: { type: 'low_balance', balance },
        sound: 'default' as const,
    }),

    // Notifier un chauffeur du prélèvement commission
    commissionDeducted: (driverPushToken: string, data: { commission: number; balance: number }) => ({
        to: driverPushToken,
        title: '💳 Commission prélevée',
        body: `-${data.commission.toLocaleString()} FCFA • Solde: ${data.balance.toLocaleString()} FCFA`,
        data: { type: 'commission', ...data },
    }),
};
