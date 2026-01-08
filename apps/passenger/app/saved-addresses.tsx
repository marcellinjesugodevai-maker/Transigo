// =============================================
// TRANSIGO - SAVED ADDRESSES SCREEN
// =============================================

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

interface Address {
    id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    address: string;
}

const ADDRESSES: Address[] = [
    { id: '1', type: 'home', label: 'Maison', address: 'Cocody, Riviera 2, Abidjan' },
    { id: '2', type: 'work', label: 'Bureau', address: 'Plateau, Rue du Commerce, Abidjan' },
];

export default function SavedAddressesScreen() {
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);

    const getTypeIcon = (type: Address['type']) => {
        switch (type) {
            case 'home': return '🏠';
            case 'work': return '💼';
            case 'other': return '📍';
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette adresse ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => setAddresses(addresses.filter(a => a.id !== id)),
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
                <Text style={styles.headerTitle}>{t('savedAddresses')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {addresses.map((address) => (
                    <TouchableOpacity
                        key={address.id}
                        style={[styles.addressCard, { backgroundColor: colors.card, borderColor: isDark ? colors.background : '#F0F0F0' }]}
                        activeOpacity={0.8}
                    >
                        <View style={styles.addressHeader}>
                            <View style={styles.addressLeft}>
                                <Text style={styles.typeIcon}>{getTypeIcon(address.type)}</Text>
                                <View style={styles.addressInfo}>
                                    <Text style={[styles.addressLabel, { color: colors.text }]}>{address.label}</Text>
                                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>{address.address}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(address.id)}
                                activeOpacity={0.8}
                            >
                                <Icon name="trash" size={20} color="#F44336" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
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
                        <Text style={styles.addButtonText}>Ajouter une adresse</Text>
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
    addressCard: {
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
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    addressLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    typeIcon: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    deleteButton: {
        padding: 8,
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
