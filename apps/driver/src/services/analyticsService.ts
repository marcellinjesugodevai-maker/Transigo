// =============================================
// TRANSIGO DRIVER - ANALYTICS SERVICE
// Insights et métriques du chauffeur
// =============================================

export interface DailyStats {
    date: string;
    earnings: number;
    rides: number;
    tips: number;
    hoursOnline: number;
    acceptRate: number;
    averageRating: number;
}

export interface ZonePerformance {
    zone: string;
    totalEarnings: number;
    averagePerHour: number;
    rides: number;
    averageTip: number;
    rank: number;
}

export interface TimeSlotPerformance {
    slot: string;
    startHour: number;
    endHour: number;
    averageEarnings: number;
    averageRides: number;
    recommendation: 'excellent' | 'good' | 'average' | 'poor';
}

export interface DriverInsight {
    id: string;
    type: 'tip' | 'warning' | 'achievement' | 'suggestion';
    title: string;
    message: string;
    icon: string;
    actionable: boolean;
    action?: string;
}

// Données simulées
const WEEKLY_DATA: DailyStats[] = [
    { date: 'Lun', earnings: 35000, rides: 8, tips: 1500, hoursOnline: 5.5, acceptRate: 92, averageRating: 4.9 },
    { date: 'Mar', earnings: 42000, rides: 10, tips: 2000, hoursOnline: 6.0, acceptRate: 95, averageRating: 4.8 },
    { date: 'Mer', earnings: 28000, rides: 6, tips: 800, hoursOnline: 4.0, acceptRate: 88, averageRating: 4.7 },
    { date: 'Jeu', earnings: 51000, rides: 12, tips: 3000, hoursOnline: 7.0, acceptRate: 96, averageRating: 5.0 },
    { date: 'Ven', earnings: 65000, rides: 15, tips: 4500, hoursOnline: 8.5, acceptRate: 94, averageRating: 4.9 },
    { date: 'Sam', earnings: 78000, rides: 18, tips: 5000, hoursOnline: 9.0, acceptRate: 97, averageRating: 4.9 },
    { date: 'Dim', earnings: 45000, rides: 10, tips: 2500, hoursOnline: 6.5, acceptRate: 91, averageRating: 4.8 },
];

const ZONE_PERFORMANCE: ZonePerformance[] = [
    { zone: 'Cocody', totalEarnings: 125000, averagePerHour: 8500, rides: 35, averageTip: 450, rank: 1 },
    { zone: 'Plateau', totalEarnings: 98000, averagePerHour: 7800, rides: 28, averageTip: 380, rank: 2 },
    { zone: 'Aéroport', totalEarnings: 85000, averagePerHour: 12000, rides: 12, averageTip: 800, rank: 3 },
    { zone: 'Marcory', totalEarnings: 62000, averagePerHour: 6200, rides: 20, averageTip: 250, rank: 4 },
    { zone: '2 Plateaux', totalEarnings: 55000, averagePerHour: 7000, rides: 18, averageTip: 400, rank: 5 },
];

const TIME_SLOTS: TimeSlotPerformance[] = [
    { slot: 'Tôt matin', startHour: 5, endHour: 7, averageEarnings: 8000, averageRides: 2, recommendation: 'average' },
    { slot: 'Rush matin', startHour: 7, endHour: 10, averageEarnings: 25000, averageRides: 6, recommendation: 'excellent' },
    { slot: 'Matinée', startHour: 10, endHour: 12, averageEarnings: 12000, averageRides: 3, recommendation: 'average' },
    { slot: 'Midi', startHour: 12, endHour: 14, averageEarnings: 18000, averageRides: 4, recommendation: 'good' },
    { slot: 'Après-midi', startHour: 14, endHour: 17, averageEarnings: 15000, averageRides: 4, recommendation: 'average' },
    { slot: 'Rush soir', startHour: 17, endHour: 20, averageEarnings: 35000, averageRides: 8, recommendation: 'excellent' },
    { slot: 'Soirée', startHour: 20, endHour: 23, averageEarnings: 22000, averageRides: 5, recommendation: 'good' },
    { slot: 'Nuit', startHour: 23, endHour: 5, averageEarnings: 28000, averageRides: 4, recommendation: 'good' },
];

class AnalyticsService {
    // Statistiques de la semaine
    getWeeklyStats(): DailyStats[] {
        return WEEKLY_DATA;
    }

