// =============================================
// TRANSIGO - SUPABASE HOOKS
// Hooks React pour utiliser Supabase
// =============================================

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './index';
import type { User, Driver, Ride, RideStatus } from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Hook: Authentification
// ============================================
export function useSupabaseAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupérer la session actuelle
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signInWithPhone = async (phone: string) => {
        return supabase.auth.signInWithOtp({ phone });
    };

    const verifyOtp = async (phone: string, token: string) => {
        return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    };

    const signOut = async () => {
        return supabase.auth.signOut();
    };

    return { user, loading, signInWithPhone, verifyOtp, signOut };
}

// ============================================
// Hook: Courses en Temps Réel
// ============================================
export function useRealTimeRides(filter?: { status?: RideStatus; driverId?: string; passengerId?: string }) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Charger les courses initiales
        const fetchRides = async () => {
            let query = supabase.from('rides').select('*');

            if (filter?.status) {
                query = query.eq('status', filter.status);
            }
            if (filter?.driverId) {
                query = query.eq('driver_id', filter.driverId);
            }
            if (filter?.passengerId) {
                query = query.eq('passenger_id', filter.passengerId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (!error && data) {
                setRides(data);
            }
            setLoading(false);
        };

        fetchRides();

        // Abonnement Realtime
        const channel = supabase
            .channel('rides-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rides' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setRides(prev => [payload.new as Ride, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setRides(prev => prev.map(r =>
                            r.id === payload.new.id ? payload.new as Ride : r
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setRides(prev => prev.filter(r => r.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter?.status, filter?.driverId, filter?.passengerId]);

    return { rides, loading };
}

// ============================================
// Hook: Chauffeurs en Ligne (pour Admin)
// ============================================
export function useOnlineDrivers() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('is_online', true);

            if (!error && data) {
                setDrivers(data);
            }
            setLoading(false);
        };

        fetchDrivers();

        // Realtime
        const channel = supabase
            .channel('drivers-online')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'drivers' },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as Driver;
                        if (updated.is_online) {
                            setDrivers(prev => {
                                const exists = prev.find(d => d.id === updated.id);
                                if (exists) {
                                    return prev.map(d => d.id === updated.id ? updated : d);
                                }
                                return [...prev, updated];
                            });
                        } else {
                            setDrivers(prev => prev.filter(d => d.id !== updated.id));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { drivers, loading };
}

// ============================================
// Hook: Course Unique avec Realtime
// ============================================
export function useRide(rideId: string | null) {
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!rideId) {
            setRide(null);
            setLoading(false);
            return;
        }

        const fetchRide = async () => {
            const { data, error } = await supabase
                .from('rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (!error && data) {
                setRide(data);
            }
            setLoading(false);
        };

        fetchRide();

        // Realtime pour cette course
        const channel = supabase
            .channel(`ride-${rideId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rides',
                    filter: `id=eq.${rideId}`
                },
                (payload) => {
                    setRide(payload.new as Ride);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rideId]);

    return { ride, loading };
}

// ============================================
// Hook: Wallet Chauffeur
// ============================================
export function useDriverWallet(driverId: string | null) {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!driverId) return;

        const fetchWallet = async () => {
            // Récupérer le solde du chauffeur
            const { data: driver } = await supabase
                .from('drivers')
                .select('wallet_balance')
                .eq('id', driverId)
                .single();

            if (driver) {
                setBalance(driver.wallet_balance);
            }

            // Récupérer les transactions
            const { data: txs } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('driver_id', driverId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (txs) {
                setTransactions(txs);
            }

            setLoading(false);
        };

        fetchWallet();

        // Realtime sur le wallet
        const channel = supabase
            .channel(`wallet-${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'drivers',
                    filter: `id=eq.${driverId}`
                },
                (payload) => {
                    setBalance((payload.new as Driver).wallet_balance);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'wallet_transactions',
                    filter: `driver_id=eq.${driverId}`
                },
                (payload) => {
                    setTransactions(prev => [payload.new, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driverId]);

    return { balance, transactions, loading };
}
