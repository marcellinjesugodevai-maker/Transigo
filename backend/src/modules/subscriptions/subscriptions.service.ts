import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

const PLANS = {
    basic: { name: 'Basic', price: 5000, ridesPerMonth: 10, discount: 0.10 },
    pro: { name: 'Pro', price: 15000, ridesPerMonth: 30, discount: 0.20 },
    unlimited: { name: 'Unlimited', price: 30000, ridesPerMonth: -1, discount: 0.30 },
    student: { name: 'Student', price: 3000, ridesPerMonth: 20, discount: 0.30 },
};

@Injectable()
export class SubscriptionsService {
    getPlans(): any[] {
        return Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan }));
    }

    async getCurrentSubscription(userId: string): Promise<any> {
        const { data } = await supabase.from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .single();
        return data;
    }

    async subscribe(userId: string, planId: keyof typeof PLANS): Promise<any> {
        const plan = PLANS[planId];
        if (!plan) throw new Error('Plan invalide');

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Deactivate existing subscription
        await supabase.from('subscriptions').update({ status: 'expired' }).eq('user_id', userId).eq('status', 'active');

        // Create new subscription
        const { data, error } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            plan_name: plan.name,
            price: plan.price,
            rides_remaining: plan.ridesPerMonth,
            discount_percent: plan.discount * 100,
            status: 'active',
            expires_at: expiresAt,
        }).select().single();

        if (error) throw error;
        return data;
    }

    async useRide(userId: string): Promise<any> {
        const sub = await this.getCurrentSubscription(userId);
        if (!sub) return { hasSubscription: false, discount: 0 };
        if (sub.rides_remaining === 0) return { hasSubscription: true, ridesRemaining: 0, discount: 0 };

        if (sub.rides_remaining > 0) {
            await supabase.from('subscriptions').update({ rides_remaining: sub.rides_remaining - 1 }).eq('id', sub.id);
        }

        return { hasSubscription: true, ridesRemaining: sub.rides_remaining - 1, discount: sub.discount_percent / 100 };
    }
}
