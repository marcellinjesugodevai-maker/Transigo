// =============================================
// TRANSIGO DRIVER - HEAT MAP SERVICE
// Zones chaudes et prédiction de demande
// =============================================

// Types
export interface HotZone {
    id: string;
    name: string;
    center: { lat: number; lng: number };
    radius: number; // en km
    demandLevel: 'low' | 'medium' | 'high' | 'surge';
    demandScore: number; // 0-100
    surgeMultiplier: number; // 1.0 = normal, 1.5 = +50%
    estimatedWaitTime: number; // minutes avant prochaine course
    predictedChange: 'increasing' | 'stable' | 'decreasing';
    reason?: string;
}

export interface DemandPrediction {
    zone: string;
    currentDemand: number;
    predictedDemand: number;
    changePercent: number;
    inMinutes: number;
    confidence: number;
}

// Zones chaudes simulées pour Abidjan
const ZONES_DATA: Omit<HotZone, 'demandScore' | 'surgeMultiplier' | 'estimatedWaitTime' | 'predictedChange'>[] = [
    { id: 'z1', name: 'Plateau', center: { lat: 5.3200, lng: -4.0200 }, radius: 2, demandLevel: 'high' },
    { id: 'z2', name: 'Cocody', center: { lat: 5.3500, lng: -3.9800 }, radius: 3, demandLevel: 'high' },
    { id: 'z3', name: 'Marcory', center: { lat: 5.3000, lng: -3.9900 }, radius: 2, demandLevel: 'medium' },
    { id: 'z4', name: 'Treichville', center: { lat: 5.2900, lng: -4.0100 }, radius: 1.5, demandLevel: 'medium' },
    { id: 'z5', name: 'Yopougon', center: { lat: 5.3300, lng: -4.0800 }, radius: 4, demandLevel: 'low' },
    { id: 'z6', name: 'Aéroport FHB', center: { lat: 5.2600, lng: -3.9300 }, radius: 2, demandLevel: 'surge' },
    { id: 'z7', name: '2 Plateaux', center: { lat: 5.3700, lng: -3.9900 }, radius: 2, demandLevel: 'high' },
    { id: 'z8', name: 'Angré', center: { lat: 5.3900, lng: -3.9700 }, radius: 2, demandLevel: 'medium' },
    { id: 'z9', name: 'Riviera', center: { lat: 5.3600, lng: -3.9500 }, radius: 2.5, demandLevel: 'high' },
    { id: 'z10', name: 'Adjamé', center: { lat: 5.3400, lng: -4.0300 }, radius: 2, demandLevel: 'low' },
];

// Événements qui influencent la demande
const DEMAND_EVENTS = [
    { type: 'flight_arrival', zone: 'Aéroport FHB', impact: 40, duration: 60 },
    { type: 'rush_hour_morning', zones: ['Plateau', 'Cocody', '2 Plateaux'], impact: 50, hours: [7, 8, 9] },
    { type: 'rush_hour_evening', zones: ['Plateau', 'Cocody', 'Marcory'], impact: 60, hours: [17, 18, 19, 20] },
    { type: 'weekend_night', zones: ['Cocody', 'Marcory', 'Riviera'], impact: 70, days: [5, 6], hours: [21, 22, 23, 0, 1, 2] },
    { type: 'rain', allZones: true, impact: 80 },
];

class HeatMapService {
    private zones: HotZone[] = [];
    private lastUpdate: Date = new Date();

    constructor() {
        this.updateZones();
    }

    // Mise à jour des zones avec données temps réel
    updateZones(): HotZone[] {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        this.zones = ZONES_DATA.map(zone => {
            // Calcul du score de demande basé sur l'heure et le jour
            let demandScore = this.calculateBaseDemand(zone.demandLevel);

            // Ajustements basés sur les événements
            if (this.isRushHour(hour)) {
                demandScore += 30;
            }
            if (this.isWeekendNight(day, hour)) {
                demandScore += 25;
            }
            if (zone.name === 'Aéroport FHB') {
                demandScore += 20; // Aéroport toujours demandé
            }

            // Limiter le score
            demandScore = Math.min(100, Math.max(0, demandScore));

            // Calcul du multiplicateur surge
            const surgeMultiplier = demandScore >= 80 ? 1.5 : demandScore >= 60 ? 1.2 : 1.0;

            // Estimation temps d'attente
            const estimatedWaitTime = Math.max(1, Math.round((100 - demandScore) / 10));

            // Prédiction de changement
            const predictedChange = this.predictChange(zone.name, hour);

            return {
                ...zone,
                demandScore,
                surgeMultiplier,
                estimatedWaitTime,
                predictedChange,
                demandLevel: this.getDemandLevel(demandScore),
                reason: this.getReasonForDemand(zone.name, hour, day),
            };
        });

        this.lastUpdate = now;
        return this.zones;
    }

