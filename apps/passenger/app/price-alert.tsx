// =============================================
// TRANSIGO - ALERTE PRIX BAS
// Notifications quand le prix baisse sur vos trajets
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

// Alertes actives simulées
const INITIAL_ALERTS = [
    {
        id: 'a1',
        from: 'Cocody Riviera',
        to: 'Aéroport FHB',
        targetPrice: 4000,
        currentPrice: 4500,
        enabled: true,
        triggered: false,
    },
    {
        id: 'a2',
        from: 'Plateau',
        to: 'Zone 4 Marcory',
        targetPrice: 2500,
        currentPrice: 2200,
        enabled: true,
        triggered: true,
    },
];

// Historique des alertes déclenchées
const ALERT_HISTORY = [
    { id: 'h1', route: 'Cocody → Plateau', price: 2500, savedPrice: 3200, date: 'Hier, 14:30', saved: 700 },
    { id: 'h2', route: 'Yopougon → Aéroport', price: 3800, savedPrice: 4500, date: '2 Jan, 09:15', saved: 700 },
    { id: 'h3', route: 'Marcory → 2 Plateaux', price: 1800, savedPrice: 2300, date: '1 Jan, 18:00', saved: 500 },
];

export default function PriceAlertScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [alerts, setAlerts] = useState(INITIAL_ALERTS);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFrom, setNewFrom] = useState('');
    const [newTo, setNewTo] = useState('');
    const [newTargetPrice, setNewTargetPrice] = useState('');

    const toggleAlert = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    };

    const deleteAlert = (id: string) => {
        Alert.alert(
            language === 'fr' ? 'Supprimer l\'alerte ?' : 'Delete alert?',
            language === 'fr' ? 'Cette action est irréversible.' : 'This action cannot be undone.',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Supprimer' : 'Delete', style: 'destructive', onPress: () => {
                        setAlerts(alerts.filter(a => a.id !== id));
                    }
                },
            ]
        );
    };

    const addAlert = () => {
        if (!newFrom || !newTo || !newTargetPrice) {
            Alert.alert('❌', language === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill all fields.');
            return;
        }

        const newAlert = {
            id: `a${Date.now()}`,
            from: newFrom,
            to: newTo,
            targetPrice: parseInt(newTargetPrice),
            currentPrice: parseInt(newTargetPrice) + 500,
            enabled: true,
            triggered: false,
        };

        setAlerts([...alerts, newAlert]);
        setNewFrom('');
        setNewTo('');
        setNewTargetPrice('');
        setShowAddForm(false);

        Alert.alert(
            '✅',
            language === 'fr'
                ? 'Alerte créée ! Vous serez notifié quand le prix descend.'
                : 'Alert created! You\'ll be notified when the price drops.'
        );
    };

    const totalSaved = ALERT_HISTORY.reduce((sum, h) => sum + h.saved, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🔔 {language === 'fr' ? 'Alerte Prix Bas' : 'Low Price Alert'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Soyez averti quand le prix baisse' : 'Get notified when prices drop'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: '#4CAF5020' }]}>
                        <Text style={styles.statIcon}>💰</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                            {totalSaved.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Économisé' : 'Saved'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#2196F320' }]}>
                        <Text style={styles.statIcon}>🔔</Text>
                        <Text style={[styles.statValue, { color: '#2196F3' }]}>{alerts.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Alertes actives' : 'Active alerts'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#FF980020' }]}>
                        <Text style={styles.statIcon}>🎯</Text>
                        <Text style={[styles.statValue, { color: '#FF9800' }]}>
                            {alerts.filter(a => a.triggered).length}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix atteint' : 'Price reached'}
                        </Text>
                    </View>
                </View>

                {/* Alertes actives */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            📍 {language === 'fr' ? 'Mes alertes' : 'My alerts'}
                        </Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setShowAddForm(!showAddForm)}
                        >
                            <Icon name={showAddForm ? 'close' : 'add'} size={24} color="#2196F3" />
                        </TouchableOpacity>
                    </View>

                    {/* Formulaire ajout */}
                    {showAddForm && (
                        <View style={[styles.addForm, { backgroundColor: colors.card }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#252525' : '#F5F5F5', color: colors.text }]}
                                placeholder={language === 'fr' ? 'Départ (ex: Cocody)' : 'From (e.g. Cocody)'}
                                placeholderTextColor={colors.textSecondary}
                                value={newFrom}
                                onChangeText={setNewFrom}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#252525' : '#F5F5F5', color: colors.text }]}
                                placeholder={language === 'fr' ? 'Arrivée (ex: Plateau)' : 'To (e.g. Plateau)'}
                                placeholderTextColor={colors.textSecondary}
                                value={newTo}
                                onChangeText={setNewTo}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#252525' : '#F5F5F5', color: colors.text }]}
                                placeholder={language === 'fr' ? 'Prix cible (ex: 3000)' : 'Target price (e.g. 3000)'}
                                placeholderTextColor={colors.textSecondary}
                                value={newTargetPrice}
                                onChangeText={setNewTargetPrice}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity style={styles.confirmBtn} onPress={addAlert}>
                                <LinearGradient
                                    colors={['#4CAF50', '#388E3C']}
                                    style={styles.confirmGradient}
                                >
                                    <Text style={styles.confirmText}>
                                        ✅ {language === 'fr' ? 'Créer l\'alerte' : 'Create alert'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Liste des alertes */}
                    {alerts.map((alert) => (
                        <View key={alert.id} style={[styles.alertCard, { backgroundColor: colors.card }]}>
                            <View style={styles.alertRoute}>
                                <Text style={[styles.alertFrom, { color: colors.text }]}>{alert.from}</Text>
                                <Text style={[styles.alertArrow, { color: colors.textSecondary }]}>→</Text>
                                <Text style={[styles.alertTo, { color: colors.text }]}>{alert.to}</Text>
                            </View>
                            <View style={styles.alertPrices}>
                                <View style={styles.alertPriceRow}>
                                    <Text style={[styles.alertPriceLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'Prix cible' : 'Target'}
                                    </Text>
                                    <Text style={[styles.alertPriceValue, { color: '#4CAF50' }]}>
                                        ≤ {alert.targetPrice.toLocaleString('fr-FR')} F
                                    </Text>
                                </View>
                                <View style={styles.alertPriceRow}>
                                    <Text style={[styles.alertPriceLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'Prix actuel' : 'Current'}
                                    </Text>
                                    <Text style={[
                                        styles.alertPriceValue,
                                        { color: alert.currentPrice <= alert.targetPrice ? '#4CAF50' : '#E91E63' }
                                    ]}>
                                        {alert.currentPrice.toLocaleString('fr-FR')} F
                                    </Text>
                                </View>
                            </View>
                            {alert.triggered && (
                                <View style={styles.triggeredBadge}>
                                    <Text style={styles.triggeredText}>🎉 {language === 'fr' ? 'Prix atteint !' : 'Price reached!'}</Text>
                                </View>
                            )}
                            <View style={styles.alertActions}>
                                <Switch
                                    value={alert.enabled}
                                    onValueChange={() => toggleAlert(alert.id)}
                                    trackColor={{ false: colors.textSecondary + '30', true: '#2196F350' }}
                                    thumbColor={alert.enabled ? '#2196F3' : colors.card}
                                />
                                <TouchableOpacity onPress={() => deleteAlert(alert.id)}>
                                    <Icon name="trash" size={22} color="#E91E63" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {alerts.length === 0 && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                            <Text style={styles.emptyIcon}>🔕</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Aucune alerte active' : 'No active alerts'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Historique */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        📜 {language === 'fr' ? 'Historique des économies' : 'Savings history'}
                    </Text>

                    {ALERT_HISTORY.map((item) => (
                        <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card }]}>
                            <View style={styles.historyLeft}>
                                <Text style={[styles.historyRoute, { color: colors.text }]}>{item.route}</Text>
                                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                            </View>
                            <View style={styles.historyRight}>
                                <Text style={styles.historyPrice}>{item.price.toLocaleString('fr-FR')} F</Text>
                                <Text style={styles.historySaved}>-{item.saved} F ✅</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#E3F2FD' }]}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        {language === 'fr'
                            ? 'Recevez une notification push dès que le prix de votre trajet passe sous le seuil défini.'
                            : 'Get a push notification when your route price drops below your target.'}
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    headerContent: {},
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: SPACING.lg },

    // Stats
    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    statBox: { flex: 1, padding: SPACING.sm, borderRadius: 16, alignItems: 'center' },
    statIcon: { fontSize: 24, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },

    // Section
    section: { marginBottom: SPACING.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2196F320',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Add form
    addForm: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.md },
    input: {
        padding: SPACING.sm,
        borderRadius: 10,
        marginBottom: SPACING.sm,
        fontSize: 14,
    },
    confirmBtn: {},
    confirmGradient: { padding: SPACING.sm, borderRadius: 20, alignItems: 'center' },
    confirmText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

    // Alert card
    alertCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.sm },
    alertRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    alertFrom: { fontSize: 14, fontWeight: '600' },
    alertArrow: { fontSize: 14 },
    alertTo: { fontSize: 14, fontWeight: '600' },
    alertPrices: { gap: 4 },
    alertPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    alertPriceLabel: { fontSize: 12 },
    alertPriceValue: { fontSize: 14, fontWeight: '700' },
    triggeredBadge: { backgroundColor: '#4CAF5020', padding: 8, borderRadius: 8, marginTop: SPACING.sm },
    triggeredText: { color: '#4CAF50', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    alertActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },

    // Empty
    emptyCard: { padding: SPACING.xl, borderRadius: 16, alignItems: 'center' },
    emptyIcon: { fontSize: 40, marginBottom: SPACING.sm },
    emptyText: { fontSize: 14 },

    // History
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm
    },
    historyLeft: {},
    historyRoute: { fontSize: 14, fontWeight: '500' },
    historyDate: { fontSize: 11, marginTop: 2 },
    historyRight: { alignItems: 'flex-end' },
    historyPrice: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
    historySaved: { fontSize: 11, color: '#4CAF50', marginTop: 2 },

    // Info
    infoCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    infoIcon: { fontSize: 20 },
    infoText: { flex: 1, fontSize: 13 },
});
