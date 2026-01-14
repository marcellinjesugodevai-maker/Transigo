// =============================================
// TRANSIGO DRIVER - PREMIUMS SERVICE
// Gestion des fonctionnalités Premium via Supabase
// (Clubs, Challenges, Predictions, Stats)
// =============================================

import { supabase } from './supabaseService';
import { Club, Challenge, ZonePrediction } from '../stores/driverPremiumsStore';

export const premiumsService = {
    // --- CLUBS ---

    // Récupérer tous les clubs disponibles
    getClubs: async () => {
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .order('members', { ascending: false }); // Fake field name correction if needed

        return { clubs: data, error };
    },

    // Récupérer les clubs d'un chauffeur
    getMyClubs: async (driverId: string) => {
        const { data, error } = await supabase
            .from('driver_clubs')
            .select('*, clubs(*)')
            .eq('driver_id', driverId);

        if (error) return { clubs: [], error };

        // Aplatir la structure pour coller au store
        const clubs = data.map((item: any) => ({
            ...item.clubs,
            joined_at: item.joined_at
        }));

        return { clubs, error };
    },

    // Rejoindre un club
    joinClub: async (driverId: string, clubId: string) => {
        const { error } = await supabase
            .from('driver_clubs')
            .insert({ driver_id: driverId, club_id: clubId });

        return { error };
    },

    // Quitter un club
    leaveClub: async (driverId: string, clubId: string) => {
        const { error } = await supabase
            .from('driver_clubs')
            .delete()
            .eq('driver_id', driverId)
            .eq('club_id', clubId);

        return { error };
    },

    // --- CHALLENGES ---

    // Récupérer les challenges actifs
    getChallenges: async (driverId: string) => {
        const { data, error } = await supabase
            .from('driver_challenges')
            .select('*')
            .eq('driver_id', driverId)
            .eq('status', 'active');

        return { challenges: data, error };
    },

    // Mettre à jour la progression (A appeler après chaque course)
    updateChallengeProgress: async (challengeId: string, increment: number) => {
        // Note: Idéalement fait via un RPC ou Trigger côté serveur pour sécurité
        // Ici on fait un fetch + update simple pour le MVP
        const { data: challenge } = await supabase
            .from('driver_challenges')
            .select('current, target')
            .eq('id', challengeId)
            .single();

        if (!challenge) return;

        const newCurrent = Math.min((challenge.current || 0) + increment, challenge.target);
        const status = newCurrent >= challenge.target ? 'completed' : 'active';

        await supabase
            .from('driver_challenges')
            .update({ current: newCurrent, status })
            .eq('id', challengeId);
    },

    // --- PREDICTIONS ---

    // Récupérer les prédictions
    getPredictions: async () => {
        const { data, error } = await supabase
            .from('zone_predictions')
            .select('*')
            .order('confidence', { ascending: false });

        return { predictions: data, error };
    },

    // --- STATS (XP / Level) ---

    // Récupérer stats chauffeur
    getDriverStats: async (driverId: string) => {
        const { data, error } = await supabase
            .from('drivers')
            .select('xp, level, streak_days, glory_points')
            .eq('id', driverId)
            .single();

        return { stats: data, error };
    },

    // Ajouter XP (Simplifié)
    addXp: async (driverId: string, amount: number) => {
        // On récupère d'abord
        const { data: driver } = await supabase
            .from('drivers')
            .select('xp, level')
            .eq('id', driverId)
            .single();

        if (!driver) return;

        const newXp = (driver.xp || 0) + amount;
        const newLevel = Math.floor(newXp / 1000) + 1;

        await supabase
            .from('drivers')
            .update({ xp: newXp, level: newLevel })
            .eq('id', driverId);
    }
};
