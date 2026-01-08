'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface User {
    id: string;
    phone: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        setUsers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24,
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>👥 Passagers</h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        {users.length} passagers inscrits
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    🔄 Rafraîchir
                </button>
            </div>

            {/* Table */}
            <div style={cardStyle}>
                {loading ? (
                    <p style={{ color: '#94a3b8' }}>Chargement...</p>
                ) : users.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>Aucun passager inscrit</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Nom</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Téléphone</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Email</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8', fontWeight: 500, fontSize: 13 }}>Inscription</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td style={{ padding: '16px 8px' }}>
                                        {user.phone}
                                    </td>
                                    <td style={{ padding: '16px 8px', color: '#94a3b8' }}>
                                        {user.email || '-'}
                                    </td>
                                    <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
