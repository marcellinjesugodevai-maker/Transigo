// =============================================
// TRANSIGO ADMIN - SUPABASE CLIENT
// =============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zndgvloyaitopczhjddq.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Admin Services
// ============================================

export const adminService = {
    // Stats globales
    getStats: async () => {
        const [
            { count: totalDrivers },
            { count: onlineDrivers },
            { count: totalUsers },
            { count: totalRides },
            { count: activeRides },
        ] = await Promise.all([
            supabase.from('drivers').select('*', { count: 'exact', head: true }),
            supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('rides').select('*', { count: 'exact', head: true }),
            supabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['requested', 'accepted', 'arriving', 'in_progress']),
        ]);

        // Total revenus (commissions)
        const { data: revenueData } = await supabase
            .from('rides')
            .select('commission')
            .eq('status', 'completed');

        const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.commission || 0), 0) || 0;

        return {
            totalDrivers: totalDrivers || 0,
            onlineDrivers: onlineDrivers || 0,
            totalUsers: totalUsers || 0,
            totalRides: totalRides || 0,
            activeRides: activeRides || 0,
            totalRevenue,
        };
    },

    // Liste des chauffeurs
    getDrivers: async () => {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .order('created_at', { ascending: false });
        return { drivers: data || [], error };
    },

    // Liste des courses
    getRides: async (status?: string) => {
        let query = supabase
            .from('rides')
            .select('*, users!passenger_id(first_name, last_name), drivers!driver_id(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        return { rides: data || [], error };
    },

    // Recharger wallet chauffeur (admin)
    topUpDriverWallet: async (driverId: string, amount: number) => {
        // Use RPC with secure key to bypass RLS
        const { data, error } = await supabase.rpc('admin_top_up_wallet', {
            p_driver_id: driverId,
            p_amount: amount,
            p_secret_key: 'TRANSIGO_ADMIN_SECRET_2026'
        });

        if (error) {
            console.error('RPC Error:', error);
            throw new Error(error.message);
        }

        // RPC returns JSON { success: true, new_balance: ..., message: ... }
        return { balance: data?.new_balance };
    },

    // Liste des transactions wallet
    getTransactions: async (status?: string) => {
        let query = supabase
            .from('wallet_transactions')
            .select(`*, drivers!driver_id(first_name, last_name, phone)`)
            .order('created_at', { ascending: false })
            .limit(100);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        return { transactions: data || [], error };
    },

    // Approuver une transaction (Créditer Wallet)
    approveTransaction: async (transactionId: string) => {
        // 1. Get Transaction
        const { data: tx, error: fetchError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchError || !tx) return { error: 'Transaction non trouvée' };
        if (tx.status === 'completed') return { error: 'Déjà validée' };

        // 2. Update Transaction Status
        const { error: updateError } = await supabase
            .from('wallet_transactions')
            .update({ status: 'completed' })
            .eq('id', transactionId);

        if (updateError) return { error: updateError };

        // 3. Update Driver Wallet (Increment)
        const { data: driver } = await supabase
            .from('drivers').select('wallet_balance').eq('id', tx.driver_id).single();

        const newBalance = (driver?.wallet_balance || 0) + tx.amount;

        await supabase
            .from('drivers')
            .update({ wallet_balance: newBalance })
            .eq('id', tx.driver_id);

        return { success: true };
    },

    // Rejeter une transaction
    rejectTransaction: async (transactionId: string) => {
        const { error } = await supabase
            .from('wallet_transactions')
            .update({ status: 'rejected' })
            .eq('id', transactionId);
        return { error };
    },

    // Bloquer/Débloquer chauffeur (RPC)
    toggleDriverBlock: async (driverId: string, blocked: boolean) => {
        const { error } = await supabase.rpc('admin_block_driver', {
            p_driver_id: driverId,
            p_blocked: blocked,
            p_secret_key: 'TRANSIGO_ADMIN_SECRET_2026'
        });
        return { error };
    },

    // Vérifier un chauffeur (validation admin - RPC)
    verifyDriver: async (driverId: string, verified: boolean) => {
        const { error } = await supabase.rpc('admin_verify_driver', {
            p_driver_id: driverId,
            p_verified: verified,
            p_secret_key: 'TRANSIGO_ADMIN_SECRET_2026'
        });
        return { error };
    },

    // Supprimer un chauffeur (Auth + DB)
    deleteDriver: async (driverId: string) => {
        try {
            const response = await fetch('/api/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: driverId }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: { message: data.error || 'Erreur lors de la suppression' } };
            }

            return { error: null };
        } catch (e: any) {
            return { error: e };
        }
    },

    // Modifier un chauffeur
    updateDriver: async (driverId: string, updates: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        email?: string;
        profile_type?: 'driver' | 'delivery' | 'seller';
        vehicle_type?: string;
        vehicle_plate?: string;
        vehicle_brand?: string;
        vehicle_model?: string;
        vehicle_color?: string;
        commission_rate?: number;
    }) => {
        const { data, error } = await supabase
            .from('drivers')
            .update(updates)
            .eq('id', driverId)
            .select()
            .single();

        return { driver: data, error };
    },

    // S'abonner aux stats en temps réel
    subscribeToStats: (callback: () => void) => {
        const channel = supabase
            .channel('admin-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, callback)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, callback)
            .subscribe();

        return () => supabase.removeChannel(channel);
    },
};

// ============================================
// Admin Auth Service (RBAC)
// ============================================

export type AdminRole = 'super_admin' | 'controller_passengers' | 'manager_wallets' | 'supervisor_drivers' | 'support_client' | 'analyst';

