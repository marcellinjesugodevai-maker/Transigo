"use client";

import { useState, useEffect } from "react";
import {
    Star,
    CheckCircle,
    XCircle,
    Trash2,
    MessageSquare,
    Clock,
    ThumbsUp,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { reviewsService, Review } from "@/lib/supabase";

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: "0.0" });
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadReviews = async () => {
        setLoading(true);
        const { reviews: data } = await reviewsService.getAll();
        setReviews(data);

        const statsData = await reviewsService.getStats();
        setStats(statsData);

        setLoading(false);
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const handleApprove = async (reviewId: string) => {
        setActionLoading(reviewId);
        await reviewsService.approve(reviewId);
        await loadReviews();
        setActionLoading(null);
    };

    const handleReject = async (reviewId: string) => {
        setActionLoading(reviewId);
        await reviewsService.reject(reviewId);
        await loadReviews();
        setActionLoading(null);
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Supprimer cet avis définitivement ?")) return;
        setActionLoading(reviewId);
        await reviewsService.delete(reviewId);
        await loadReviews();
        setActionLoading(null);
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'approved') return r.is_approved;
        if (filter === 'pending') return !r.is_approved;
        return true;
    });

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    size={16}
                    className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
                />
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    <MessageSquare className="inline-block mr-3 text-purple-500" size={32} />
                    Gestion des Avis
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Modérez les avis utilisateurs de la landing page
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Avis</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                            <MessageSquare className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Approuvés</p>
                            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                            <ThumbsUp className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
                            <p className="text-3xl font-bold text-orange-500">{stats.pending}</p>
                        </div>
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                            <Clock className="text-orange-500 dark:text-orange-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Note moyenne</p>
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold text-yellow-500">{stats.avgRating}</p>
                                <Star className="text-yellow-400 fill-yellow-400" size={24} />
                            </div>
                        </div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
                            <Star className="text-yellow-500 dark:text-yellow-400" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        Tous ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        En attente ({stats.pending})
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'approved'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        Approuvés ({stats.approved})
                    </button>
                </div>

                <button
                    onClick={loadReviews}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucun avis {filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvé' : ''}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredReviews.map(review => (
                        <div
                            key={review.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border transition-all ${review.is_approved
                                    ? 'border-green-200 dark:border-green-800'
                                    : 'border-orange-200 dark:border-orange-800'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                                            {review.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{review.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {renderStars(review.rating)}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${review.is_approved
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {review.is_approved ? '✓ Approuvé' : '⏳ En attente'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                                        "{review.comment}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 md:flex-col">
                                    {!review.is_approved ? (
                                        <button
                                            onClick={() => handleApprove(review.id)}
                                            disabled={actionLoading === review.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === review.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle size={18} />
                                            )}
                                            <span>Approuver</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReject(review.id)}
                                            disabled={actionLoading === review.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === review.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <XCircle size={18} />
                                            )}
                                            <span>Retirer</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(review.id)}
                                        disabled={actionLoading === review.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={18} />
                                        <span>Supprimer</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
