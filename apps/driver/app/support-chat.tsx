// =============================================
// TRANSIGO DRIVER - SUPPORT CHAT
// Discussion directe avec les administrateurs
// =============================================

import { useState, useEffect, useRef } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../src/stores/driverStore';
import { supportService, ChatMessage } from '../src/services/supportService';
import { supabase } from '../src/services/supabaseService';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    adminParams: '#E8F5E9',
};

export default function SupportChatScreen() {
    const router = useRouter();
    const { driver } = useDriverStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        initChat();
    }, []);

    const initChat = async () => {
        if (!driver?.id) return;

        setLoading(true);
        // 1. Get or Create Conversation
        const { conversation } = await supportService.getOrCreateConversation(driver.id);

        if (conversation) {
            setConversationId(conversation.id);

            // 2. Load Messages
            const { messages: msgs } = await supportService.getMessages(conversation.id);
            if (msgs) setMessages(msgs);

            // 3. Subscribe to Realtime Updates
            const channel = supabase
                .channel(`support-chat-${conversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversation.id}`
                }, (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    setMessages(prev => [...prev, newMsg]);

                    // Mark as read if from admin
                    if (newMsg.sender_type === 'admin') {
                        supportService.markAsRead(conversation.id);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !conversationId || !driver?.id) return;

        const text = inputText.trim();
        setInputText('');

        // Optimistic UI update (optional, but Supabase Realtime is fast enough generally)
        // Leaving it to Realtime to avoid dupes or double handling

        await supportService.sendMessage(conversationId, driver.id, text);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.sender_type === 'driver';

        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowAdmin]}>
                {!isMe && (
                    <View style={styles.adminAvatar}>
                        <Text style={{ fontSize: 16 }}>🎧</Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMe ? styles.meBubble : styles.adminBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.meText : styles.adminText]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.meTime : styles.adminTime]}>
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

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
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Support TransiGo</Text>
                    <Text style={styles.headerSubtitle}>🟢 Disponible 24/7</Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>👋</Text>
                            <Text style={styles.emptyTitle}>Bonjour {driver?.firstName}</Text>
                            <Text style={styles.emptyText}>
                                Comment pouvons-nous vous aider aujourd'hui ?
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Posez votre question..."
                    placeholderTextColor={COLORS.gray600}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim()}
                >
                    <LinearGradient
                        colors={inputText.trim() ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray100, COLORS.gray100]}
                        style={styles.sendGradient}
                    >
                        <Text style={{ fontSize: 20 }}>➤</Text>
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
        marginRight: 15,
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    // Messages
    messagesList: { padding: 16, paddingBottom: 20 },
    messageRow: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', maxWidth: '80%' },
    messageRowMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    messageRowAdmin: { alignSelf: 'flex-start' },

    adminAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.adminParams,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
    },

    messageBubble: { padding: 12, borderRadius: 16 },
    meBubble: { backgroundColor: COLORS.secondary, borderBottomRightRadius: 4 },
    adminBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.gray100 },

    messageText: { fontSize: 14, lineHeight: 20 },
    meText: { color: COLORS.white },
    adminText: { color: COLORS.black },

    messageTime: { fontSize: 10, marginTop: 4 },
    meTime: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
    adminTime: { color: COLORS.gray600 },

    // Loading & Empty
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
    emptyText: { fontSize: 14, color: COLORS.gray600, textAlign: 'center' },

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

