"use client";

import { useState, useEffect } from "react";
// import QRCode from "react-qr-code"; // Failed install, using API instead
import { Download, Smartphone, CheckCircle, Shield, TrendingUp, ChevronRight } from "lucide-react";

export default function DownloadPage() {
    const [mounted, setMounted] = useState(false);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setMounted(true);
        setOrigin(window.location.origin);
    }, []);

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
                    <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md border border-white/10">Bêta v1.1</div>
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
                            href="/apks/transigo-passenger-v1-4.apk"
                            download="TransiGo-Passenger-v1-4.apk"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40"
                        >
                            <Download size={24} />
                            <span>Télécharger APK (Bêta)</span>
                        </a>
                        <p className="text-center text-sm text-gray-500 mt-4">Version 1.4.0 • Android 8+</p>
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
                            href="/apks/transigo-business-v1-3.apk"
                            download="TransiGo-Business-v1-3.apk"
                            className="w-full bg-gradient-to-r from-[#00C853] to-[#009624] hover:from-[#00E676] hover:to-[#00C853] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20 group-hover:shadow-green-600/40"
                        >
                            <Download size={24} />
                            <span>Télécharger APK (Bêta)</span>
                        </a>
                        <p className="text-center text-sm text-gray-500 mt-4">Version 1.3.0 • Android 8+</p>
                    </div>

                </div>

                {/* QR Code Section */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
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
                    <p className="text-gray-500 text-center max-w-xs mb-6">
                        Scannez ce QR code pour ouvrir cette page sur un autre appareil.
                    </p>

                </div>

                {/* Footer */}
                <footer className="mt-20 text-center text-gray-600 text-sm">
                    <p>© 2026 TransiGo Inc. Tous droits réservés.</p>
                    <p className="mt-2">Fait avec 💚 pour l'Afrique</p>
                </footer>

            </main>
        </div>
    );
}
