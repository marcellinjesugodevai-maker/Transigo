import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

const PRIZES = [
    { rank: 1, amount: 100000, label: '1er Prix: 100,000 FCFA' },
    { rank: 2, amount: 50000, label: '2ème Prix: 50,000 FCFA' },
    { rank: 3, amount: 25000, label: '3ème Prix: 25,000 FCFA' },
];

@Injectable()
export class LotteryService {
    async getTickets(userId: string): Promise<any> {
        const { data } = await supabase.from('lottery_tickets')
            .select('*')
            .eq('user_id', userId)
            .eq('is_used', false);
        return { tickets: data || [], count: data?.length || 0 };
    }

    async earnTicket(userId: string, reason: 'ride_completed' | 'referral' | 'subscription'): Promise<any> {
        await supabase.from('lottery_tickets').insert({
            user_id: userId, earned_from: reason, is_used: false
        });
        return { message: 'Ticket gagné!' };
    }

    async playLottery(userId: string): Promise<any> {
        const { data: tickets } = await supabase.from('lottery_tickets')
            .select('id')
            .eq('user_id', userId)
            .eq('is_used', false)
            .limit(1);

        if (!tickets?.length) throw new Error('Aucun ticket disponible');

        // Mark ticket as used
        await supabase.from('lottery_tickets').update({ is_used: true }).eq('id', tickets[0].id);

        // Random draw (1% chance for each prize)
        const random = Math.random() * 100;
        let prize: typeof PRIZES[0] | null = null;
        if (random < 0.1) prize = PRIZES[0]; // 0.1% for 1st prize
        else if (random < 0.5) prize = PRIZES[1]; // 0.4% for 2nd prize
        else if (random < 1.5) prize = PRIZES[2]; // 1% for 3rd prize

        if (prize) {
            // Credit wallet
            const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
            const newBalance = (wallet?.balance || 0) + prize.amount;
            await supabase.from('wallets').upsert({ user_id: userId, balance: newBalance });
            await supabase.from('lottery_wins').insert({ user_id: userId, prize_rank: prize.rank, amount: prize.amount });
            return { won: true, prize };
        }

        return { won: false, message: 'Pas de chance cette fois! Réessayez.' };
    }

    async getWinners(limit = 10): Promise<any> {
        const { data } = await supabase.from('lottery_wins')
            .select('*, users(first_name)')
            .order('created_at', { ascending: false })
            .limit(limit);
        return data;
    }
}
