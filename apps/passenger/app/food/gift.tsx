// =============================================
// TRANSIGO FOOD - OFFRIR UN REPAS
// Envoyer une commande en cadeau
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

// Contacts récents simulés
const RECENT_CONTACTS = [
    { id: 'c1', name: 'Maman', phone: '+225 07 00 00 01', avatar: '👩🏾' },
    { id: 'c2', name: 'Papa', phone: '+225 07 00 00 02', avatar: '👨🏾' },
    { id: 'c3', name: 'Marie', phone: '+225 07 00 00 03', avatar: '👩🏿' },
    { id: 'c4', name: 'Jean', phone: '+225 07 00 00 04', avatar: '👨🏿' },
];

// Messages prédéfinis
const GIFT_MESSAGES_FR = [
    '🎁 Un petit cadeau pour toi !',
    '❤️ Je pense à toi, bon appétit !',
    '🎉 Félicitations ! Régale-toi !',
    '💪 Courage, mange bien !',
    '🌟 Tu le mérites !',
];

const GIFT_MESSAGES_EN = [
    '🎁 A little gift for you!',
    '❤️ Thinking of you, enjoy!',
    '🎉 Congratulations! Enjoy!',
    '💪 Stay strong, eat well!',
    '🌟 You deserve it!',
];

