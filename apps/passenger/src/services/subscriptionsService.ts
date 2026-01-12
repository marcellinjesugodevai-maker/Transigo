// =============================================
// TRANSIGO - SUBSCRIPTIONS SERVICE (Abonnements)
// =============================================

import { supabase } from './supabaseService';

export interface SubscriptionDB {
    id: string;
    user_id: string;
    plan_name: 'basic' | 'pro' | 'unlimited';
    rides_per_month: number;
    price_per_month: number;
    discount_percentage: number;
    rides_used: number;
    status: 'active' | 'paused' | 'expired' | 'cancelled';
    start_date: string;
    end_date?: string;
    next_billing_date?: string;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    emoji: string;
    rides: number;
    price: number;
    discount: number;
    features: string[];
    popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic',
        emoji: '🚗',
        rides: 10,
        price: 20000,
        discount: 10,
        features: ['10 courses/mois', '10% de réduction', 'Support standard'],
    },
    {
        id: 'pro',
        name: 'Pro',
        emoji: '⭐',
        rides: 25,
        price: 45000,
        discount: 20,
        features: ['25 courses/mois', '20% de réduction', 'Priorité chauffeur', 'Support prioritaire'],
        popular: true,
    },
    {
        id: 'unlimited',
        name: 'Unlimited',
        emoji: '👑',
        rides: 999,
        price: 80000,
        discount: 30,
        features: ['Courses illimitées', '30% de réduction', 'Chauffeur dédié', 'Support VIP 24/7'],
    },
];

export const subscriptionsService = {
    /**
     * Récupérer mon abonnement actif
     */
    getMySubscription: async (): Promise<{ subscription?: SubscriptionDB; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('ride_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'paused'])
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return { subscription: data || undefined };
        } catch (error) {
            console.error('getMySubscription error:', error);
            return { error };
        }
    },

    /**
     * Souscrire à un plan
     */
    subscribe: async (planId: string): Promise<{ subscription?: SubscriptionDB; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
            if (!plan) throw new Error('Plan non trouvé');

            // Vérifier si déjà abonné
            const { subscription: existing } = await subscriptionsService.getMySubscription();
            if (existing) throw new Error('Vous avez déjà un abonnement actif');

            // Calculer dates
            const startDate = new Date();
            const nextBilling = new Date(startDate);
            nextBilling.setMonth(nextBilling.getMonth() + 1);

            const { data, error } = await supabase
                .from('ride_subscriptions')
                .insert({
                    user_id: user.id,
                    plan_name: plan.id,
                    rides_per_month: plan.rides,
                    price_per_month: plan.price,
                    discount_percentage: plan.discount,
                    rides_used: 0,
                    status: 'active',
                    start_date: startDate.toISOString().split('T')[0],
                    next_billing_date: nextBilling.toISOString().split('T')[0],
                })
                .select()
                .single();

            if (error) throw error;
            return { subscription: data };
        } catch (error) {
            console.error('subscribe error:', error);
            return { error };
        }
    },

    /**
     * Utiliser une course de l'abonnement
     */
    useRide: async (subscriptionId: string): Promise<{ success: boolean; ridesRemaining?: number; error?: any }> => {
        try {
            // Récupérer l'abonnement actuel
            const { data: sub, error: fetchError } = await supabase
                .from('ride_subscriptions')
                .select('rides_used, rides_per_month')
                .eq('id', subscriptionId)
                .single();

            if (fetchError) throw fetchError;

            if (sub.rides_used >= sub.rides_per_month) {
                return { success: false, error: 'Plus de courses disponibles ce mois' };
            }

            // Incrémenter
            const { error } = await supabase
                .from('ride_subscriptions')
                .update({ rides_used: sub.rides_used + 1 })
                .eq('id', subscriptionId);

            if (error) throw error;
            return { success: true, ridesRemaining: sub.rides_per_month - sub.rides_used - 1 };
        } catch (error) {
            console.error('useRide error:', error);
            return { success: false, error };
        }
    },

    /**
     * Annuler l'abonnement
     */
    cancelSubscription: async (subscriptionId: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const { error } = await supabase
                .from('ride_subscriptions')
                .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
                .eq('id', subscriptionId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('cancelSubscription error:', error);
            return { success: false, error };
        }
    },

    /**
     * Mettre en pause / Reprendre l'abonnement
     */
    togglePause: async (subscriptionId: string, currentStatus: string): Promise<{ success: boolean; error?: any }> => {
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';

            const { error } = await supabase
                .from('ride_subscriptions')
                .update({ status: newStatus })
                .eq('id', subscriptionId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('togglePause error:', error);
            return { success: false, error };
        }
    },

    /**
     * Historique des abonnements
     */
    getSubscriptionHistory: async (): Promise<{ subscriptions: SubscriptionDB[]; error?: any }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('ride_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { subscriptions: data || [] };
        } catch (error) {
            console.error('getSubscriptionHistory error:', error);
            return { subscriptions: [], error };
        }
    },
};

export default subscriptionsService;
