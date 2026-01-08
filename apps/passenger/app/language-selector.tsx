// =============================================
// TRANSIGO - LANGUAGE SELECTOR SCREEN
// =============================================

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useLanguageStore } from '@/stores';

const LANGUAGES = [
    { id: 'fr', label: 'Français (Côte d’Ivoire)', icon: '🇫🇷' },
    { id: 'en', label: 'English (United States)', icon: '🇺🇸' },
];

export default function LanguageSelectorScreen() {
    const { language, setLanguage } = useLanguageStore();

    const handleSelect = (lang: string) => {
        setLanguage(lang as 'fr' | 'en');
        router.back();
    };

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>Langue / Language</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Choisissez votre langue :</Text>
                <Text style={styles.sectionSubtitle}>Choose your preferred language :</Text>

                <View style={styles.list}>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            style={[
                                styles.langItem,
                                language === lang.id && styles.langItemActive,
                            ]}
                            onPress={() => handleSelect(lang.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.langLeft}>
                                <Text style={styles.flagIcon}>{lang.icon}</Text>
                                <Text style={[
                                    styles.langLabel,
                                    language === lang.id && styles.langLabelActive
                                ]}>{lang.label}</Text>
                            </View>
                            {language === lang.id && (
                                <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
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
    content: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: SPACING.md,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    list: {
        gap: SPACING.md,
    },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    langItemActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryBg,
    },
    langLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    flagIcon: {
        fontSize: 24,
    },
    langLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    langLabelActive: {
        color: COLORS.primary,
    },
});