export default function GiftMealScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Paramètres de la commande
    const restaurantName = params.restaurant_name as string || 'Restaurant';
    const restaurantEmoji = params.restaurant_emoji as string || '🍽️';
    const total = Number(params.total) || 0;
    const itemsCount = Number(params.items_count) || 1;

    // États
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(0);
    const [customMessage, setCustomMessage] = useState('');
    const [showContacts, setShowContacts] = useState(false);

    const giftMessages = language === 'fr' ? GIFT_MESSAGES_FR : GIFT_MESSAGES_EN;

    const handleSelectContact = (contact: typeof RECENT_CONTACTS[0]) => {
        setRecipientName(contact.name);
        setRecipientPhone(contact.phone);
        setShowContacts(false);
    };

    const handleSendGift = () => {
        if (!recipientName || !recipientPhone) {
            Alert.alert(
                '❌',
                language === 'fr' ? 'Veuillez renseigner le destinataire.' : 'Please enter recipient info.'
            );
            return;
        }
        if (!deliveryAddress) {
            Alert.alert(
                '❌',
                language === 'fr' ? 'Veuillez renseigner l\'adresse de livraison.' : 'Please enter delivery address.'
            );
            return;
        }

        const message = customMessage || giftMessages[selectedMessage];

        Alert.alert(
            '🎁 ' + (language === 'fr' ? 'Cadeau envoyé !' : 'Gift sent!'),
            language === 'fr'
                ? `${recipientName} va recevoir votre cadeau de ${restaurantName}.\n\nMessage : "${message}"`
                : `${recipientName} will receive your gift from ${restaurantName}.\n\nMessage: "${message}"`,
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🎁 {language === 'fr' ? 'Offrir un repas' : 'Gift a meal'}</Text>
                <View style={{ width: 44 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Résumé commande */}
                <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
                    <View style={styles.orderHeader}>
                        <Text style={styles.orderEmoji}>{restaurantEmoji}</Text>
                        <View style={styles.orderInfo}>
                            <Text style={[styles.orderRestaurant, { color: colors.text }]}>{restaurantName}</Text>
                            <Text style={[styles.orderItems, { color: colors.textSecondary }]}>
                                {itemsCount} {language === 'fr' ? 'article(s)' : 'item(s)'}
                            </Text>
                        </View>
                        <Text style={styles.orderTotal}>{total.toLocaleString('fr-FR')} F</Text>
                    </View>
                </View>

                {/* Destinataire */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    👤 {language === 'fr' ? 'À qui offrir ?' : 'Who to gift?'}
                </Text>

                <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
                    <View style={styles.inputRow}>
                        <Icon name="person" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder={language === 'fr' ? 'Nom du destinataire' : 'Recipient name'}
                            placeholderTextColor={colors.textSecondary}
                            value={recipientName}
                            onChangeText={setRecipientName}
                        />
                    </View>
                    <View style={styles.inputDivider} />
                    <View style={styles.inputRow}>
                        <Icon name="call" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder={language === 'fr' ? 'Numéro de téléphone' : 'Phone number'}
                            placeholderTextColor={colors.textSecondary}
                            value={recipientPhone}
                            onChangeText={setRecipientPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Contacts récents */}
                <TouchableOpacity
                    style={styles.contactsToggle}
                    onPress={() => setShowContacts(!showContacts)}
                >
                    <Text style={[styles.contactsToggleText, { color: '#E91E63' }]}>
                        📇 {language === 'fr' ? 'Choisir un contact récent' : 'Choose recent contact'}
                    </Text>
                    <Icon name={showContacts ? 'chevron-up' : 'chevron-down'} size={18} color="#E91E63" />
                </TouchableOpacity>

                {showContacts && (
                    <View style={styles.contactsList}>
                        {RECENT_CONTACTS.map((contact) => (
                            <TouchableOpacity
                                key={contact.id}
                                style={[styles.contactItem, { backgroundColor: colors.card }]}
                                onPress={() => handleSelectContact(contact)}
                            >
                                <Text style={styles.contactAvatar}>{contact.avatar}</Text>
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Adresse de livraison */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📍 {language === 'fr' ? 'Adresse de livraison' : 'Delivery address'}
                </Text>

                <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
                    <View style={styles.inputRow}>
                        <Icon name="location" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder={language === 'fr' ? 'Adresse du destinataire' : 'Recipient address'}
                            placeholderTextColor={colors.textSecondary}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                        />
                    </View>
                </View>

                {/* Message cadeau */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    💌 {language === 'fr' ? 'Message cadeau' : 'Gift message'}
                </Text>

                <View style={styles.messagesGrid}>
                    {giftMessages.map((msg, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.messageChip,
                                { backgroundColor: isDark ? '#333' : '#F5F5F5' },
                                selectedMessage === index && styles.messageChipSelected
                            ]}
                            onPress={() => {
                                setSelectedMessage(index);
                                setCustomMessage('');
                            }}
                        >
                            <Text style={[
                                styles.messageChipText,
                                { color: selectedMessage === index ? COLORS.white : colors.text }
                            ]}>
                                {msg}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.customMessageInput, {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: customMessage ? '#E91E63' : 'transparent'
                    }]}
                    placeholder={language === 'fr' ? 'Ou écrire votre propre message...' : 'Or write your own message...'}
                    placeholderTextColor={colors.textSecondary}
                    value={customMessage}
                    onChangeText={(text) => {
                        setCustomMessage(text);
                        if (text) setSelectedMessage(-1);
                    }}
                    multiline
                />

                {/* Bouton envoyer */}
                <TouchableOpacity style={styles.sendButton} onPress={handleSendGift}>
                    <LinearGradient
                        colors={['#E91E63', '#C2185B']}
                        style={styles.sendGradient}
                    >
                        <Text style={styles.sendIcon}>🎁</Text>
                        <Text style={styles.sendText}>
                            {language === 'fr' ? 'Envoyer le cadeau' : 'Send gift'} • {total.toLocaleString('fr-FR')} F
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },

    content: { padding: SPACING.lg },

    // Order card
    orderCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    orderHeader: { flexDirection: 'row', alignItems: 'center' },
    orderEmoji: { fontSize: 40 },
    orderInfo: { flex: 1, marginLeft: SPACING.sm },
    orderRestaurant: { fontSize: 16, fontWeight: '600' },
    orderItems: { fontSize: 13, marginTop: 2 },
    orderTotal: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },

    // Input
    inputCard: { borderRadius: 16, marginBottom: SPACING.md, overflow: 'hidden' },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
    input: { flex: 1, marginLeft: SPACING.sm, fontSize: 15 },
    inputDivider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: SPACING.md },

    // Contacts
    contactsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        gap: 6,
    },
    contactsToggleText: { fontSize: 14, fontWeight: '500' },
    contactsList: { marginBottom: SPACING.lg },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: 12,
        marginBottom: 8
    },
    contactAvatar: { fontSize: 28 },
    contactInfo: { marginLeft: SPACING.sm },
    contactName: { fontSize: 14, fontWeight: '600' },
    contactPhone: { fontSize: 12 },

    // Messages
    messagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
    messageChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
    messageChipSelected: { backgroundColor: '#E91E63' },
    messageChipText: { fontSize: 13 },
    customMessageInput: {
        padding: SPACING.md,
        borderRadius: 16,
        minHeight: 80,
        fontSize: 14,
        textAlignVertical: 'top',
        borderWidth: 2,
        marginBottom: SPACING.lg,
    },

    // Send button
    sendButton: {},
    sendGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    sendIcon: { fontSize: 22 },
    sendText: { fontSize: 17, fontWeight: 'bold', color: COLORS.white },
});
