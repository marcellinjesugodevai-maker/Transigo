// ======================================
// TRANSIGO - PAYMENT METHODS SCREEN
// =======================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

interface PaymentMethod {
    id: string;
    type: 'card' | 'mobile_money' | 'cash';
    name: string;
    details: string;
    isDefault: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    { id: '1', type: 'card', name: 'Visa •••• 4242', details: 'Expire 12/25', isDefault: true },
    { id: '2', type: 'mobile_money', name: 'Orange Money', details: '+225 07 00 11 22', isDefault: false },
    { id: '3', type: 'cash', name: 'Espèces', details: 'Paiement en liquide', isDefault: false },
];

export default function PaymentMethodsScreen() {
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const [methods, setMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);

    const getTypeIcon = (type: PaymentMethod['type']) => {
        switch (type) {
            case 'card': return '💳';
            case 'mobile_money': return '📱';
            case 'cash': return '💵';
        }
    };

    const handleSetDefault = (id: string) => {
        setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer ce moyen de paiement ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => setMethods(methods.filter(m => m.id !== id)),
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('paymentMethods')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {methods.map((method) => (
                    <View key={method.id} style={[styles.methodCard, { backgroundColor: colors.card }]}>
                        <View style={styles.methodHeader}>
                            <View style={styles.methodLeft}>
                                <Text style={styles.typeIcon}>{getTypeIcon(method.type)}</Text>
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: colors.text }]}>
                                        {method.type === 'cash' ? t('cash') : method.name}
                                    </Text>
                                    <Text style={[styles.methodDetails, { color: colors.textSecondary }]}>{method.details}</Text>
                                </View>
                            </View>
                            {method.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>{t('default')}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.methodActions}>
                            {!method.isDefault && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { borderColor: colors.primary }]}
                                    onPress={() => handleSetDefault(method.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.actionText, { color: colors.primary }]}>{t('setDefault')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteActionButton]}
                                onPress={() => handleDelete(method.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.deleteActionText}>{t('delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Bouton ajouter */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.addButtonGradient}
                    >
                        <Icon name="add" size={24} color={COLORS.white} />
                        <Text style={styles.addButtonText}>{t('addPaymentMethod')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    methodCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    methodHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    methodLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    typeIcon: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    methodDetails: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    defaultBadge: {
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    defaultText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    methodActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    deleteActionButton: {
        borderColor: '#F44336',
    },
    deleteActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F44336',
    },
    addButton: {
        marginTop: SPACING.md,
        borderRadius: 16,
        overflow: 'hidden',
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: SPACING.sm,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