    // Total de la semaine
    getWeeklyTotal(): { earnings: number; rides: number; tips: number; hours: number } {
        return WEEKLY_DATA.reduce((acc, day) => ({
            earnings: acc.earnings + day.earnings,
            rides: acc.rides + day.rides,
            tips: acc.tips + day.tips,
            hours: acc.hours + day.hoursOnline,
        }), { earnings: 0, rides: 0, tips: 0, hours: 0 });
    }

    // Meilleur jour
    getBestDay(): DailyStats {
        return WEEKLY_DATA.reduce((best, day) =>
            day.earnings > best.earnings ? day : best
        );
    }

    // Performance par zone
    getZonePerformance(): ZonePerformance[] {
        return ZONE_PERFORMANCE;
    }

    // Meilleure zone
    getBestZone(): ZonePerformance {
        return ZONE_PERFORMANCE[0];
    }

    // Performance par créneau horaire
    getTimeSlotPerformance(): TimeSlotPerformance[] {
        return TIME_SLOTS;
    }

    // Meilleurs créneaux
    getBestTimeSlots(): TimeSlotPerformance[] {
        return TIME_SLOTS.filter(slot => slot.recommendation === 'excellent');
    }

    // Gains moyens par heure
    getAverageHourlyRate(): number {
        const total = this.getWeeklyTotal();
        return Math.round(total.earnings / total.hours);
    }

    // Comparaison avec semaine précédente
    getWeeklyComparison(): { earningsChange: number; ridesChange: number; tipsChange: number } {
        // Simulation (semaine précédente -10%)
        const currentTotal = this.getWeeklyTotal();
        return {
            earningsChange: 12, // +12%
            ridesChange: 8,     // +8%
            tipsChange: 15,     // +15%
        };
    }

    // Générer des insights personnalisés
    generateInsights(driverStats: any): DriverInsight[] {
        const insights: DriverInsight[] = [];

        // Insight meilleur jour
        const bestDay = this.getBestDay();
        insights.push({
            id: 'i1',
            type: 'tip',
            title: 'Meilleur jour',
            message: `Vous gagnez 40% de plus le ${bestDay.date}. Maximisez vos heures ce jour !`,
            icon: '📈',
            actionable: false,
        });

        // Insight meilleure zone
        const bestZone = this.getBestZone();
        insights.push({
            id: 'i2',
            type: 'tip',
            title: 'Zone rentable',
            message: `${bestZone.zone} vous rapporte ${bestZone.averagePerHour.toLocaleString('fr-FR')} F/h en moyenne`,
            icon: '📍',
            actionable: true,
            action: 'Voir sur la carte',
        });

        // Insight créneaux
        const bestSlots = this.getBestTimeSlots();
        insights.push({
            id: 'i3',
            type: 'suggestion',
            title: 'Créneaux optimaux',
            message: `${bestSlots.map(s => s.slot).join(' et ')} sont vos meilleurs moments`,
            icon: '⏰',
            actionable: false,
        });

        // Insight pourboires
        if (bestZone.averageTip > 400) {
            insights.push({
                id: 'i4',
                type: 'achievement',
                title: 'Expert pourboires',
                message: `Vos pourboires sont 25% au-dessus de la moyenne !`,
                icon: '💰',
                actionable: false,
            });
        }

        // Insight taux d'acceptation
        if (driverStats.acceptRate < 90) {
            insights.push({
                id: 'i5',
                type: 'warning',
                title: 'Taux d\'acceptation',
                message: `Votre taux de ${driverStats.acceptRate}% est bas. Visez 95% pour plus de courses.`,
                icon: '⚠️',
                actionable: true,
                action: 'Voir conseils',
            });
        }

        return insights;
    }

    // Objectifs suggérés basés sur la performance
    suggestObjectives(currentStats: any): { title: string; target: number; reward: number }[] {
        const weeklyTotal = this.getWeeklyTotal();
        const avgDaily = weeklyTotal.earnings / 7;

        return [
            { title: 'Dépasser la moyenne', target: Math.round(avgDaily * 1.1), reward: 1000 },
            { title: 'Atteindre 15 courses', target: 15, reward: 2000 },
            { title: 'Collecter 5000 F de pourboires', target: 5000, reward: 500 },
        ];
    }

    // Prédiction de gains
    predictEarnings(hoursPlanned: number, zones: string[]): number {
        const avgHourlyRate = this.getAverageHourlyRate();
        const zoneBonus = zones.some(z => ['Cocody', 'Plateau', 'Aéroport'].includes(z)) ? 1.2 : 1.0;
        return Math.round(hoursPlanned * avgHourlyRate * zoneBonus);
    }
}

export const analyticsService = new AnalyticsService();
