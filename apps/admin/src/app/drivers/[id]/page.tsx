'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

interface Driver {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    is_online: boolean;
    is_blocked: boolean;
    is_verified: boolean;
    wallet_balance: number;
    rating: number;
    total_rides: number;
    created_at: string;
    gender?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate?: string;
    vehicle_color?: string;
    vehicle_type?: string;
    license_front_url?: string;
    license_back_url?: string;
    registration_card_url?: string;
    insurance_url?: string;
    id_card_url?: string;
}

export default function DriverDetailPage() {
    const params = useParams();
    const router = useRouter();
    const driverId = params.id as string;

    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchDriver();
    }, [driverId]);

    const fetchDriver = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single();

        if (error) {
            setError(error.message);
        } else {
            setDriver(data);
        }
        setLoading(false);
    };

    const handleVerify = async () => {
        if (!confirm('Valider ce chauffeur ? Il pourra alors utiliser l\'application.')) return;

        setActionLoading(true);
        const { error } = await supabase
            .from('drivers')
            .update({ is_verified: true })
            .eq('id', driverId);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            alert('Chauffeur validé avec succès !');
            fetchDriver();
        }
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!confirm('Rejeter ce chauffeur ? Son compte sera bloqué.')) return;

        setActionLoading(true);
        const { error } = await supabase
            .from('drivers')
            .update({ is_blocked: true, is_verified: false })
            .eq('id', driverId);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            alert('Chauffeur rejeté.');
            fetchDriver();
        }
        setActionLoading(false);
    };

    const openWhatsApp = () => {
        if (!driver) return;
        const phone = driver.phone.replace(/\+/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        marginBottom: 16,
    };

    const buttonStyle = {
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
    };

    if (loading) {
        return (
            <div style={{ padding: 32, color: '#fff', textAlign: 'center' }}>
                Chargement...
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div style={{ padding: 32, color: '#fff', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>Erreur: {error || 'Chauffeur non trouvé'}</p>
                <Link href="/drivers" style={{ color: '#3b82f6' }}>← Retour</Link>
            </div>
        );
    }

    const documents = [
        { key: 'license_front_url', label: 'Permis (Recto)', url: driver.license_front_url },
        { key: 'license_back_url', label: 'Permis (Verso)', url: driver.license_back_url },
        { key: 'registration_card_url', label: 'Carte Grise', url: driver.registration_card_url },
        { key: 'insurance_url', label: 'Assurance', url: driver.insurance_url },
        { key: 'id_card_url', label: 'CNI / Photo ID', url: driver.id_card_url },
    ];

    const hasDocuments = documents.some(d => d.url);

    return (
        <div style={{ padding: 32, color: '#fff', maxWidth: 1000, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <Link href="/drivers" style={{ color: '#94a3b8', fontSize: 24, textDecoration: 'none' }}>←</Link>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
                        {driver.first_name} {driver.last_name}
                        {driver.gender === 'female' && <span title="Femme"> 👩</span>}
                    </h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        Inscrit le {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {driver.is_verified ? (
                        <span style={{ background: '#22c55e', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                            ✅ Validé
                        </span>
                    ) : (
                        <span style={{ background: '#f59e0b', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                            ⏳ En attente
                        </span>
                    )}
                    {driver.is_blocked && (
                        <span style={{ background: '#ef4444', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                            🚫 Bloqué
                        </span>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Contact */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#94a3b8' }}>📞 Contact</h3>
                    <p style={{ margin: '8px 0' }}><strong>Téléphone:</strong> {driver.phone}</p>
                    <p style={{ margin: '8px 0' }}><strong>Email:</strong> {driver.email || 'Non renseigné'}</p>
                </div>

                {/* Vehicle */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#94a3b8' }}>🚗 Véhicule</h3>
                    {driver.vehicle_plate && driver.vehicle_plate !== 'PENDING' ? (
                        <>
                            <p style={{ margin: '8px 0' }}><strong>Marque:</strong> {driver.vehicle_brand || '-'}</p>
                            <p style={{ margin: '8px 0' }}><strong>Modèle:</strong> {driver.vehicle_model || '-'}</p>
                            <p style={{ margin: '8px 0' }}><strong>Année:</strong> {driver.vehicle_year || '-'}</p>
                            <p style={{ margin: '8px 0' }}><strong>Plaque:</strong> {driver.vehicle_plate}</p>
                            <p style={{ margin: '8px 0' }}><strong>Couleur:</strong> {driver.vehicle_color || '-'}</p>
                            <p style={{ margin: '8px 0' }}><strong>Type:</strong> {driver.vehicle_type || 'standard'}</p>
                        </>
                    ) : (
                        <p style={{ color: '#f59e0b' }}>⚠️ Véhicule non renseigné</p>
                    )}
                </div>

                {/* Stats */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#94a3b8' }}>📊 Statistiques</h3>
                    <p style={{ margin: '8px 0' }}><strong>Note:</strong> ⭐ {driver.rating?.toFixed(1) || '5.0'}</p>
                    <p style={{ margin: '8px 0' }}><strong>Courses:</strong> {driver.total_rides || 0}</p>
                    <p style={{ margin: '8px 0' }}><strong>Wallet:</strong> <span style={{ color: '#22c55e' }}>{driver.wallet_balance?.toLocaleString() || 0} F</span></p>
                    <p style={{ margin: '8px 0' }}><strong>En ligne:</strong> {driver.is_online ? '🟢 Oui' : '⚪ Non'}</p>
                </div>
            </div>

            {/* Documents */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📄 Documents Soumis</h3>
                {hasDocuments ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        {documents.map(doc => (
                            <div key={doc.key} style={{ textAlign: 'center' }}>
                                {doc.url ? (
                                    <>
                                        <div
                                            style={{
                                                width: '100%',
                                                aspectRatio: '4/3',
                                                background: '#1e293b',
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                marginBottom: 8
                                            }}
                                            onClick={() => setSelectedImage(doc.url || null)}
                                        >
                                            <img
                                                src={doc.url}
                                                alt={doc.label}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="50%" x="50%" text-anchor="middle" fill="gray">Erreur</text></svg>'; }}
                                            />
                                        </div>
                                        <p style={{ fontSize: 12, color: '#22c55e' }}>✅ {doc.label}</p>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                width: '100%',
                                                aspectRatio: '4/3',
                                                background: '#374151',
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6b7280',
                                                fontSize: 24,
                                                marginBottom: 8
                                            }}
                                        >
                                            ❌
                                        </div>
                                        <p style={{ fontSize: 12, color: '#6b7280' }}>❌ {doc.label}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#f59e0b', textAlign: 'center', padding: 20 }}>
                        ⚠️ Aucun document soumis pour le moment.
                    </p>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
                {!driver.is_verified && (
                    <button
                        onClick={handleVerify}
                        disabled={actionLoading}
                        style={{ ...buttonStyle, background: '#22c55e', color: '#fff' }}
                    >
                        ✅ Valider le Chauffeur
                    </button>
                )}
                {!driver.is_blocked && (
                    <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        style={{ ...buttonStyle, background: '#ef4444', color: '#fff' }}
                    >
                        ❌ Rejeter / Bloquer
                    </button>
                )}
                <button
                    onClick={openWhatsApp}
                    style={{ ...buttonStyle, background: '#25D366', color: '#fff' }}
                >
                    💬 Contacter WhatsApp
                </button>
                <Link
                    href="/drivers"
                    style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', display: 'inline-block' }}
                >
                    ← Retour à la liste
                </Link>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Document"
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }}
                    />
                    <button
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: '#fff',
                            fontSize: 24,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            {/* DEBUG DUMP - REMOVE LATER */}
            <div style={{ marginTop: 50, padding: 20, background: '#000', color: '#0f0', borderRadius: 8 }}>
                <h3>🔍 DEBUG DATA (Données Brutes)</h3>
                <pre style={{ overflow: 'auto' }}>
                    {JSON.stringify(driver, null, 2)}
                </pre>
            </div>
        </div>
    );
}
