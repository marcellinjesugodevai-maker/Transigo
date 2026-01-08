import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

@Injectable()
export class PaymentsService {
    async getBalance(userId: string): Promise<any> {
        const { data } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
        return { balance: data?.balance || 0 };
    }

    async topUp(userId: string, amount: number, method: 'orange_money' | 'mtn_money' | 'wave' | 'card'): Promise<any> {
        // In production: integrate with payment provider
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
        const newBalance = (wallet?.balance || 0) + amount;

        await supabase.from('wallets').upsert({ user_id: userId, balance: newBalance });
        await supabase.from('wallet_transactions').insert({
            user_id: userId, type: 'credit', amount, description: `Recharge ${method}`, balance_after: newBalance
        });

        return { balance: newBalance, transaction_id: `TXN${Date.now()}` };
    }

    async withdraw(userId: string, amount: number, phone: string, method: 'orange_money' | 'mtn_money' | 'wave'): Promise<any> {
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
        if (!wallet || wallet.balance < amount) throw new Error('Solde insuffisant');

        const newBalance = wallet.balance - amount;
        await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
        await supabase.from('wallet_transactions').insert({
            user_id: userId, type: 'debit', amount, description: `Retrait ${method} vers ${phone}`, balance_after: newBalance
        });

        return { balance: newBalance, message: 'Retrait effectué' };
    }

    async getTransactions(userId: string, limit = 50): Promise<any> {
        const { data } = await supabase.from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return data;
    }
}
