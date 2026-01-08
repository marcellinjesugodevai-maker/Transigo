// =============================================
// TRANSIGO - DATABASE TYPES (Auto-générés par Supabase)
// Types TypeScript pour toutes les tables
// =============================================

// Enums
export type RideStatus = 'requested' | 'accepted' | 'arriving' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
export type TransactionType = 'topup' | 'commission';
export type VehicleType = 'standard' | 'comfort' | 'premium' | 'moto' | 'van';

// Tables
export interface User {
    id: string;
    phone: string;
    first_name: string;
    last_name: string;
    email: string | null;
    avatar_url: string | null;
    push_token: string | null;
    created_at: string;
    updated_at: string;
}

export interface Driver {
    id: string;
    user_id: string;
    phone: string;
    first_name: string;
    last_name: string;
    email: string | null;
    avatar_url: string | null;

    // Véhicule
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_plate: string;
    vehicle_color: string;
    vehicle_type: VehicleType;

    // Wallet & Stats
    wallet_balance: number;
    commission_rate: number; // 0.15 = 15%
    rating: number;
    total_rides: number;

    // Status
    is_online: boolean;
    is_verified: boolean;
    is_blocked: boolean;

    // Location (lat, lng)
    current_lat: number | null;
    current_lng: number | null;

    // Push
    push_token: string | null;

    created_at: string;
    updated_at: string;
}

export interface Ride {
    id: string;
    passenger_id: string;
    driver_id: string | null;

    // Status
    status: RideStatus;

    // Pickup
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;

    // Dropoff
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lng: number;

    // Tarification
    distance_km: number;
    duration_min: number;
    price: number;
    commission: number;
    vehicle_type: VehicleType;

    // Dates
    created_at: string;
    accepted_at: string | null;
    arrived_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;

    // Extra
    cancellation_reason: string | null;
    rating_by_passenger: number | null;
    rating_by_driver: number | null;
    tip: number;
}

export interface WalletTransaction {
    id: string;
    driver_id: string;
    type: TransactionType;
    amount: number;
    ride_id: string | null;
    description: string;
    created_at: string;
}

// Database Schema Type (pour le client Supabase)
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<User, 'id'>>;
            };
            drivers: {
                Row: Driver;
                Insert: Omit<Driver, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Driver, 'id'>>;
            };
            rides: {
                Row: Ride;
                Insert: Omit<Ride, 'id' | 'created_at'>;
                Update: Partial<Omit<Ride, 'id'>>;
            };
            wallet_transactions: {
                Row: WalletTransaction;
                Insert: Omit<WalletTransaction, 'id' | 'created_at'>;
                Update: Partial<Omit<WalletTransaction, 'id'>>;
            };
        };
    };
}

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
