'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthService } from '../../lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { user, error: loginError } = await adminAuthService.login(email, password);

        if (loginError || !user) {
            setError(loginError || 'Erreur de connexion');
            setLoading(false);
            return;
        }

        router.push('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 48,
                width: '100%',
                maxWidth: 420
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
                    <h1 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 700 }}>
                        TransiGo Admin
                    </h1>
                    <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: 14 }}>
                        Connectez-vous pour accéder au dashboard
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@transigo.ci"
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontSize: 16,
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontSize: 16,
                                outline: 'none'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            padding: '12px 16px',
                            borderRadius: 10,
                            color: '#fca5a5',
                            fontSize: 14,
                            marginBottom: 20
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: 10,
                            border: 'none',
                            background: loading ? '#475569' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                {/* Demo info */}
                <div style={{
                    marginTop: 32,
                    padding: 16,
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 10,
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                        💡 <strong style={{ color: '#fff' }}>Compte démo:</strong><br />
                        Email: admin@transigo.ci<br />
                        Mot de passe: admin123
                    </p>
                </div>
            </div>
        </div>
    );
}
