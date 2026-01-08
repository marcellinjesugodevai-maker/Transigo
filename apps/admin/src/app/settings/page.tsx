'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface AppSettings {
    id: string;
    key: string;
    value: string;
    updated_at: string;
}

export default function SettingsPage() {
    // TTS Settings
    const [ttsTextDelivery, setTtsTextDelivery] = useState('Nouvelle livraison disponible!');
    const [ttsTextRide, setTtsTextRide] = useState('Nouvelle course disponible!');
    const [ttsLanguage, setTtsLanguage] = useState('fr-FR');
    const [ttsPitch, setTtsPitch] = useState('1.1');
    const [ttsRate, setTtsRate] = useState('1.0');

    // Sound file URL (for future use)
    const [soundFileUrl, setSoundFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // General state
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*');

        if (data) {
            data.forEach((setting: AppSettings) => {
                switch (setting.key) {
                    case 'tts_text_delivery':
                        setTtsTextDelivery(setting.value);
                        break;
                    case 'tts_text_ride':
                        setTtsTextRide(setting.value);
                        break;
                    case 'tts_language':
                        setTtsLanguage(setting.value);
                        break;
                    case 'tts_pitch':
                        setTtsPitch(setting.value);
                        break;
                    case 'tts_rate':
                        setTtsRate(setting.value);
                        break;
                    case 'sound_file_url':
                        setSoundFileUrl(setting.value);
                        break;
                }
            });
        }
    };

    const saveSetting = async (key: string, value: string) => {
        const { error } = await supabase
            .from('app_settings')
            .upsert(
                { key, value, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
            );
        return !error;
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage('');

        const results = await Promise.all([
            saveSetting('tts_text_delivery', ttsTextDelivery),
            saveSetting('tts_text_ride', ttsTextRide),
            saveSetting('tts_language', ttsLanguage),
            saveSetting('tts_pitch', ttsPitch),
            saveSetting('tts_rate', ttsRate),
        ]);

        setSaving(false);

        if (results.every(r => r)) {
            setMessage('success');
        } else {
            setMessage('error');
        }

        setTimeout(() => setMessage(''), 3000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('audio')) {
            setMessage('error_audio');
            return;
        }

        setUploading(true);
        setMessage('');

        const fileName = `alerts/order_alert_${Date.now()}.mp3`;
        const { data, error } = await supabase.storage
            .from('assets')
            .upload(fileName, file, { upsert: true });

        if (error) {
            setMessage('error_upload');
            setUploading(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        setSoundFileUrl(publicUrl);
        await saveSetting('sound_file_url', publicUrl);

        setMessage('success_upload');
        setUploading(false);
    };

    const testTTS = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(ttsTextDelivery);
            utterance.lang = ttsLanguage;
            utterance.pitch = parseFloat(ttsPitch);
            utterance.rate = parseFloat(ttsRate);
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Synthèse vocale non supportée par ce navigateur');
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            padding: '24px',
            maxWidth: '900px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#1e293b',
        },
        subtitle: {
            color: '#64748b',
            marginBottom: '24px',
        },
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
        },
        cardTitle: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1e293b',
        },
        cardDesc: {
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '20px',
        },
        formGroup: {
            marginBottom: '16px',
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px',
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e293b',
            backgroundColor: '#ffffff',
        },
        select: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e293b',
            backgroundColor: '#ffffff',
        },
        row: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
        },
        row3: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
        },
        button: {
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s',
        },
        btnPrimary: {
            backgroundColor: '#10b981',
            color: '#ffffff',
        },
        btnSecondary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
        },
        btnPurple: {
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
        },
        alert: {
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
        },
        alertSuccess: {
            backgroundColor: '#d1fae5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
        },
        alertError: {
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
        },
        warning: {
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
        },
        sqlBlock: {
            backgroundColor: '#1e293b',
            color: '#22c55e',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'monospace',
            overflowX: 'auto' as const,
            whiteSpace: 'pre-wrap' as const,
        },
        sliderContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        sliderValue: {
            minWidth: '40px',
            textAlign: 'center' as const,
            fontWeight: '600',
            color: '#3b82f6',
        },
        audioPreview: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
        },
    };

    const sqlCode = `CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access" ON app_settings FOR SELECT USING (true);

-- Allow all access for admins
CREATE POLICY "Allow admin access" ON app_settings FOR ALL USING (true);`;

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>⚙️ Paramètres de l'Application</h1>
            <p style={styles.subtitle}>Configurez les alertes sonores et vocales pour les chauffeurs et livreurs.</p>

            {message === 'success' && (
                <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                    ✅ Paramètres sauvegardés avec succès!
                </div>
            )}
            {message === 'error' && (
                <div style={{ ...styles.alert, ...styles.alertError }}>
                    ❌ Erreur lors de la sauvegarde. Vérifiez que la table app_settings existe.
                </div>
            )}
            {message === 'success_upload' && (
                <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                    ✅ Fichier audio uploadé avec succès!
                </div>
            )}

            {/* TTS Settings Section */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>🎤 Alertes Vocales (Text-to-Speech)</h2>
                <p style={styles.cardDesc}>
                    Configurez le message vocal que les chauffeurs entendront lors d'une nouvelle demande.
                </p>

                <div style={styles.row}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Message pour livraisons</label>
                        <input
                            type="text"
                            value={ttsTextDelivery}
                            onChange={(e) => setTtsTextDelivery(e.target.value)}
                            style={styles.input}
                            placeholder="Nouvelle livraison disponible!"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Message pour courses VTC</label>
                        <input
                            type="text"
                            value={ttsTextRide}
                            onChange={(e) => setTtsTextRide(e.target.value)}
                            style={styles.input}
                            placeholder="Nouvelle course disponible!"
                        />
                    </div>
                </div>

                <div style={styles.row3}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Langue</label>
                        <select
                            value={ttsLanguage}
                            onChange={(e) => setTtsLanguage(e.target.value)}
                            style={styles.select}
                        >
                            <option value="fr-FR">Français (France)</option>
                            <option value="fr-CA">Français (Canada)</option>
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tonalité</label>
                        <div style={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={ttsPitch}
                                onChange={(e) => setTtsPitch(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <span style={styles.sliderValue}>{ttsPitch}</span>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Vitesse</label>
                        <div style={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={ttsRate}
                                onChange={(e) => setTtsRate(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <span style={styles.sliderValue}>{ttsRate}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={testTTS}
                    style={{ ...styles.button, ...styles.btnSecondary }}
                >
                    🔊 Tester la voix
                </button>
            </div>

            {/* Sound Upload Section */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>🎵 Fichier Audio Personnalisé</h2>
                <p style={styles.cardDesc}>
                    Uploadez un fichier audio (MP3) qui sera joué lors des nouvelles demandes.
                </p>

                <div style={styles.warning}>
                    ⚠️ Cette fonctionnalité nécessite expo-av dans l'app mobile (actuellement en cours d'activation).
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    style={{ display: 'none' }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        ...styles.button,
                        ...styles.btnPurple,
                        opacity: uploading ? 0.6 : 1,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {uploading ? '⏳ Upload en cours...' : '📁 Uploader un fichier audio'}
                </button>

                {soundFileUrl && (
                    <div style={styles.audioPreview}>
                        <span>✅ Fichier actuel:</span>
                        <audio controls src={soundFileUrl} style={{ height: '40px' }} />
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    style={{
                        ...styles.button,
                        ...styles.btnPrimary,
                        padding: '16px 32px',
                        fontSize: '16px',
                        opacity: saving ? 0.6 : 1,
                    }}
                >
                    {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder tous les paramètres'}
                </button>
            </div>

            {/* SQL Helper */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>📋 SQL pour créer la table</h2>
                <p style={styles.cardDesc}>
                    Copiez ce SQL dans Supabase SQL Editor si la table n'existe pas encore.
                </p>
                <pre style={styles.sqlBlock}>{sqlCode}</pre>
            </div>
        </div>
    );
}
