// =============================================
// TRANSIGO ADMIN - PUSH NOTIFICATIONS UTILITY
// =============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushNotification {
    title: string;
    body: string;
    data?: Record<string, any>;
}

export interface NotificationTarget {
    type: 'all' | 'passengers' | 'drivers' | 'specific';
    userIds?: string[];
}

// Send notification to a single device
export async function sendPushNotification(
    expoPushToken: string,
    notification: PushNotification
): Promise<{ success: boolean; error?: string }> {
    try {
        const message = {
            to: expoPushToken,
            sound: 'default',
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
        };

        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();

        if (result.data?.status === 'error') {
            return { success: false, error: result.data.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Send notification to multiple devices
export async function sendBulkNotifications(
    tokens: string[],
    notification: PushNotification
): Promise<{ sent: number; success: number; failed: number }> {
    const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
    }));

    // Expo recommends batches of 100 max
    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
        batches.push(messages.slice(i, i + 100));
    }

    let success = 0;
    let failed = 0;

    for (const batch of batches) {
        try {
            const response = await fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batch),
            });

            const results = await response.json();

            if (Array.isArray(results.data)) {
                results.data.forEach((r: any) => {
                    if (r.status === 'ok') success++;
                    else failed++;
                });
            }
        } catch (error) {
            failed += batch.length;
        }
    }

    return { sent: tokens.length, success, failed };
}

// Get push tokens based on target
export async function getTargetTokens(target: NotificationTarget): Promise<string[]> {
    let query = supabase
        .from('push_tokens')
        .select('token')
        .eq('is_active', true);

    if (target.type === 'passengers') {
        query = query.eq('app_type', 'passenger');
    } else if (target.type === 'drivers') {
        query = query.eq('app_type', 'driver');
    } else if (target.type === 'specific' && target.userIds) {
        query = query.or(
            `user_id.in.(${target.userIds.join(',')}),driver_id.in.(${target.userIds.join(',')})`
        );
    }
    // 'all' = no filter

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }

    return data?.map(row => row.token) || [];
}

// Log notification to database
export async function logNotification(
    notification: PushNotification,
    target: NotificationTarget,
    stats: { sent: number; success: number; failed: number },
    adminId?: string
): Promise<void> {
    await supabase.from('notifications_log').insert({
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        notification_type: 'manual',
        target_type: target.type,
        target_ids: target.userIds || [],
        sent_count: stats.sent,
        success_count: stats.success,
        failure_count: stats.failed,
        created_by: adminId,
    });
}

// Main function to send notification with logging
export async function sendNotificationToTarget(
    notification: PushNotification,
    target: NotificationTarget,
    adminId?: string
): Promise<{ sent: number; success: number; failed: number }> {
    // Get tokens
    const tokens = await getTargetTokens(target);

    if (tokens.length === 0) {
        return { sent: 0, success: 0, failed: 0 };
    }

    // Send notifications
    const stats = await sendBulkNotifications(tokens, notification);

    // Log to database
    await logNotification(notification, target, stats, adminId);

    return stats;
}

// Get notification history
export async function getNotificationHistory(limit = 50): Promise<any[]> {
    const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data || [];
}

// Get active tokens count
export async function getTokensStats(): Promise<{ passengers: number; drivers: number; total: number }> {
    const { data, error } = await supabase
        .from('push_tokens')
        .select('app_type')
        .eq('is_active', true);

    if (error) {
        return { passengers: 0, drivers: 0, total: 0 };
    }

    const passengers = data?.filter(t => t.app_type === 'passenger').length || 0;
    const drivers = data?.filter(t => t.app_type === 'driver').length || 0;

    return { passengers, drivers, total: passengers + drivers };
}
