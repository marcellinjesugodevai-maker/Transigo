// =============================================
// TRANSIGO DRIVER - SUPABASE SERVICE
// Intégration avec le backend Supabase
// =============================================

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AsyncStorageAdapter = {
    getItem: (key: string) => {
        console.log('Supabase Storage GET:', key);
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        console.log('Supabase Storage SET:', key);
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        console.log('Supabase Storage REMOVE:', key);
        return AsyncStorage.removeItem(key);
    },
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zndgvloyaitopczhjddq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ============================================
// Service: Authentification Chauffeur
// ============================================
export const authService = {
    // Connexion par téléphone
    signInWithPhone: async (phone: string) => {
        const { data, error } = await supabase.auth.signInWithOtp({ phone });
        return { data, error };
    },

    // Vérifier OTP
    verifyOtp: async (phone: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        return { data, error };
    },

    // Déconnexion
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Session actuelle
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        return { session: data.session, error };
    },
};

// ============================================
// Service: Profil Chauffeur
// ============================================
export const driverService = {
    // Récupérer profil
    getProfile: async (driverId: string) => {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single();
        return { driver: data, error };
    },

    // Mettre à jour statut en ligne
    setOnlineStatus: async (driverId: string, isOnline: boolean) => {
        const { error } = await supabase
            .from('drivers')
            .update({ is_online: isOnline, updated_at: new Date().toISOString() })
            .eq('id', driverId);
        return { error };
    },

    // Mettre à jour position GPS
    updateLocation: async (driverId: string, lat: number, lng: number) => {
        const { error } = await supabase
            .from('drivers')
            .update({
                current_lat: lat,
                current_lng: lng,
                updated_at: new Date().toISOString()
            })
            .eq('id', driverId);
        return { error };
    },

    // Mettre à jour push token
    updatePushToken: async (driverId: string, token: string) => {
        const { error } = await supabase
            .from('drivers')
            .update({ push_token: token })
            .eq('id', driverId);
        return { error };
    },
};

// ============================================
// Service: Courses
// ============================================
export const rideService = {
    // Récupérer les courses demandées (pour afficher aux chauffeurs)
    getRequestedRides: async (serviceType?: 'ride' | 'delivery') => {
        let query = supabase
            .from('rides')
            .select('*, users!passenger_id(*)')
            .eq('status', 'requested')
            .order('created_at', { ascending: false });

        if (serviceType) {
            query = query.eq('service_type', serviceType);
        }

        const { data, error } = await query;
        return { rides: data, error };
    },

    // Accepter une course
    acceptRide: async (rideId: string, driverId: string) => {
        const { data, error } = await supabase
            .from('rides')
            .update({
                driver_id: driverId,
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', rideId)
            .eq('status', 'requested') // S'assurer qu'elle n'est pas déjà prise
            .select()
            .single();
        return { ride: data, error };
    },

    // Mettre à jour statut course
    updateRideStatus: async (rideId: string, status: string) => {
        const updates: any = { status };

        if (status === 'arriving') updates.arrived_at = new Date().toISOString();
        if (status === 'in_progress') updates.started_at = new Date().toISOString();
        if (status === 'completed') updates.completed_at = new Date().toISOString();
        if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('rides')
            .update(updates)
            .eq('id', rideId)
            .select()
            .single();
        return { ride: data, error };
    },

    // S'abonner aux nouvelles courses (Realtime)
    subscribeToNewRides: (callback: (ride: any) => void, serviceType?: 'ride' | 'delivery') => {
        let filter = 'status=eq.requested';
        if (serviceType) {
            filter += `,service_type=eq.${serviceType}`;
        }
        return supabase
            .channel('new-rides')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'rides',
                    filter: filter
                },
                (payload) => callback(payload.new)
            )
            .subscribe();
    },

    // Récupérer l'historique des courses d'un chauffeur
    getRideHistory: async (driverId: string) => {
        const { data, error } = await supabase
            .from('rides')
            .select('*, users!passenger_id(*)')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });
        return { rides: data, error };
    },

    // Récupérer les statistiques globales du chauffeur
    getStats: async (driverId: string) => {
        const { data: rides, error } = await supabase
            .from('rides')
            .select('price, tip, status, created_at')
            .eq('driver_id', driverId)
            .eq('status', 'completed');

        if (error) return { error };

        const totalEarnings = rides.reduce((sum, r) => sum + (r.price || 0) + (r.tip || 0), 0);
        const totalRides = rides.length;
        const totalTips = rides.reduce((sum, r) => sum + (r.tip || 0), 0);

        return {
            totalEarnings,
            totalRides,
            totalTips,
            rides // Bruts pour calculs additionnels (ex: charts)
        };
    },

    // Récupérer le classement des chauffeurs
    getLeaderboard: async () => {
        const { data, error } = await supabase
            .from('drivers')
            .select('id, first_name, last_name, rating, total_rides, wallet_balance, profile_type')
            .order('total_rides', { ascending: false })
            .limit(50);
        return { leaderboard: data, error };
    },
};

// ============================================
// Service: Wallet
// ============================================
export const walletService = {
    // Récupérer solde et transactions
    getWallet: async (driverId: string) => {
        const { data: driver } = await supabase
            .from('drivers')
            .select('wallet_balance')
            .eq('id', driverId)
            .single();

        const { data: transactions } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false })
            .limit(20);

        return {
            balance: driver?.wallet_balance || 0,
            transactions: transactions || []
        };
    },

    // Recharger le wallet (simulé - en vrai ce serait via API paiement)
    topUp: async (driverId: string, amount: number, method: string = 'Mobile Money') => {
        // Ajouter au solde
        const { data: driver, error: driverError } = await supabase
            .from('drivers')
            .select('wallet_balance')
            .eq('id', driverId)
            .single();

        if (driverError) return { error: driverError };

        const newBalance = (driver?.wallet_balance || 0) + amount;

        await supabase
            .from('drivers')
            .update({ wallet_balance: newBalance })
            .eq('id', driverId);

        // Enregistrer la transaction
        const { error } = await supabase
            .from('wallet_transactions')
            .insert({
                driver_id: driverId,
                type: 'topup',
                amount,
                description: `Recharge ${method}`,
            });

        return { balance: newBalance, error };
    },

    // S'abonner aux changements de wallet (Realtime)
    subscribeToWallet: (driverId: string, callback: (balance: number) => void) => {
        return supabase
            .channel(`wallet-${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'drivers',
                    filter: `id=eq.${driverId}`
                },
                (payload) => callback(payload.new.wallet_balance)
            )
            .subscribe();
    },
};
