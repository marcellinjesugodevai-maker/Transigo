import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';
import { v4 as uuid } from 'uuid';

const BASE_PRICE = { car: 500, car_ac: 800, moto: 300 };
const PRICE_PER_KM = { car: 200, car_ac: 300, moto: 150 };
const STUDENT_DISCOUNT = 0.30;
const SHARED_DISCOUNT = 0.70;

@Injectable()
export class RidesService {
    async calculatePrice(distance: number, serviceType: 'car' | 'car_ac' | 'moto', isStudent = false, isShared = false): Promise<number> {
        let price = BASE_PRICE[serviceType] + distance * PRICE_PER_KM[serviceType];
        if (isStudent) price *= (1 - STUDENT_DISCOUNT);
        if (isShared) price *= (1 - SHARED_DISCOUNT);
        return Math.round(price / 100) * 100; // Round to nearest 100
    }

    async requestRide(data: {
        passengerId: string;
        pickupLat: number;
        pickupLng: number;
        pickupAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        dropoffAddress: string;
        serviceType: 'car' | 'car_ac' | 'moto';
        estimatedPrice: number;
        passengerOffer?: number;
        womenOnly: boolean;
        isShared: boolean;
    }): Promise<any> {
        const { data: ride, error } = await supabase.from('rides').insert({
            id: uuid(),
            passenger_id: data.passengerId,
            pickup_lat: data.pickupLat,
            pickup_lng: data.pickupLng,
            pickup_address: data.pickupAddress,
            dropoff_lat: data.dropoffLat,
            dropoff_lng: data.dropoffLng,
            dropoff_address: data.dropoffAddress,
            service_type: data.serviceType,
            estimated_price: data.estimatedPrice,
            passenger_offer: data.passengerOffer,
            women_only: data.womenOnly,
            is_shared: data.isShared,
            status: 'pending',
        }).select().single();

        if (error) throw error;
        return ride;
    }

    async acceptRide(rideId: string, driverId: string, finalPrice: number, commissionRate: number): Promise<any> {
        const commission = Math.round(finalPrice * commissionRate);
        const driverEarnings = finalPrice - commission;

        const { data: ride, error } = await supabase.from('rides').update({
            driver_id: driverId,
            final_price: finalPrice,
            commission,
            driver_earnings: driverEarnings,
            status: 'accepted',
            accepted_at: new Date(),
        }).eq('id', rideId).select().single();

        if (error) throw error;
        return ride;
    }

    async startRide(rideId: string, driverId: string): Promise<any> {
        return supabase.from('rides').update({ status: 'in_progress', started_at: new Date() }).eq('id', rideId).eq('driver_id', driverId);
    }

    async completeRide(rideId: string, driverId: string): Promise<any> {
        const { data: ride } = await supabase.from('rides').update({
            status: 'completed',
            completed_at: new Date()
        }).eq('id', rideId).eq('driver_id', driverId).select().single();

        // Credit driver wallet
        if (ride) {
            await supabase.from('wallets').upsert({
                user_id: driverId,
                balance: supabase.rpc('increment_wallet', { user_id: driverId, amount: ride.driver_earnings })
            });
        }

        return ride;
    }

    async cancelRide(rideId: string, userId: string, reason: string): Promise<any> {
        return supabase.from('rides').update({
            status: 'cancelled',
            cancelled_by: userId,
            cancellation_reason: reason,
            cancelled_at: new Date()
        }).eq('id', rideId);
    }

    async getActiveRide(userId: string): Promise<any> {
        const { data } = await supabase.from('rides')
            .select('*, driver:drivers(*)')
            .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
            .in('status', ['pending', 'accepted', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        return data;
    }

    async getHistory(userId: string, role: 'passenger' | 'driver', limit = 20): Promise<any> {
        const column = role === 'passenger' ? 'passenger_id' : 'driver_id';
        const { data } = await supabase.from('rides')
            .select('*')
            .eq(column, userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(limit);
        return data;
    }
}
