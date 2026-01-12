"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, CheckCircle, Shield, TrendingUp, Star, Send, MessageSquare, User } from "lucide-react";

interface Review {
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

export default function DownloadPage() {
    const [mounted, setMounted] = useState(false);
    const [origin, setOrigin] = useState("");

    // Reviews state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewName, setReviewName] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
        setOrigin(window.location.origin);

        // Load reviews from localStorage
        const savedReviews = localStorage.getItem('transigo_reviews');
        if (savedReviews) {
            setReviews(JSON.parse(savedReviews));
        } else {
            // Default reviews for display
            const defaultReviews: Review[] = [
                {
                    id: '1',
                    name: 'Kofi A.',
                    rating: 5,
                    comment: "Excellente application ! Les courses sont rapides et les chauffeurs très professionnels.",
                    date: '2026-01-10'
                },
                {
                    id: '2',
                    name: 'Aminata D.',
                    rating: 4,
                    comment: "Très pratique pour mes déplacements quotidiens. J'apprécie le suivi en temps réel.",
                    date: '2026-01-09'
                },
                {
                    id: '3',
                    name: 'Yao K.',
                    rating: 5,
                    comment: "En tant que chauffeur, l'application Business est vraiment intuitive. Les revenus sont transparents.",
                    date: '2026-01-08'
                }
            ];
            setReviews(defaultReviews);
            localStorage.setItem('transigo_reviews', JSON.stringify(defaultReviews));
        }
    }, []);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reviewName.trim() || !reviewComment.trim() || reviewRating === 0) {
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newReview: Review = {
            id: Date.now().toString(),
            name: reviewName.trim(),
            rating: reviewRating,
            comment: reviewComment.trim(),
            date: new Date().toISOString().split('T')[0]
        };

        const updatedReviews = [newReview, ...reviews];
        setReviews(updatedReviews);
        localStorage.setItem('transigo_reviews', JSON.stringify(updatedReviews));

        // Reset form
        setReviewName("");
        setReviewRating(0);
        setReviewComment("");
        setIsSubmitting(false);
        setSubmitSuccess(true);

        setTimeout(() => setSubmitSuccess(false), 3000);
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    if (!mounted) return null;

    const downloadUrl = `${origin}/download`;

    return (
        <div className="min-h-screen bg-[#1A1A2E] text-white overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#00C853] blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#FF8C00] blur-[150px]" />
            </div>

            <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
                {/* Helper Nav */}
                <nav className="absolute top-0 w-full flex justify-between items-center py-6 px-4">
                    <div className="flex items-center gap-6">
                        <div className="bg-[#F5F5DC] p-1 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                            <img src="/logo.png" alt="TransiGo Logo" className="w-24 h-24 object-contain" />
                        </div>
                        <div className="text-4xl font-bold tracking-tighter shadow-black drop-shadow-lg">Transi<span className="text-[#00C853]">Go</span></div>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md border border-white/10">Bêta v2.0</div>
                </nav>

                {/* HERO SECTION */}
                <header className="mt-24 md:mt-32 mb-20 md:mb-32 text-center animate-fade-in-down max-w-4xl mx-auto w-full">
                    <div className="inline-block px-4 py-1 bg-[#00C853]/20 text-[#00C853] rounded-full text-sm font-bold mb-6 border border-[#00C853]/30">
                        🚀 Le futur du VTC en Afrique
                    </div>
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                        Déplacez-vous <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">librement</span>. <br />
                        Gagnez <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C853] to-[#00E676]">simplement</span>.
                    </h1>
                    <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed px-4">
                        TransiGo révolutionne le transport urbain avec une plateforme sécurisée, rapide et équitable pour chauffeurs et passagers.
                    </p>
                    <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center items-center px-4 w-full">
                        <button onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })} className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
                            Obtenir l'App
                        </button>
                    </div>
                </header>

                {/* FEATURES GRID */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-32">
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Sécurité Maximale</h3>
                        <p className="text-gray-400 leading-relaxed">Toutes les courses sont suivies en temps réel. Identité des chauffeurs vérifiée. Bouton SOS intégré.</p>
                    </div>
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="bg-orange-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-orange-400">
                            <Smartphone size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Simplicité Absolue</h3>
                        <p className="text-gray-400 leading-relaxed">Une interface intuitive pour commander en 2 clics. Paiement par Mobile Money ou espèces.</p>
                    </div>
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="bg-green-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-400">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Revenus Justes</h3>
                        <p className="text-gray-400 leading-relaxed">Commission la plus basse du marché pour les chauffeurs. Tarifs transparents pour les passagers.</p>
                    </div>
                </section>

                {/* DOWNLOAD SECTION TITLE */}
                <div id="download" className="mb-16 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Télécharger la Bêta</h2>
                    <p className="text-gray-400">Choisissez l'application qui vous correspond</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-24">

                    {/* Passenger Card */}
                    <div className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(41,98,255,0.2)]">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Smartphone size={120} />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-600/20 p-3 rounded-2xl">
                                <Shield className="text-blue-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-bold">Passenger</h2>
                        </div>

                        <ul className="space-y-4 mb-8 text-gray-300">
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-blue-500" />
                                <span>Commandez une course en 1 clic</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-blue-500" />
                                <span>Sécurité et traçabilité temps réel</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-blue-500" />
                                <span>Paiements mobiles intégrés</span>
                            </li>
                        </ul>

                        <a
                            href="/apks/transigo-passenger.apk"
                            download="TransiGo-Passenger.apk"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40"
                        >
                            <Download size={24} />
                            <span>Télécharger APK (Bêta)</span>
                        </a>
                        <p className="text-center text-sm text-gray-500 mt-4">Version 2.1.0 • Janvier 2026</p>
                    </div>

                    {/* Business Card */}
                    <div className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,200,83,0.2)]">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={120} />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#00C853]/20 p-3 rounded-2xl">
                                <TrendingUp className="text-[#00C853]" size={32} />
                            </div>
                            <h2 className="text-3xl font-bold">Business</h2>
                        </div>

                        <ul className="space-y-4 mb-8 text-gray-300">
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-[#00C853]" />
                                <span>Pour Chauffeurs, Livreurs & Vendeurs</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-[#00C853]" />
                                <span>Tableau de bord de revenus</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-[#00C853]" />
                                <span>Gestion des commandes temps réel</span>
                            </li>
                        </ul>

                        <a
                            href="/apks/transigo-business.apk"
                            download="TransiGo-Business.apk"
                            className="w-full bg-gradient-to-r from-[#00C853] to-[#009624] hover:from-[#00E676] hover:to-[#00C853] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20 group-hover:shadow-green-600/40"
                        >
                            <Download size={24} />
                            <span>Télécharger APK (Bêta)</span>
                        </a>
                        <p className="text-center text-sm text-gray-500 mt-4">Version 2.1.0 • Janvier 2026</p>
                    </div>

                </div>

                {/* QR Code Section */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center mb-24">
                    <div className="bg-gray-100 p-4 rounded-2xl mb-6">
                        {mounted && (
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadUrl)}&bgcolor=ffffff`}
                                alt="QR Code de téléchargement"
                                className="w-full h-auto max-w-[200px]"
                            />
                        )}
                    </div>
                    <h3 className="text-black text-xl font-bold mb-2">Partagez l'expérience</h3>
                    <p className="text-gray-500 text-center max-w-xs">
                        Scannez ce QR code pour ouvrir cette page sur un autre appareil.
                    </p>
                </div>

                {/* REVIEWS SECTION */}
                <section id="reviews" className="w-full max-w-6xl mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Avis des Utilisateurs</h2>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={24}
                                        className={star <= Math.round(parseFloat(averageRating)) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
                                    />
                                ))}
                            </div>
                            <span className="text-2xl font-bold text-yellow-400">{averageRating}</span>
                            <span className="text-gray-400">({reviews.length} avis)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Review Form */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-purple-500/20 p-3 rounded-2xl">
                                    <MessageSquare className="text-purple-400" size={28} />
                                </div>
                                <h3 className="text-2xl font-bold">Donnez votre avis</h3>
                            </div>

                            {submitSuccess && (
                                <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                                    <CheckCircle size={20} />
                                    <span>Merci pour votre avis !</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                {/* Name Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <User size={16} className="inline mr-2" />
                                        Votre nom *
                                    </label>
                                    <input
                                        type="text"
                                        value={reviewName}
                                        onChange={(e) => setReviewName(e.target.value)}
                                        placeholder="Ex: Jean D."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                        required
                                    />
                                </div>

                                {/* Rating Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <Star size={16} className="inline mr-2" />
                                        Note *
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={32}
                                                    className={
                                                        star <= (hoverRating || reviewRating)
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-gray-600 hover:text-yellow-400"
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {reviewRating === 0 && (
                                        <p className="text-sm text-gray-500 mt-1">Cliquez sur une étoile pour noter</p>
                                    )}
                                </div>

                                {/* Comment Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <MessageSquare size={16} className="inline mr-2" />
                                        Commentaire *
                                    </label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Partagez votre expérience avec TransiGo..."
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reviewName.trim() || !reviewComment.trim() || reviewRating === 0}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            <span>Envoyer mon avis</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                                                {review.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{review.name}</p>
                                                <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={16}
                                                    className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-20 text-center text-gray-600 text-sm">
                    <p>© 2026 TransiGo Inc. Tous droits réservés.</p>
                    <p className="mt-2">Fait avec 💚 pour l'Afrique</p>
                </footer>

            </main>
        </div>
    );
}

