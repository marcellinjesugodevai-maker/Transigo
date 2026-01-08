// =============================================
// TRANSIGO - THEME SELECTOR SCREEN
// =============================================

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore } from '@/stores';

export default function ThemeSelectorScreen() {
    const { isDark, toggleTheme } = useThemeStore();

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
                <Text style={styles.headerTitle}>Mode Sombre / Dark Mode</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoEmoji}>🌗</Text>
                    <Text style={styles.infoTitle}>Personnalisez votre interface</Text>
                    <Text style={styles.infoText}>
                        Le mode sombre réduit la fatigue oculaire dans les environnements peu éclairés
                        et peut prolonger l'autonomie de votre batterie sur les écrans OLED.
                    </Text>
                </View>

                <View style={styles.toggleCard}>
                    <View style={styles.toggleLeft}>
                        <Icon
                            name={isDark ? "moon" : "sunny"}
                            size={24}
                            color={isDark ? "#7E57C2" : "#FFB300"}
                        />
                        <View>
                            <Text style={styles.toggleTitle}>Activer le mode sombre</Text>
                            <Text style={styles.toggleSubtitle}>Interface plus sombre et reposante</Text>
                        </View>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#D1D1D1', true: COLORS.primary + '80' }}
                        thumbColor={isDark ? COLORS.primary : '#F4F4F4'}
                    />
                </View>

                {/* Preview Section */}
                <Text style={styles.sectionTitle}>Prévisualisation</Text>
                <View style={[styles.previewBox, { backgroundColor: isDark ? '#121212' : '#FAFAFA' }]}>
                    <View style={[styles.previewCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                        <View style={styles.previewHeader} />
                        <View style={styles.previewLineShort} />
                        <View style={styles.previewLineLong} />
                    </View>
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
    infoCard: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 20,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    infoEmoji: {
        fontSize: 40,
        marginBottom: SPACING.sm,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: SPACING.xl,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    toggleSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    previewBox: {
        height: 120,
        borderRadius: 16,
        padding: SPACING.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    previewCard: {
        width: '60%',
        height: 60,
        borderRadius: 8,
        padding: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    previewHeader: {
        width: '100%',
        height: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    previewLineShort: {
        width: '40%',
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    previewLineLong: {
        width: '80%',
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
});
