// =============================================
// TRANSIGO - RECURRING RIDE NOTIFICATION SCHEDULER
// Notifie automatiquement avant chaque trajet programmé
// =============================================

import * as Notifications from 'expo-notifications';
import { useRecurringRideStore, DayOfWeek, RecurringRide } from '@/stores';

// Configuration des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Mapper les jours vers les indices JavaScript (0 = dimanche, 1 = lundi, etc.)
const DAY_MAP: Record<DayOfWeek, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
};

// Calculer la prochaine occurrence d'un jour/heure donné
const getNextOccurrence = (day: DayOfWeek, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const targetDay = DAY_MAP[day];
    const currentDay = now.getDay();

    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
    }

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hours, minutes, 0, 0);

    // Si c'est aujourd'hui mais l'heure est passée, on prend la semaine prochaine
    if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 7);
    }

    return targetDate;
};

// Programmer une notification pour un trajet régulier
export const scheduleRecurringRideNotification = async (ride: RecurringRide) => {
    // Annuler les anciennes notifications pour ce trajet
    await cancelRecurringRideNotifications(ride.id);

    if (ride.status !== 'active') {
        console.log('Trajet non actif, pas de notification programmée');
        return;
    }

    // Programmer une notification pour chaque jour sélectionné
    for (const day of ride.days) {
        const triggerDate = getNextOccurrence(day, ride.time);

        // Notification 15 minutes avant
        const reminderTime = new Date(triggerDate.getTime() - 15 * 60 * 1000);

        if (reminderTime > new Date()) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚗 Trajet régulier dans 15 min',
                    body: `${ride.pickup.address} → ${ride.dropoff.address}`,
                    data: {
                        type: 'recurring_ride_reminder',
                        rideId: ride.id,
                        action: 'confirm'
                    },
                },
                trigger: {
                    date: reminderTime,
                },
                identifier: `recurring_${ride.id}_${day}_reminder`,
            });

            console.log(`Notification programmée pour ${day} à ${reminderTime}`);
        }
    }
};

// Programmer toutes les notifications pour tous les trajets actifs
export const scheduleAllRecurringRideNotifications = async () => {
    const { rides } = useRecurringRideStore.getState();
    const activeRides = rides.filter(r => r.status === 'active');

    console.log(`Programmation de ${activeRides.length} trajets réguliers`);

    for (const ride of activeRides) {
        await scheduleRecurringRideNotification(ride);
    }
};

// Annuler les notifications d'un trajet spécifique
export const cancelRecurringRideNotifications = async (rideId: string) => {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
        if (notification.identifier.startsWith(`recurring_${rideId}`)) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
};

// Annuler toutes les notifications de trajets réguliers
export const cancelAllRecurringRideNotifications = async () => {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
        if (notification.identifier.startsWith('recurring_')) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
};

// Gérer la réponse à une notification de trajet régulier
export const handleRecurringRideNotificationResponse = async (
    response: Notifications.NotificationResponse
) => {
    const data = response.notification.request.content.data;

    if (data?.type === 'recurring_ride_reminder') {
        const rideId = data.rideId as string;
        console.log('Notification de trajet régulier reçue, ride:', rideId);

        // Ici on pourrait :
        // 1. Ouvrir l'écran de confirmation de course
        // 2. Créer automatiquement une demande de course
        // Pour l'instant, on log juste
        return { rideId, action: 'open_app' };
    }

    return null;
};

// Vérifier les permissions de notification
export const requestNotificationPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
        return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
};

// Afficher les notifications programmées (pour debug)
export const logScheduledNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Notifications programmées:', notifications.length);
    notifications.forEach(n => {
        console.log(`- ${n.identifier}: ${n.content.title}`);
    });
};
