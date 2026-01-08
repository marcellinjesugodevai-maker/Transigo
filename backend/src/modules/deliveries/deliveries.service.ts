import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

const PRICES = { small: 1000, medium: 1500, large: 2000 };
const PRICE_PER_KM = 100;

@Injectable()
export class DeliveriesService {
    calculatePrice(size: 'small' | 'medium' | 'large', distance: number) {
        return PRICES[size] + distance * PRICE_PER_KM;
    }

    async createDelivery(data: {
        senderId: string;
        pickupLat: number; pickupLng: number; pickupAddress: string;
        dropoffLat: number; dropoffLng: number; dropoffAddress: string;
        size: 'small' | 'medium' | 'large';
        description: string;
        receiverPhone: string;
        price: number;
    }): Promise<any> {
        const { data: delivery, error } = await supabase.from('deliveries').insert({
            sender_id: data.senderId,
            pickup_lat: data.pickupLat, pickup_lng: data.pickupLng, pickup_address: data.pickupAddress,
            dropoff_lat: data.dropoffLat, dropoff_lng: data.dropoffLng, dropoff_address: data.dropoffAddress,
            package_size: data.size,
            description: data.description,
            receiver_phone: data.receiverPhone,
            price: data.price,
            status: 'pending',
        }).select().single();
        if (error) throw error;
        return delivery;
    }

    async getMyDeliveries(userId: string): Promise<any> {
        const { data } = await supabase.from('deliveries')
            .select('*')
            .eq('sender_id', userId)
            .order('created_at', { ascending: false });
        return data;
    }

    async updateStatus(deliveryId: string, status: 'picked_up' | 'in_transit' | 'delivered'): Promise<any> {
        return supabase.from('deliveries').update({ status, [`${status}_at`]: new Date() }).eq('id', deliveryId);
    }
}
