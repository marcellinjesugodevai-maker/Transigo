// =============================================
// TRANSIGO - MODE SOS SÉCURITÉ
// Bouton d'urgence, partage trajet, contacts confiance
// =============================================

import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
    Share,
    Animated,
    Vibration,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

// Contacts de confiance simulés
const INITIAL_CONTACTS = [
    { id: 'c1', name: 'Maman', phone: '+225 07 00 00 01', emoji: '👩🏾' },
    { id: 'c2', name: 'Papa', phone: '+225 07 00 00 02', emoji: '👨🏾' },
];

// Numéros d'urgence Côte d'Ivoire
const EMERGENCY_NUMBERS = [
    { id: 'police', name: 'Police Secours', number: '111', emoji: '👮' },
    { id: 'samu', name: 'SAMU', number: '185', emoji: '🚑' },
    { id: 'pompiers', name: 'Pompiers', number: '180', emoji: '🚒' },
];

export default function SOSScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [contacts, setContacts] = useState(INITIAL_CONTACTS);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isSOSActive) {
            // Animation pulsation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                ])
            ).start();

            // Vibration
            Vibration.vibrate([500, 200, 500, 200, 500], true);

            // Countdown
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        triggerSOS();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            pulseAnim.setValue(1);
            Vibration.cancel();
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
            setCountdown(5);
        }

        return () => {
            Vibration.cancel();
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [isSOSActive]);

    const triggerSOS = () => {
        setIsSOSActive(false);

        // Envoyer alertes aux contacts
        Alert.alert(
            '🆘 ALERTE SOS ENVOYÉE',
            language === 'fr'
                ? `Message d'urgence envoyé à ${contacts.length} contacts.\n\nLa police a été prévenue.\nVotre position a été partagée.`
                : `Emergency message sent to ${contacts.length} contacts.\n\nPolice has been notified.\nYour location has been shared.`,
            [{ text: 'OK' }]
        );
    };

    const cancelSOS = () => {
        setIsSOSActive(false);
        Alert.alert('✅', language === 'fr' ? 'Alerte annulée' : 'Alert cancelled');
    };

    const shareLocation = async () => {
        try {
            await Share.share({
                message: language === 'fr'
                    ? '🆘 URGENCE TransiGo!\n\nJe suis en course et j\'ai besoin d\'aide.\n\n📍 Ma position: https://maps.google.com/?q=5.3499,-4.0166\n\n🚗 Véhicule: Toyota Corolla Blanc\n📋 Plaque: CI 1234 AB\n👨 Chauffeur: Koné Ibrahim'
                    : '🆘 TransiGo EMERGENCY!\n\nI\'m on a ride and need help.\n\n📍 My location: https://maps.google.com/?q=5.3499,-4.0166\n\n🚗 Vehicle: White Toyota Corolla\n📋 Plate: CI 1234 AB\n👨 Driver: Koné Ibrahim',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const callEmergency = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const addContact = () => {
        if (!newContactName || !newContactPhone) {
            Alert.alert('❌', language === 'fr' ? 'Remplissez tous les champs' : 'Fill all fields');
            return;
        }

        const newContact = {
            id: `c${Date.now()}`,
            name: newContactName,
            phone: newContactPhone,
            emoji: '👤',
        };

        setContacts([...contacts, newContact]);
        setNewContactName('');
        setNewContactPhone('');
        setShowAddContact(false);
        Alert.alert('✅', language === 'fr' ? 'Contact ajouté' : 'Contact added');
    };

    const removeContact = (id: string) => {
        Alert.alert(
            language === 'fr' ? 'Supprimer ce contact ?' : 'Remove this contact?',
            '',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Supprimer' : 'Remove', style: 'destructive', onPress: () => {
                        setContacts(contacts.filter(c => c.id !== id));
                    }
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isSOSActive ? '#B71C1C' : colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            {!isSOSActive && (
                <LinearGradient
                    colors={['#E91E63', '#C2185B']}
                    style={styles.header}
                >
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>🛡️ {language === 'fr' ? 'Mode SOS' : 'SOS Mode'}</Text>
                        <Text style={styles.headerSubtitle}>
                            {language === 'fr' ? 'Votre sécurité, notre priorité' : 'Your safety, our priority'}
                        </Text>
                    </View>
                </LinearGradient>
            )}

            {/* Mode SOS Actif */}
            {isSOSActive ? (
                <View style={styles.sosActiveContainer}>
                    <Animated.View style={[styles.sosCircle, { transform: [{ scale: pulseAnim }] }]}>
                        <Text style={styles.sosCountdown}>{countdown}</Text>
                    </Animated.View>
                    <Text style={styles.sosActiveText}>
                        {language === 'fr' ? 'ALERTE EN COURS...' : 'ALERT IN PROGRESS...'}
                    </Text>
                    <Text style={styles.sosSubtext}>
                        {language === 'fr'
                            ? 'L\'alerte sera envoyée automatiquement'
                            : 'Alert will be sent automatically'}
                    </Text>
                    <TouchableOpacity style={styles.cancelSOSBtn} onPress={cancelSOS}>
                        <Text style={styles.cancelSOSText}>
                            ❌ {language === 'fr' ? 'ANNULER' : 'CANCEL'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Bouton SOS Principal */}
                    <View style={styles.sosSection}>
                        <TouchableOpacity
                            style={styles.sosBigButton}
                            onPress={() => setIsSOSActive(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#F44336', '#B71C1C']}
                                style={styles.sosGradient}
                            >
                                <Text style={styles.sosIcon}>🆘</Text>
                                <Text style={styles.sosButtonText}>SOS</Text>
                                <Text style={styles.sosButtonSubtext}>
                                    {language === 'fr' ? 'Appuyez en cas d\'urgence' : 'Press in case of emergency'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Partager ma position */}
                    <TouchableOpacity style={[styles.shareCard, { backgroundColor: colors.card }]} onPress={shareLocation}>
                        <View style={[styles.shareIcon, { backgroundColor: '#4CAF5020' }]}>
                            <Text style={styles.shareIconText}>📍</Text>
                        </View>
                        <View style={styles.shareContent}>
                            <Text style={[styles.shareTitle, { color: colors.text }]}>
                                {language === 'fr' ? 'Partager ma position' : 'Share my location'}
                            </Text>
                            <Text style={[styles.shareSubtitle, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Envoyer ma position à mes proches' : 'Send my location to loved ones'}
                            </Text>
                        </View>
                        <Icon name="share-social" size={24} color="#4CAF50" />
                    </TouchableOpacity>

                    {/* Contacts de confiance */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                👥 {language === 'fr' ? 'Contacts de confiance' : 'Trusted contacts'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddContact(!showAddContact)}>
                                <Icon name={showAddContact ? 'close' : 'add-circle'} size={28} color="#E91E63" />
                            </TouchableOpacity>
                        </View>

                        {showAddContact && (
                            <View style={[styles.addContactForm, { backgroundColor: colors.card }]}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#252525' : '#F5F5F5', color: colors.text }]}
                                    placeholder={language === 'fr' ? 'Nom' : 'Name'}
                                    placeholderTextColor={colors.textSecondary}
                                    value={newContactName}
                                    onChangeText={setNewContactName}
                                />
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#252525' : '#F5F5F5', color: colors.text }]}
                                    placeholder={language === 'fr' ? 'Téléphone' : 'Phone'}
                                    placeholderTextColor={colors.textSecondary}
                                    value={newContactPhone}
                                    onChangeText={setNewContactPhone}
                                    keyboardType="phone-pad"
                                />
                                <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
                                    <Text style={styles.addContactBtnText}>
                                        ✅ {language === 'fr' ? 'Ajouter' : 'Add'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {contacts.map((contact) => (
                            <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.card }]}>
                                <Text style={styles.contactEmoji}>{contact.emoji}</Text>
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeContact(contact.id)}>
                                    <Icon name="trash" size={20} color="#E91E63" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {contacts.length === 0 && (
                            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                                <Text style={styles.emptyIcon}>👤</Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Aucun contact de confiance' : 'No trusted contacts'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Numéros d'urgence */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            📞 {language === 'fr' ? 'Numéros d\'urgence' : 'Emergency numbers'}
                        </Text>

                        {EMERGENCY_NUMBERS.map((emergency) => (
                            <TouchableOpacity
                                key={emergency.id}
                                style={[styles.emergencyCard, { backgroundColor: colors.card }]}
                                onPress={() => callEmergency(emergency.number)}
                            >
                                <Text style={styles.emergencyEmoji}>{emergency.emoji}</Text>
                                <View style={styles.emergencyInfo}>
                                    <Text style={[styles.emergencyName, { color: colors.text }]}>{emergency.name}</Text>
                                    <Text style={[styles.emergencyNumber, { color: '#E91E63' }]}>{emergency.number}</Text>
                                </View>
                                <View style={styles.callBtn}>
                                    <Icon name="call" size={20} color={COLORS.white} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Info */}
                    <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#FCE4EC' }]}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            {language === 'fr'
                                ? 'En cas d\'urgence, le bouton SOS alertera automatiquement vos contacts de confiance et les services de secours avec votre position en temps réel.'
                                : 'In case of emergency, the SOS button will automatically alert your trusted contacts and emergency services with your real-time location.'}
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
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
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: SPACING.lg },

    // SOS Active
    sosActiveContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    sosCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    sosCountdown: { fontSize: 80, fontWeight: 'bold', color: COLORS.white },
    sosActiveText: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginBottom: SPACING.sm },
    sosSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.xl },
    cancelSOSBtn: {
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    cancelSOSText: { fontSize: 18, fontWeight: 'bold', color: '#B71C1C' },

    // SOS Button
    sosSection: { alignItems: 'center', marginBottom: SPACING.lg },
    sosBigButton: { width: 200, height: 200 },
    sosGradient: {
        flex: 1,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    sosIcon: { fontSize: 40, marginBottom: 8 },
    sosButtonText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
    sosButtonSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },

    // Share
    shareCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.lg,
    },
    shareIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    shareIconText: { fontSize: 24 },
    shareContent: { flex: 1, marginLeft: SPACING.sm },
    shareTitle: { fontSize: 15, fontWeight: '600' },
    shareSubtitle: { fontSize: 12, marginTop: 2 },

    // Section
    section: { marginBottom: SPACING.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700' },

    // Add contact form
    addContactForm: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.sm },
    input: { padding: SPACING.sm, borderRadius: 10, marginBottom: SPACING.sm, fontSize: 14 },
    addContactBtn: { backgroundColor: '#4CAF50', padding: SPACING.sm, borderRadius: 20, alignItems: 'center' },
    addContactBtnText: { color: COLORS.white, fontWeight: '600' },

    // Contact card
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    contactEmoji: { fontSize: 30 },
    contactInfo: { flex: 1, marginLeft: SPACING.sm },
    contactName: { fontSize: 14, fontWeight: '600' },
    contactPhone: { fontSize: 12, marginTop: 2 },

    // Emergency
    emergencyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    emergencyEmoji: { fontSize: 30 },
    emergencyInfo: { flex: 1, marginLeft: SPACING.sm },
    emergencyName: { fontSize: 14, fontWeight: '600' },
    emergencyNumber: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
    callBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty
    emptyCard: { padding: SPACING.xl, borderRadius: 16, alignItems: 'center' },
    emptyIcon: { fontSize: 40, marginBottom: SPACING.sm },
    emptyText: { fontSize: 14 },

    // Info
    infoCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    infoIcon: { fontSize: 20 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