    private calculateBaseDemand(level: string): number {
        switch (level) {
            case 'surge': return 85;
            case 'high': return 65;
            case 'medium': return 45;
            case 'low': return 25;
            default: return 30;
        }
    }

    private isRushHour(hour: number): boolean {
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    }

    private isWeekendNight(day: number, hour: number): boolean {
        return (day === 5 || day === 6) && (hour >= 21 || hour <= 2);
    }

    private getDemandLevel(score: number): HotZone['demandLevel'] {
        if (score >= 80) return 'surge';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    private predictChange(zoneName: string, hour: number): 'increasing' | 'stable' | 'decreasing' {
        // Logique simple de prédiction
        if (hour >= 6 && hour <= 8) return 'increasing';
        if (hour >= 9 && hour <= 16) return 'stable';
        if (hour >= 17 && hour <= 19) return 'increasing';
        if (hour >= 20 && hour <= 22) return 'stable';
        return 'decreasing';
    }

    private getReasonForDemand(zoneName: string, hour: number, day: number): string {
        if (zoneName === 'Aéroport FHB') return '✈️ Arrivées de vols';
        if (this.isRushHour(hour)) return '🚗 Heure de pointe';
        if (this.isWeekendNight(day, hour)) return '🎉 Sorties week-end';
        if (zoneName === 'Plateau' && hour >= 8 && hour <= 18) return '🏢 Zone d\'affaires';
        return '';
    }

    // Obtenir les zones triées par demande
    getHotZones(): HotZone[] {
        return [...this.zones].sort((a, b) => b.demandScore - a.demandScore);
    }

    // Obtenir la zone la plus proche avec forte demande
    getNearestHotZone(location: { lat: number; lng: number }): HotZone | null {
        const hotZones = this.zones.filter(z => z.demandScore >= 60);
        if (hotZones.length === 0) return null;

        return hotZones.reduce((nearest, zone) => {
            const distToNearest = this.calculateDistance(location, nearest.center);
            const distToZone = this.calculateDistance(location, zone.center);
            return distToZone < distToNearest ? zone : nearest;
        });
    }

    // Recommandation pour le chauffeur
    getRecommendation(currentLocation: { lat: number; lng: number }): {
        zone: HotZone;
        message: string;
        distance: number;
        estimatedGain: number;
    } | null {
        const bestZone = this.getNearestHotZone(currentLocation);
        if (!bestZone) return null;

        const distance = this.calculateDistance(currentLocation, bestZone.center);
        const estimatedGain = Math.round(bestZone.demandScore * 50); // Estimation gains

        return {
            zone: bestZone,
            message: `📍 Déplacez-vous vers ${bestZone.name} (+${Math.round((bestZone.surgeMultiplier - 1) * 100)}% gains)`,
            distance: Math.round(distance * 10) / 10,
            estimatedGain,
        };
    }

    // Prédiction de demande future
    predictDemand(zoneName: string, inMinutes: number): DemandPrediction {
        const zone = this.zones.find(z => z.name === zoneName);
        if (!zone) {
            return { zone: zoneName, currentDemand: 0, predictedDemand: 0, changePercent: 0, inMinutes, confidence: 0 };
        }

        const now = new Date();
        const futureHour = new Date(now.getTime() + inMinutes * 60000).getHours();

        // Prédiction basique
        let predictedDemand = zone.demandScore;
        if (this.isRushHour(futureHour) && !this.isRushHour(now.getHours())) {
            predictedDemand += 40;
        } else if (!this.isRushHour(futureHour) && this.isRushHour(now.getHours())) {
            predictedDemand -= 30;
        }

        predictedDemand = Math.min(100, Math.max(0, predictedDemand));
        const changePercent = Math.round(((predictedDemand - zone.demandScore) / zone.demandScore) * 100);

        return {
            zone: zoneName,
            currentDemand: zone.demandScore,
            predictedDemand,
            changePercent,
            inMinutes,
            confidence: 75, // Confiance de la prédiction
        };
    }

    private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
        const R = 6371;
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

export const heatMapService = new HeatMapService();
