import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration de la gestion des notifications en premier plan
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class PushNotificationService {
    /**
     * Enregistre l'appareil pour les notifications push et retourne le token
     */
    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            // Utiliser projectID de app.json si disponible
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            try {
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId,
                })).data;
                console.log('Expo Push Token (Passenger):', token);
            } catch (e) {
                console.log('Error getting push token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    /**
     * Ajoute un listener pour les notifications reçues
     */
    addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Ajoute un listener pour les interactions avec les notifications (clics)
     */
    addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Supprime un listener
     */
    removeNotificationSubscription(subscription: any) {
        Notifications.removeNotificationSubscription(subscription);
    }
}

export const pushNotificationService = new PushNotificationService();
