'use client';

import { useEffect, useState } from 'react';
import { adminAuthService, AdminUser, AdminRole, ROLE_LABELS } from '../../lib/supabase';

interface AdminUserRow {
    id: string;
    email: string;
    role: AdminRole;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'analyst' as AdminRole,
    });
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        const { users: data } = await adminAuthService.getAdminUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async () => {
        setError('');
        if (!formData.email || !formData.password || !formData.first_name) {
            setError('Tous les champs sont requis');
            return;
        }

        const { error: createError } = await adminAuthService.createAdminUser(formData);
        if (createError) {
            setError(createError.message || 'Erreur de création');
            return;
        }

        setShowModal(false);
        setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'analyst' });
        fetchUsers();
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        await adminAuthService.toggleAdminActive(userId, !currentActive);
        fetchUsers();
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Supprimer cet administrateur ?')) return;
        await adminAuthService.deleteAdminUser(userId);
        fetchUsers();
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24,
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>🔐 Gestion des Admins</h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        {users.length} administrateurs
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14
                    }}
                >
                    ➕ Nouvel Admin
                </button>
            </div>

            {/* Role Legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <span key={role} style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12
                    }}>
                        {label}
                    </span>
                ))}
            </div>

            {/* Users List */}
            <div style={cardStyle}>
                {loading ? (
                    <p style={{ color: '#94a3b8' }}>Chargement...</p>
                ) : users.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>Aucun administrateur</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Nom</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Rôle</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Statut</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Dernière connexion</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td style={{ padding: '16px 8px', color: '#94a3b8' }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '16px 8px' }}>
                                        <span style={{
                                            background: user.role === 'super_admin' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.1)',
                                            color: user.role === 'super_admin' ? '#f97316' : '#94a3b8',
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            fontSize: 12
                                        }}>
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                        {user.is_active ? (
                                            <span style={{ color: '#22c55e' }}>✓ Actif</span>
                                        ) : (
                                            <span style={{ color: '#dc2626' }}>✗ Inactif</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                                        {user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais'}
                                    </td>
                                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                                style={{
                                                    background: user.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                    color: user.is_active ? '#fca5a5' : '#86efac',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    fontSize: 12
                                                }}
                                            >
                                                {user.is_active ? 'Désactiver' : 'Activer'}
                                            </button>
                                            {user.role !== 'super_admin' && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        color: '#fca5a5',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 12
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b',
                        padding: 32,
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 450
                    }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>➕ Nouvel Administrateur</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <input
                                type="text"
                                placeholder="Prénom"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                placeholder="Nom"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                style={inputStyle}
                            />
                        </div>

                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ ...inputStyle, marginBottom: 16 }}
                        />

                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ ...inputStyle, marginBottom: 16 }}
                        />

                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                            style={{ ...inputStyle, marginBottom: 20 }}
                        >
                            <option value="analyst">📊 Analyste</option>
                            <option value="support_client">💬 Support Client</option>
                            <option value="controller_passengers">👥 Contrôleur Passagers</option>
                            <option value="manager_wallets">💳 Gestionnaire Wallets</option>
                            <option value="supervisor_drivers">👨‍✈️ Superviseur Chauffeurs</option>
                            <option value="super_admin">👑 Super Admin</option>
                        </select>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                padding: '12px',
                                borderRadius: 10,
                                color: '#fca5a5',
                                marginBottom: 20,
                                fontSize: 13
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: '#475569',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreate}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: '#22c55e',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
};
