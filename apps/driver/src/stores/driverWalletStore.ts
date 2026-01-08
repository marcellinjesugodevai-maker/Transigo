// =============================================
// TRANSIGO DRIVER - WALLET STORE
// Gestion du portefeuille chauffeur avec Zustand
// Commission 15% prélevée automatiquement
// =============================================

import { create } from 'zustand';

// Types
export interface WalletTransaction {
    id: string;
    type: 'topup' | 'commission' | 'deposit';
    amount: number;
    rideId?: string;
    ridePrice?: number;
    date: Date;
    description: string;
    status?: 'pending' | 'completed' | 'rejected';
    created_at?: string;
}

interface WalletState {
    // Configuration
    commissionRate: number;           // 15% = 0.15
    minimumBalance: number;           // Seuil minimum pour rester en ligne

    // État du wallet
    balance: number;
    isBlocked: boolean;
    transactions: WalletTransaction[];
    lastTopUp: Date | null;

    // Actions
    // Actions
    setWalletState: (balance: number, isBlocked: boolean) => void;
    topUp: (amount: number, method?: string) => void;
    deductCommission: (rideId: string, ridePrice: number) => boolean;
    checkAvailability: () => { canGoOnline: boolean; message: string };
    getRecentTransactions: (limit?: number) => WalletTransaction[];
    getTotalCommissionPaid: () => number;
    resetWallet: () => void;
}

// Générer un ID unique
const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Formater le montant en FCFA
export const formatCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
};

export const useDriverWalletStore = create<WalletState>((set, get) => ({
    // Configuration par défaut
    commissionRate: 0.15,     // 15%
    minimumBalance: 1000,     // 1 000 FCFA minimum

    // État initial (vide, sera rempli par Supabase)
    balance: 0,
    isBlocked: false,
    transactions: [],
    lastTopUp: null,

    // ============ ACTIONS ============

    // Mettre à jour depuis le backend
    setWalletState: (balance: number, isBlocked: boolean) => {
        set({ balance, isBlocked });
    },

    // ============ ACTIONS ============

    // Recharger le wallet
    topUp: (amount: number, method = 'Mobile Money') => {
        const transaction: WalletTransaction = {
            id: generateId(),
            type: 'topup',
            amount,
            date: new Date(),
            description: `Recharge ${method}`,
        };

        set((state) => {
            const newBalance = state.balance + amount;
            const isNowBlocked = newBalance < state.minimumBalance;

            return {
                balance: newBalance,
                isBlocked: isNowBlocked,
                transactions: [transaction, ...state.transactions],
                lastTopUp: new Date(),
            };
        });
    },

    // Prélever la commission (appelé à la fin de chaque course)
    deductCommission: (rideId: string, ridePrice: number) => {
        const state = get();
        const commissionAmount = Math.round(ridePrice * state.commissionRate);

        // Vérifier si le solde est suffisant
        if (state.balance < commissionAmount) {
            // Prélever ce qui reste et bloquer
            const transaction: WalletTransaction = {
                id: generateId(),
                type: 'commission',
                amount: state.balance,
                rideId,
                ridePrice,
                date: new Date(),
                description: `Commission partielle course #${rideId.slice(-3)} (solde insuffisant)`,
            };

            set({
                balance: 0,
                isBlocked: true,
                transactions: [transaction, ...state.transactions],
            });

            return false; // Indiquer qu'il y a un problème
        }

        // Prélèvement normal
        const transaction: WalletTransaction = {
            id: generateId(),
            type: 'commission',
            amount: commissionAmount,
            rideId,
            ridePrice,
            date: new Date(),
            description: `Commission course #${rideId.slice(-3)} (${state.commissionRate * 100}%)`,
        };

        const newBalance = state.balance - commissionAmount;
        const isNowBlocked = newBalance < state.minimumBalance;

        set({
            balance: newBalance,
            isBlocked: isNowBlocked,
            transactions: [transaction, ...state.transactions],
        });

        return !isNowBlocked; // true si tout va bien
    },

    // Vérifier si le chauffeur peut aller en ligne
    checkAvailability: () => {
        const { balance, minimumBalance } = get();

        if (balance < minimumBalance) {
            return {
                canGoOnline: false,
                message: `Solde insuffisant. Minimum requis: ${formatCFA(minimumBalance)}. Votre solde: ${formatCFA(balance)}`,
            };
        }

        return {
            canGoOnline: true,
            message: 'Votre solde est suffisant pour recevoir des courses.',
        };
    },

    // Obtenir les transactions récentes
    getRecentTransactions: (limit = 10) => {
        return get().transactions.slice(0, limit);
    },

    // Calculer le total des commissions payées
    getTotalCommissionPaid: () => {
        return get().transactions
            .filter((t) => t.type === 'commission')
            .reduce((sum, t) => sum + t.amount, 0);
    },

    // Reset (pour les tests)
    resetWallet: () => {
        set({
            balance: 15000,
            isBlocked: false,
            transactions: [],
            lastTopUp: null,
        });
    },
}));
