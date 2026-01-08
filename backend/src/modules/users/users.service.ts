import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

@Injectable()
export class UsersService {
    async findById(id: string): Promise<any> {
        const { data } = await supabase.from('users').select('*').eq('id', id).single();
        return data;
    }

    async findByPhone(phone: string): Promise<any> {
        const { data } = await supabase.from('users').select('*').eq('phone', phone).single();
        return data;
    }

    async update(id: string, data: any): Promise<any> {
        const { data: user, error } = await supabase.from('users').update(data).eq('id', id).select().single();
        if (error) throw error;
        return user;
    }

    async updateLocation(id: string, latitude: number, longitude: number): Promise<any> {
        return this.update(id, { current_lat: latitude, current_lng: longitude, updated_at: new Date() });
    }

    async getWallet(userId: string): Promise<any> {
        const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
        return data || { balance: 0 };
    }

    async updateWallet(userId: string, amount: number, type: 'credit' | 'debit', description: string): Promise<any> {
        const wallet = await this.getWallet(userId);
        const newBalance = type === 'credit' ? wallet.balance + amount : wallet.balance - amount;

        await supabase.from('wallets').upsert({ user_id: userId, balance: newBalance });
        await supabase.from('wallet_transactions').insert({
            user_id: userId, type, amount, description, balance_after: newBalance
        });

        return { balance: newBalance };
    }
}
