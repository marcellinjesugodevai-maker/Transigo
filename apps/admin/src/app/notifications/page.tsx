'use client';

import { useState, useEffect } from 'react';
import {
    sendNotificationToTarget,
    getNotificationHistory,
    getTokensStats,
    NotificationTarget,
    PushNotification
} from '@/lib/pushNotifications';

export default function NotificationsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [target, setTarget] = useState<'all' | 'passengers' | 'drivers'>('all');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ sent: number; success: number; failed: number } | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ passengers: 0, drivers: 0, total: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [historyData, statsData] = await Promise.all([
            getNotificationHistory(20),
            getTokensStats()
        ]);
        setHistory(historyData);
        setStats(statsData);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !body.trim()) {
            alert('Veuillez remplir le titre et le message');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const notification: PushNotification = { title, body };
            const targetConfig: NotificationTarget = { type: target };

            const res = await sendNotificationToTarget(notification, targetConfig);
            setResult(res);

            // Refresh history
            await loadData();

            // Reset form
            setTitle('');
            setBody('');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('fr-FR');
    };

    const getTargetLabel = (type: string) => {
        switch (type) {
            case 'all': return 'Tous';
            case 'passengers': return 'Passagers';
            case 'drivers': return 'Chauffeurs';
            default: return type;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-green-400">📢 Centre de Notifications</h1>
                    <p className="text-gray-400 mt-2">Envoyez des notifications push aux utilisateurs TransiGo</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm">Appareils Passagers</p>
                        <p className="text-3xl font-bold text-orange-400">{stats.passengers}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm">Appareils Chauffeurs</p>
                        <p className="text-3xl font-bold text-green-400">{stats.drivers}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm">Total Appareils</p>
                        <p className="text-3xl font-bold text-blue-400">{stats.total}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Nouvelle Notification</h2>

                        <form onSubmit={handleSend} className="space-y-4">
                            {/* Target */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Destinataires</label>
                                <div className="flex gap-2">
                                    {(['all', 'passengers', 'drivers'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTarget(t)}
                                            className={`px-4 py-2 rounded-lg transition ${target === t
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            {getTargetLabel(t)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: 🎉 Promotion spéciale !"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    maxLength={100}
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Message</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Ex: Profitez de -20% sur votre prochaine course !"
                                    rows={3}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    maxLength={500}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !title.trim() || !body.trim()}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '⏳ Envoi en cours...' : '📤 Envoyer la Notification'}
                            </button>
                        </form>

                        {/* Result */}
                        {result && (
                            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                                <p className="text-green-400 font-semibold">✅ Notification envoyée !</p>
                                <p className="text-sm text-gray-300 mt-1">
                                    Envoyées: {result.sent} | Succès: {result.success} | Échecs: {result.failed}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Historique</h2>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {history.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Aucune notification envoyée</p>
                            ) : (
                                history.map((notif) => (
                                    <div key={notif.id} className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-white">{notif.title}</p>
                                                <p className="text-sm text-gray-300 mt-1">{notif.body}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded ${notif.target_type === 'all' ? 'bg-blue-500/20 text-blue-400' :
                                                    notif.target_type === 'passengers' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {getTargetLabel(notif.target_type)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                                            <span>{formatDate(notif.created_at)}</span>
                                            <span>
                                                ✅ {notif.success_count} | ❌ {notif.failure_count}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
