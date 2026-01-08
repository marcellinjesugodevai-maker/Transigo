// =============================================
// TRANSIGO DRIVER - NOTIFICATIONS SERVICE
// Notifications intelligentes pour chauffeur
// =============================================

export interface SmartNotification {
    id: string;
    type: 'bonus' | 'hotzone' | 'objective' | 'safety' | 'earning' | 'level' | 'tip';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    icon: string;
    action?: {
        type: 'navigate' | 'accept' | 'dismiss';
        target?: string;
        data?: any;
    };
    createdAt: Date;
    expiresAt?: Date;
    read: boolean;
}

export interface BonusAlert {
    id: string;
    name: string;
    description: string;
    amount: number;
    type: 'fixed' | 'multiplier';
    zones?: string[];
    startTime: Date;
    endTime: Date;
    conditions?: string;
}

class NotificationService {
    private notifications: SmartNotification[] = [];
    private listeners: ((notification: SmartNotification) => void)[] = [];

    // Ajouter une notification
    addNotification(notification: Omit<SmartNotification, 'id' | 'createdAt' | 'read'>): SmartNotification {
        const newNotif: SmartNotification = {
            ...notification,
            id: `notif-${Date.now()}`,
            createdAt: new Date(),
            read: false,
        };

        this.notifications.unshift(newNotif);
        this.notifyListeners(newNotif);
        return newNotif;
    }

    // Écouter les nouvelles notifications
    subscribe(listener: (notification: SmartNotification) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(notification: SmartNotification) {
        this.listeners.forEach(listener => listener(notification));
    }

    // Obtenir toutes les notifications
    getNotifications(): SmartNotification[] {
        return this.notifications;
    }

    // Marquer comme lue
    markAsRead(id: string) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.read = true;
    }

    // Marquer toutes comme lues
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }

    // Notifications intelligentes basées sur le contexte

    // 1. Notification bonus actif
    notifyBonus(bonus: BonusAlert) {
        return this.addNotification({
            type: 'bonus',
            priority: 'high',
            title: `💰 ${bonus.name}`,
            message: bonus.description,
            icon: '💰',
            action: {
                type: 'navigate',
                target: '/driver-objectives',
            },
            expiresAt: bonus.endTime,
        });
    }

    // 2. Notification zone chaude
    notifyHotZone(zoneName: string, demandIncrease: number, distance: number) {
        return this.addNotification({
            type: 'hotzone',
            priority: 'medium',
            title: `📍 Zone chaude à ${distance} km`,
            message: `${zoneName}: Demande +${demandIncrease}%. Déplacez-vous pour plus de courses !`,
            icon: '📍',
            action: {
                type: 'navigate',
                target: '/heat-map',
            },
        });
    }

    // 3. Notification objectif proche
    notifyObjectiveNear(objectiveTitle: string, remaining: number) {
        return this.addNotification({
            type: 'objective',
            priority: 'medium',
            title: `🎯 Objectif presque atteint !`,
            message: `Plus que ${remaining} pour compléter "${objectiveTitle}"`,
            icon: '🎯',
        });
    }

    // 4. Notification pourboire reçu
    notifyTip(amount: number, passengerName: string) {
        return this.addNotification({
            type: 'tip',
            priority: 'low',
            title: `💰 Pourboire reçu !`,
            message: `${passengerName} vous a donné ${amount.toLocaleString('fr-FR')} F de pourboire`,
            icon: '💰',
        });
    }

    // 5. Notification niveau atteint
    notifyLevelUp(newLevel: string, newCommission: number) {
        return this.addNotification({
            type: 'level',
            priority: 'high',
            title: `🎉 Félicitations ! Niveau ${newLevel}`,
            message: `Votre commission passe à ${newCommission}%. Continuez comme ça !`,
            icon: '🏆',
        });
    }

    // 6. Notification gains du jour
    notifyDailyEarnings(amount: number, comparison: number) {
        const better = comparison > 0;
        return this.addNotification({
            type: 'earning',
            priority: 'low',
            title: `📊 Résumé du jour`,
            message: `Vous avez gagné ${amount.toLocaleString('fr-FR')} F aujourd'hui (${better ? '+' : ''}${comparison}% vs hier)`,
            icon: '📊',
        });
    }

    // 7. Notification pause suggérée
    notifySuggestBreak(hoursOnline: number) {
        return this.addNotification({
            type: 'safety',
            priority: 'medium',
            title: `☕ Pause recommandée`,
            message: `Vous êtes en ligne depuis ${hoursOnline}h. Une pause améliore la conduite.`,
            icon: '☕',
        });
    }

    // 8. Notification fin bonus imminente
    notifyBonusEnding(bonusName: string, minutesLeft: number) {
        return this.addNotification({
            type: 'bonus',
            priority: 'high',
            title: `⏰ Bonus se termine bientôt`,
            message: `${bonusName} expire dans ${minutesLeft} min. Profitez-en !`,
            icon: '⏰',
        });
    }

    // Vérifications automatiques
    checkAndNotify(driverStats: any, currentHour: number) {
        // Vérifier si objectif proche
        if (driverStats.todayRides === 9) {
            this.notifyObjectiveNear('10 courses aujourd\'hui', 1);
        }

        // Vérifier heures en ligne
        if (driverStats.todayHours >= 4 && driverStats.todayHours < 4.1) {
            this.notifySuggestBreak(4);
        }

        // Vérifier heure de pointe
        if ((currentHour === 17 || currentHour === 7) && Math.random() > 0.5) {
            this.notifyHotZone('Plateau', 40, 2.5);
        }
    }
}

export const notificationService = new NotificationService();