export interface AdminUser {
    id: string;
    email: string;
    role: AdminRole;
    first_name: string;
    last_name: string;
    is_active: boolean;
}

export const PAGE_PERMISSIONS: Record<string, AdminRole[]> = {
    '/': ['super_admin', 'controller_passengers', 'manager_wallets', 'supervisor_drivers', 'analyst'],
    '/drivers': ['super_admin', 'supervisor_drivers'],
    '/rides': ['super_admin', 'controller_passengers'],
    '/users': ['super_admin', 'controller_passengers'],
    '/wallets': ['super_admin', 'manager_wallets'],
    '/transactions': ['super_admin', 'manager_wallets'],
    '/reviews': ['super_admin', 'support_client'],
    '/tickets': ['super_admin', 'controller_passengers', 'support_client'],
    '/chat': ['super_admin', 'controller_passengers', 'support_client'],
    '/faq': ['super_admin'],
    '/analytics': ['super_admin', 'analyst'],
    '/admin-users': ['super_admin'],
    '/deliveries': ['super_admin', 'supervisor_drivers'],
    '/settings': ['super_admin'],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
    super_admin: '👑 Super Admin',
    controller_passengers: '👥 Contrôleur Passagers',
    manager_wallets: '💳 Gestionnaire Wallets',
    supervisor_drivers: '👨‍✈️ Superviseur Chauffeurs',
    support_client: '💬 Support Client',
    analyst: '📊 Analyste',
};

// Secure password hashing using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'TRANSIGO_SALT_2026'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const adminAuthService = {
    // Login with hashed password
    login: async (email: string, password: string) => {
        // Hash the password before comparing
        const hashedPassword = await hashPassword(password);

        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('password_hash', hashedPassword)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { user: null, error: 'Email ou mot de passe incorrect' };
        }

        // Update last_login
        await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

        // Store in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_user', JSON.stringify(data));
        }

        return { user: data as AdminUser, error: null };
    },

    // Logout
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_user');
        }
    },

    // Get current user
    getCurrentUser: (): AdminUser | null => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('admin_user');
        return stored ? JSON.parse(stored) : null;
    },

    // Check page access
    canAccessPage: (path: string, role: AdminRole): boolean => {
        const allowedRoles = PAGE_PERMISSIONS[path];
        if (!allowedRoles) return true; // Page non protégée
        return allowedRoles.includes(role);
    },

    // Get allowed pages for role
    getAllowedPages: (role: AdminRole): string[] => {
        return Object.entries(PAGE_PERMISSIONS)
            .filter(([_, roles]) => roles.includes(role))
            .map(([path]) => path);
    },

    // Get all admin users (super_admin only)
    getAdminUsers: async () => {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, role, first_name, last_name, is_active, created_at, last_login')
            .order('created_at', { ascending: false });
        return { users: data || [], error };
    },

    // Create admin user (super_admin only) - password hashed before storage
    createAdminUser: async (userData: { email: string; password: string; role: AdminRole; first_name: string; last_name: string }) => {
        // Hash the password before storing
        const hashedPassword = await hashPassword(userData.password);

        const { data, error } = await supabase
            .from('admin_users')
            .insert({
                email: userData.email.toLowerCase(),
                password_hash: hashedPassword,
                role: userData.role,
                first_name: userData.first_name,
                last_name: userData.last_name,
            })
            .select()
            .single();
        return { user: data, error };
    },

    // Toggle admin active status
    toggleAdminActive: async (adminId: string, isActive: boolean) => {
        const { error } = await supabase
            .from('admin_users')
            .update({ is_active: isActive })
            .eq('id', adminId);
        return { error };
    },

    // Delete admin user
    deleteAdminUser: async (adminId: string) => {
        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', adminId);
        return { error };
    },
};

// ============================================
// Reviews Service (Avis utilisateurs)
// ============================================

export interface Review {
    id: string;
    name: string;
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
}

export const reviewsService = {
    // Get all reviews (admin - all, public - only approved)
    getAll: async (onlyApproved: boolean = false) => {
        let query = supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (onlyApproved) {
            query = query.eq('is_approved', true);
        }

        const { data, error } = await query;
        return { reviews: data || [], error };
    },

    // Get approved reviews for public display
    getApproved: async () => {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(20);
        return { reviews: data || [], error };
    },

    // Create new review
    create: async (review: { name: string; rating: number; comment: string }) => {
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                name: review.name,
                rating: review.rating,
                comment: review.comment,
                is_approved: false, // Par défaut non approuvé
            })
            .select()
            .single();
        return { review: data, error };
    },

    // Approve review
    approve: async (reviewId: string) => {
        const { error } = await supabase
            .from('reviews')
            .update({ is_approved: true })
            .eq('id', reviewId);
        return { error };
    },

    // Reject/Unapprove review
    reject: async (reviewId: string) => {
        const { error } = await supabase
            .from('reviews')
            .update({ is_approved: false })
            .eq('id', reviewId);
        return { error };
    },

    // Delete review
    delete: async (reviewId: string) => {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);
        return { error };
    },

    // Get stats
    getStats: async () => {
        const { data: all } = await supabase
            .from('reviews')
            .select('*');

        const reviews = all || [];
        const total = reviews.length;
        const approved = reviews.filter(r => r.is_approved).length;
        const pending = reviews.filter(r => !r.is_approved).length;
        const avgRating = total > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)
            : "0.0";

        return { total, approved, pending, avgRating };
    },
};

