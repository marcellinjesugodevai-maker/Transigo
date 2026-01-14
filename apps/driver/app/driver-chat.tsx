// =============================================
// TRANSIGO DRIVER - CHAT PASSENGER
// Discussion avec passager pendant la course
// =============================================

import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Linking,
    StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

interface Message {
    id: string;
    text: string;
    isDriver: boolean;
    time: string;
}

// Messages rapides chauffeur
const QUICK_MESSAGES = [
    'Je suis arrivé',
    'J\'arrive dans 2 min',
    'Pouvez-vous sortir ?',
    'Je suis garé devant',
    'OK, compris',
];

export default function DriverChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const passengerName = params.name as string || 'Passager';
    const passengerPhone = params.phone as string || '+225 07 00 00 00';

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Bonjour ! Où puis-je vous trouver exactement ?', isDriver: true, time: '14:30' },
        { id: '2', text: 'Bonjour, je suis devant le supermarché.', isDriver: false, time: '14:31' },
        { id: '3', text: 'Parfait, j\'arrive dans 2 minutes.', isDriver: true, time: '14:31' },
    ]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isDriver: true,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Simuler réponse passager après 2s
        setTimeout(() => {
            const responses = ['OK merci !', 'D\'accord', 'Je vous vois', '👍', 'Parfait !'];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: randomResponse,
                isDriver: false,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }]);
        }, 2000);
    };

    const callPassenger = () => {
        Linking.openURL(`tel:${passengerPhone}`);
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[styles.messageRow, item.isDriver && styles.messageRowDriver]}>
            <View style={[styles.messageBubble, item.isDriver ? styles.driverBubble : styles.passengerBubble]}>
                <Text style={[styles.messageText, item.isDriver ? styles.driverText : styles.passengerText]}>
                    {item.text}
                </Text>
                <Text style={[styles.messageTime, item.isDriver ? styles.driverTime : styles.passengerTime]}>
                    {item.time}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                        <Text style={styles.avatarText}>{passengerName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.passengerName}>{passengerName}</Text>
                        <Text style={styles.passengerStatus}>🟢 En ligne</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.callBtn} onPress={callPassenger}>
                    <Text style={{ fontSize: 22, color: COLORS.white }}>📞</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* Quick messages */}
            <View style={styles.quickMessagesContainer}>
                <FlatList
                    horizontal
                    data={QUICK_MESSAGES}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.quickMessageChip}
                            onPress={() => sendMessage(item)}
                        >
                            <Text style={styles.quickMessageText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickMessagesList}
                />
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Écrivez un message..."
                    placeholderTextColor={COLORS.gray600}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={() => sendMessage(inputText)}
                    disabled={!inputText.trim()}
                >
                    <LinearGradient
                        colors={inputText.trim() ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray100, COLORS.gray100]}
                        style={styles.sendGradient}
                    >
                        <Text style={{ fontSize: 20, color: inputText.trim() ? COLORS.white : COLORS.gray600 }}>📤</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passengerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
    passengerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
    passengerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    passengerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    callBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Messages
    messagesList: { padding: 16, paddingBottom: 8 },
    messageRow: { marginBottom: 12 },
    messageRowDriver: { alignItems: 'flex-end' },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
    driverBubble: { backgroundColor: COLORS.secondary, borderBottomRightRadius: 4 },
    passengerBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 14, lineHeight: 20 },
    driverText: { color: COLORS.white },
    passengerText: { color: COLORS.black },
    messageTime: { fontSize: 10, marginTop: 4 },
    driverTime: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
    passengerTime: { color: COLORS.gray600 },

    // Quick messages
    quickMessagesContainer: { borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.white },
    quickMessagesList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    quickMessageChip: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    quickMessageText: { fontSize: 12, color: COLORS.black },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.gray50,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
        color: COLORS.black,
    },
    sendBtn: {},
    sendBtnDisabled: {},
    sendGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
