import { useEffect } from 'react';
import { supabase } from './supabaseService';
import { useDriverStore } from '../stores/driverStore';
import { useDriverWalletStore } from '../stores/driverWalletStore';

export function useDriverSync() {
    const { driver } = useDriverStore();
    const { setWalletState } = useDriverWalletStore();

    useEffect(() => {
        if (!driver?.id) return;

        console.log('[DriverSync] Subscribing to driver updates:', driver.id);

        // 1. Initial Fetch (pour être sûr d'avoir le vrai solde au démarrage)
        const fetchLatest = async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('wallet_balance, is_blocked, is_online')
                .eq('id', driver.id)
                .single();

            if (data) {
                console.log('[DriverSync] Initial sync:', data);
                setWalletState(data.wallet_balance || 0, data.is_blocked || false);
            }
        };
        fetchLatest();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`driver-sync-${driver.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'drivers',
                    filter: `id=eq.${driver.id}`,
                },
                (payload) => {
                    const newData = payload.new;
                    console.log('[DriverSync] Realtime update:', newData);

                    // Mettre à jour le wallet & statut
                    setWalletState(newData.wallet_balance || 0, newData.is_blocked || false);

                    // On pourrait aussi mettre à jour is_online ici si l'admin le force
                }
            )
            .subscribe();

        return () => {
            console.log('[DriverSync] Unsubscribing');
            supabase.removeChannel(channel);
        };
    }, [driver?.id]);
}
