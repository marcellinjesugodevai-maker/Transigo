import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

const COMMISSION_RATES = { bronze: 0.12, silver: 0.11, gold: 0.10, platinum: 0.09, diamond: 0.08 };

@Injectable()
export class DriversService {
    async findById(id: string): Promise<any> {
        const { data } = await supabase.from('drivers').select('*, users(*)').eq('user_id', id).single();
        return data;
    }

    async findNearby(latitude: number, longitude: number, radius: number = 5000, filters?: { hasAC?: boolean; isFemale?: boolean }): Promise<any[]> {
        let query = supabase.from('drivers').select('*, users(*)').eq('is_online', true);
        if (filters?.hasAC) query = query.eq('has_ac', true);
        if (filters?.isFemale) query = query.eq('is_female', true);

        const { data } = await query;
        // Filter by distance (simplified - in production use PostGIS)
        return data?.filter(d => {
            const dist = this.calculateDistance(latitude, longitude, d.current_lat, d.current_lng);
            return dist <= radius;
        }) || [];
    }

    async setOnlineStatus(driverId: string, isOnline: boolean): Promise<any> {
        await supabase.from('drivers').update({ is_online: isOnline, updated_at: new Date() }).eq('user_id', driverId);
        return { isOnline };
    }

    async updateLocation(driverId: string, latitude: number, longitude: number): Promise<void> {
        await supabase.from('drivers').update({ current_lat: latitude, current_lng: longitude, updated_at: new Date() }).eq('user_id', driverId);
    }

    async getEarnings(driverId: string, period: 'day' | 'week' | 'month'): Promise<any> {
        const now = new Date();
        let startDate: Date;
        if (period === 'day') startDate = new Date(now.setHours(0, 0, 0, 0));
        else if (period === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
        else startDate = new Date(now.setMonth(now.getMonth() - 1));

        const { data: rides } = await supabase.from('rides')
            .select('driver_earnings, final_price, commission')
            .eq('driver_id', driverId)
            .eq('status', 'completed')
            .gte('completed_at', startDate.toISOString());

        const totalEarnings = rides?.reduce((sum, r) => sum + r.driver_earnings, 0) || 0;
        const totalCommission = rides?.reduce((sum, r) => sum + r.commission, 0) || 0;
        const rideCount = rides?.length || 0;

        return { totalEarnings, totalCommission, rideCount, period };
    }

    async getLevel(driverId: string): Promise<{ level: string; commission: number; ridesCount: number }> {
        const { data } = await supabase.from('rides').select('id').eq('driver_id', driverId).eq('status', 'completed');
        const ridesCount = data?.length || 0;

        let level: string;
        if (ridesCount >= 1000) level = 'diamond';
        else if (ridesCount >= 500) level = 'platinum';
        else if (ridesCount >= 300) level = 'gold';
        else if (ridesCount >= 100) level = 'silver';
        else level = 'bronze';

        return { level, commission: COMMISSION_RATES[level], ridesCount };
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
