// =============================================
// TRANSIGO - CHAT IN-APP
// Messagerie avec chauffeur/livreur
// =============================================

import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'driver';
    time: string;
    status: 'sent' | 'delivered' | 'read';
};

// Messages rapides
const QUICK_MESSAGES_FR = [
    'Je suis en route',
    'Où êtes-vous ?',
    'J\'arrive dans 2 min',
    'Merci !',
    'OK, pas de problème',
];

const QUICK_MESSAGES_EN = [
    'On my way',
    'Where are you?',
    'Arriving in 2 min',
    'Thank you!',
    'OK, no problem',
];

// Messages initiaux simulés
const INITIAL_MESSAGES: Message[] = [
    { id: 'm1', text: 'Bonjour ! Je suis en route vers vous.', sender: 'driver', time: '14:32', status: 'read' },
    { id: 'm2', text: 'D\'accord, merci. Je vous attends devant le bâtiment.', sender: 'user', time: '14:33', status: 'read' },
    { id: 'm3', text: 'Parfait, j\'arrive dans 3 minutes 🚗', sender: 'driver', time: '14:34', status: 'read' },
];

export default function ChatScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const flatListRef = useRef<FlatList>(null);

    // Paramètres
    const driverName = params.driver_name as string || 'Koné Ibrahim';
    const driverPhone = params.driver_phone as string || '+225 07 00 00 00';
    const driverAvatar = params.driver_avatar as string || '👨🏾';
    const rideType = params.ride_type as string || 'ride'; // ride, delivery, food

    // États
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const quickMessages = language === 'fr' ? QUICK_MESSAGES_FR : QUICK_MESSAGES_EN;

    const getRideIcon = () => {
        switch (rideType) {
            case 'delivery': return '📦';
            case 'food': return '🍔';
            default: return '🚗';
        }
    };

    const getRideLabel = () => {
        switch (rideType) {
            case 'delivery': return language === 'fr' ? 'Livreur' : 'Delivery driver';
            case 'food': return language === 'fr' ? 'Livreur Food' : 'Food courier';
            default: return language === 'fr' ? 'Chauffeur' : 'Driver';
        }
    };

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        const newMessage: Message = {
            id: `m${Date.now()}`,
            text: text.trim(),
            sender: 'user',
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simuler réponse du chauffeur
        setIsTyping(true);
        setTimeout(() => {
            const replies = language === 'fr'
                ? ['D\'accord !', 'Bien reçu 👍', 'Parfait, à tout de suite !', 'OK !']
                : ['Alright!', 'Got it 👍', 'Perfect, see you soon!', 'OK!'];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            const driverReply: Message = {
                id: `m${Date.now()}_reply`,
                text: randomReply,
                sender: 'driver',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'read',
            };
            setMessages(prev => [...prev, driverReply]);
            setIsTyping(false);
        }, 1500 + Math.random() * 1000);

        // Scroll en bas
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleCall = () => {
        Linking.openURL(`tel:${driverPhone}`);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';

        return (
            <View style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowDriver
            ]}>
                {!isUser && (
                    <View style={styles.messageAvatar}>
                        <Text style={styles.messageAvatarText}>{driverAvatar}</Text>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.messageBubbleUser : styles.messageBubbleDriver,
                    { backgroundColor: isUser ? '#4CAF50' : (isDark ? '#333' : '#F0F0F0') }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? COLORS.white : colors.text }
                    ]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[
                            styles.messageTime,
                            { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                        ]}>
                            {item.time}
                        </Text>
                        {isUser && (
                            <Text style={styles.messageStatus}>
                                {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{driverAvatar}</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerName}>{driverName}</Text>
                        <View style={styles.headerMeta}>
                            <Text style={styles.headerRole}>{getRideIcon()} {getRideLabel()}</Text>
                            {isTyping && (
                                <Text style={styles.typingText}>
                                    {language === 'fr' ? 'écrit...' : 'typing...'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                    <Icon name="call" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </LinearGradient>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* Quick messages */}
            <View style={styles.quickMessagesContainer}>
                <FlatList
                    horizontal
                    data={quickMessages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.quickMessage, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}
                            onPress={() => sendMessage(item)}
                        >
                            <Text style={[styles.quickMessageText, { color: colors.text }]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickMessagesList}
                />
            </View>

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#252525' : '#F5F5F5' }]}
                    placeholder={language === 'fr' ? 'Écrire un message...' : 'Type a message...'}
                    placeholderTextColor={colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, { opacity: inputText.trim() ? 1 : 0.5 }]}
                    onPress={() => sendMessage(inputText)}
                    disabled={!inputText.trim()}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#388E3C']}
                        style={styles.sendBtnGradient}
                    >
                        <Icon name="send" size={20} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.sm },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: { fontSize: 24 },
    headerText: { marginLeft: SPACING.sm },
    headerName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
    headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerRole: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    typingText: { fontSize: 12, color: '#B2FF59', fontStyle: 'italic' },
    callBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Messages
    messagesList: { padding: SPACING.lg, paddingBottom: SPACING.sm },
    messageRow: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end' },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowDriver: { justifyContent: 'flex-start' },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageAvatarText: { fontSize: 16 },
    messageBubble: {
        maxWidth: '75%',
        padding: SPACING.sm,
        borderRadius: 16,
    },
    messageBubbleUser: {
        borderBottomRightRadius: 4,
    },
    messageBubbleDriver: {
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
    messageTime: { fontSize: 10 },
    messageStatus: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },

    // Quick messages
    quickMessagesContainer: { paddingVertical: 8 },
    quickMessagesList: { paddingHorizontal: SPACING.lg },
    quickMessage: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
    },
    quickMessageText: { fontSize: 13 },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: SPACING.sm,
        paddingBottom: 30,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
    },
    sendBtn: {},
    sendBtnGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
