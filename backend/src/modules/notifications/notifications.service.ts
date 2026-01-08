import { Injectable } from '@nestjs/common';
import supabase from '../../config/supabase';

@Injectable()
export class NotificationsService {
    async send(userId: string, title: string, body: string, type: 'ride' | 'payment' | 'promo' | 'system'): Promise<void> {
        await supabase.from('notifications').insert({ user_id: userId, title, body, type, is_read: false });
        // TODO: Integrate with Firebase Cloud Messaging for push notifications
    }

    async getNotifications(userId: string, limit = 50): Promise<any> {
        const { data } = await supabase.from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return data;
    }

    async markAsRead(notificationId: string): Promise<any> {
        return supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    }

    async markAllAsRead(userId: string): Promise<any> {
        return supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    }
}
