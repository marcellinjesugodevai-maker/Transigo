'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminAuthService, AdminUser, PAGE_PERMISSIONS, ROLE_LABELS } from '../lib/supabase';

const allNavItems = [
    { href: '/', icon: '📊', label: 'Dashboard' },
    { href: '/drivers', icon: '👨‍✈️', label: 'Chauffeurs' },
    { href: '/deliveries', icon: '🛵', label: 'Livreurs' },
    { href: '/rides', icon: '🚗', label: 'Courses' },
    { href: '/users', icon: '👥', label: 'Passagers' },
    { href: '/wallets', icon: '💳', label: 'Wallets' },
    { href: '/transactions', icon: '📜', label: 'Transactions' },
    { href: '/tickets', icon: '📩', label: 'Tickets' },
    { href: '/chat', icon: '💬', label: 'Chat Support' },
    { href: '/faq', icon: '❓', label: 'FAQ' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
    { href: '/admin-users', icon: '🔐', label: 'Admins' },
    { href: '/settings', icon: '⚙️', label: 'Paramètres' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = adminAuthService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);

        // Redirect to login if not authenticated (except on login and download page)
        if (!currentUser && pathname !== '/login' && pathname !== '/download') {
            router.push('/login');
        }

        // Check page access
        if (currentUser && pathname !== '/login' && pathname !== '/download') {
            if (!adminAuthService.canAccessPage(pathname, currentUser.role)) {
                router.push('/');
            }
        }
    }, [pathname, router]);

    const handleLogout = () => {
        adminAuthService.logout();
        router.push('/login');
    };

    // Feature: Define public pages (no sidebar, no auth check)
    const isPublicPage = pathname === '/login' || pathname === '/download';

    // Don't show layout loading for public pages to ensure fast TTI
    if (loading && !isPublicPage) {
        return (
            <html lang="fr" suppressHydrationWarning={true}>
                <body style={{ margin: 0, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <p>Chargement...</p>
                </body>
            </html>
        );
    }

    // Filter nav items based on user role
    const navItems = user ? allNavItems.filter(item =>
        adminAuthService.canAccessPage(item.href, user.role)
    ) : [];

    return (
        <html lang="fr" suppressHydrationWarning={true}>
            <head>
                <link rel="icon" href="/logo.png" />
            </head>
            <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', flexDirection: isPublicPage ? 'column' : 'row' }}>
                {/* Sidebar */}
                {!isPublicPage && (
                    <aside style={{
                        width: 240,
                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                        color: '#fff',
                        padding: '24px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        overflowY: 'auto'
                    }}>
                        {/* Logo */}
                        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                                🚗 TransiGo
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                                Administration
                            </p>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div style={{
                                padding: '16px 24px',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                    {user.first_name} {user.last_name}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                    {ROLE_LABELS[user.role]}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav style={{ flex: 1, padding: '16px 0' }}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 24px',
                                        color: pathname === item.href ? '#fff' : '#94a3b8',
                                        textDecoration: 'none',
                                        fontSize: 14,
                                        background: pathname === item.href ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                                        borderLeft: pathname === item.href ? '3px solid #f97316' : '3px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Logout */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#fca5a5',
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                🚪 Déconnexion
                            </button>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '8px 24px', fontSize: 11, color: '#475569' }}>
                            TransiGo Admin v1.0
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    marginLeft: isPublicPage ? 0 : 240,
                    background: isPublicPage ? 'transparent' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    minHeight: '100vh',
                    width: isPublicPage ? '100%' : 'auto'
                }}>
                    {children}
                </main>
            </body>
        </html>
    );
}
