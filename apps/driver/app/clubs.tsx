// =============================================
// TRANSIGO DRIVER - CLUBS & SOCIAL
// Clubs de chauffeurs, chat, entraide
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    social: '#673AB7',
    socialDark: '#512DA8',
};

import { useDriverPremiumsStore, Club } from '../src/stores/driverPremiumsStore';

// Messages récents (Mock for now)
const RECENT_MESSAGES = [
    { id: 'm1', sender: 'Kofi A.', avatar: '👨🏾', message: 'Attention contrôle police à Riviera 2', time: '2 min', club: 'Les Experts Cocody' },
    { id: 'm2', sender: 'Mamadou S.', avatar: '👨🏿', message: 'Qui est dispo pour un colis Plateau → Cocody ?', time: '8 min', club: 'Les Experts Cocody' },
    { id: 'm3', sender: 'Ibrahim K.', avatar: '👨🏾', message: 'Vol Emirates arrivé, 50 passagers', time: '15 min', club: 'Aéroport Masters' },
];

// Parrainage
const REFERRAL = {
    code: 'MOUSSA2024',
    referrals: 5,
    earnings: 25000,
    pending: 2,
};

export default function ClubsScreen() {
    const [activeTab, setActiveTab] = useState<'clubs' | 'messages' | 'referral'>('clubs');
    const [searchQuery, setSearchQuery] = useState('');

    const { joinedClubs, availableClubs, joinClub } = useDriverPremiumsStore();

    const myClubs = joinedClubs;
    const suggestedClubs = availableClubs;

    const handleJoin = (club: Club) => {
        joinClub(club);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.social, COLORS.socialDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>👥 Communauté</Text>
                    <Text style={styles.headerSubtitle}>Rejoignez des clubs, partagez, gagnez</Text>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'clubs' && styles.tabActive]}
                    onPress={() => setActiveTab('clubs')}
                >
                    <Text style={[styles.tabText, activeTab === 'clubs' && styles.tabTextActive]}>🏘️ Clubs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>💬 Messages</Text>
                    {RECENT_MESSAGES.length > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{RECENT_MESSAGES.length}</Text></View>}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'referral' && styles.tabActive]}
                    onPress={() => setActiveTab('referral')}
                >
                    <Text style={[styles.tabText, activeTab === 'referral' && styles.tabTextActive]}>🎁 Parrainage</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'clubs' && (
                    <>
                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Text style={{ fontSize: 20, color: COLORS.gray600 }}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un club..."
                                placeholderTextColor={COLORS.gray600}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* My clubs */}
                        <Text style={styles.sectionTitle}>Mes clubs ({myClubs.length})</Text>
                        {myClubs.map((club) => (
                            <TouchableOpacity key={club.id} style={styles.clubCard}>
                                <View style={styles.clubAvatar}>
                                    <Text style={styles.clubAvatarText}>{club.avatar}</Text>
                                </View>
                                <View style={styles.clubInfo}>
                                    <Text style={styles.clubName}>{club.name}</Text>
                                    <Text style={styles.clubZone}>📍 {club.zone} • {club.members} membres</Text>
                                    {club.lastMessage && (
                                        <Text style={styles.clubLastMessage} numberOfLines={1}>{club.lastMessage}</Text>
                                    )}
                                </View>
                                <View style={styles.clubMeta}>
                                    <Text style={styles.clubTime}>{club.lastMessageTime}</Text>
                                    {club.unread > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{club.unread}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* Suggested clubs */}
                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Clubs suggérés</Text>
                        {suggestedClubs.map((club) => (
                            <View key={club.id} style={styles.clubCard}>
                                <View style={styles.clubAvatar}>
                                    <Text style={styles.clubAvatarText}>{club.avatar}</Text>
                                </View>
                                <View style={styles.clubInfo}>
                                    <Text style={styles.clubName}>{club.name}</Text>
                                    <Text style={styles.clubZone}>📍 {club.zone} • {club.members} membres</Text>
                                    <Text style={styles.clubDesc}>{club.description}</Text>
                                </View>
                                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(club)}>
                                    <Text style={styles.joinBtnText}>Rejoindre</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Create club */}
                        <TouchableOpacity style={styles.createClubBtn}>
                            <Text style={{ fontSize: 24, color: COLORS.social }}>➕</Text>
                            <Text style={styles.createClubText}>Créer un nouveau club</Text>
                        </TouchableOpacity>
                    </>
                )}

                {activeTab === 'messages' && (
                    <>
                        <Text style={styles.sectionTitle}>Messages récents</Text>
                        {RECENT_MESSAGES.map((msg) => (
                            <View key={msg.id} style={styles.messageCard}>
                                <View style={styles.messageAvatar}>
                                    <Text style={styles.messageAvatarText}>{msg.avatar}</Text>
                                </View>
                                <View style={styles.messageContent}>
                                    <View style={styles.messageHeader}>
                                        <Text style={styles.messageSender}>{msg.sender}</Text>
                                        <Text style={styles.messageTime}>{msg.time}</Text>
                                    </View>
                                    <Text style={styles.messageText}>{msg.message}</Text>
                                    <Text style={styles.messageClub}>Dans {msg.club}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Quick actions */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.quickAction}>
                                <Text style={styles.quickActionIcon}>🚧</Text>
                                <Text style={styles.quickActionText}>Signaler embouteillage</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction}>
                                <Text style={styles.quickActionIcon}>👮</Text>
                                <Text style={styles.quickActionText}>Signaler contrôle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction}>
                                <Text style={styles.quickActionIcon}>⛽</Text>
                                <Text style={styles.quickActionText}>Prix carburant</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {activeTab === 'referral' && (
                    <>
                        {/* Referral card */}
                        <View style={styles.referralCard}>
                            <LinearGradient colors={[COLORS.social, COLORS.socialDark]} style={styles.referralGradient}>
                                <Text style={styles.referralTitle}>🎁 Parrainez & Gagnez</Text>
                                <Text style={styles.referralDesc}>Invitez un chauffeur et gagnez 5000 F chacun !</Text>

                                <View style={styles.referralCodeBox}>
                                    <Text style={styles.referralCodeLabel}>Votre code</Text>
                                    <Text style={styles.referralCode}>{REFERRAL.code}</Text>
                                </View>

                                <TouchableOpacity style={styles.shareBtn}>
                                    <Text style={{ fontSize: 20, color: COLORS.social }}>📤</Text>
                                    <Text style={styles.shareBtnText}>Partager le code</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>

                        {/* Stats */}
                        <View style={styles.referralStats}>
                            <View style={styles.referralStat}>
                                <Text style={styles.referralStatValue}>{REFERRAL.referrals}</Text>
                                <Text style={styles.referralStatLabel}>Parrainés</Text>
                            </View>
                            <View style={styles.referralStat}>
                                <Text style={styles.referralStatValue}>{REFERRAL.earnings.toLocaleString('fr-FR')} F</Text>
                                <Text style={styles.referralStatLabel}>Gains totaux</Text>
                            </View>
                            <View style={styles.referralStat}>
                                <Text style={styles.referralStatValue}>{REFERRAL.pending}</Text>
                                <Text style={styles.referralStatLabel}>En attente</Text>
                            </View>
                        </View>

                        {/* How it works */}
                        <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
                        <View style={styles.howItWorks}>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                                <Text style={styles.stepText}>Partagez votre code avec un chauffeur</Text>
                            </View>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                                <Text style={styles.stepText}>Il s'inscrit avec votre code</Text>
                            </View>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                                <Text style={styles.stepText}>Il fait 10 courses</Text>
                            </View>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                                <Text style={styles.stepText}>Vous recevez 5000 F chacun ! 🎉</Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerContent: {},
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    tabs: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: -16, borderRadius: 16, padding: 4, elevation: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 4 },
    tabActive: { backgroundColor: COLORS.social },
    tabText: { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
    tabTextActive: { color: COLORS.white },
    tabBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
    tabBadgeText: { fontSize: 9, fontWeight: 'bold', color: COLORS.white },

    content: { padding: 16 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 14 },

    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

    clubCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10 },
    clubAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.social + '20', justifyContent: 'center', alignItems: 'center' },
    clubAvatarText: { fontSize: 24 },
    clubInfo: { flex: 1, marginLeft: 12 },
    clubName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    clubZone: { fontSize: 11, color: COLORS.gray600, marginTop: 2 },
    clubLastMessage: { fontSize: 12, color: COLORS.black, marginTop: 4 },
    clubDesc: { fontSize: 11, color: COLORS.gray600, marginTop: 2, fontStyle: 'italic' },
    clubMeta: { alignItems: 'flex-end' },
    clubTime: { fontSize: 11, color: COLORS.gray600 },
    unreadBadge: { backgroundColor: COLORS.social, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    unreadText: { fontSize: 11, fontWeight: 'bold', color: COLORS.white },
    joinBtn: { backgroundColor: COLORS.social, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    joinBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.white },

    createClubBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, borderWidth: 2, borderColor: COLORS.social, borderRadius: 16, borderStyle: 'dashed', marginTop: 12 },
    createClubText: { fontSize: 14, fontWeight: '600', color: COLORS.social },

    messageCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10 },
    messageAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
    messageAvatarText: { fontSize: 20 },
    messageContent: { flex: 1, marginLeft: 12 },
    messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    messageSender: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    messageTime: { fontSize: 11, color: COLORS.gray600 },
    messageText: { fontSize: 13, color: COLORS.black, marginTop: 4 },
    messageClub: { fontSize: 11, color: COLORS.social, marginTop: 4 },

    quickActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    quickAction: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center' },
    quickActionIcon: { fontSize: 24, marginBottom: 6 },
    quickActionText: { fontSize: 10, color: COLORS.black, textAlign: 'center' },

    referralCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
    referralGradient: { padding: 24, alignItems: 'center' },
    referralTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    referralDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center' },
    referralCodeBox: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 30, paddingVertical: 16, marginTop: 20 },
    referralCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    referralCode: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', marginTop: 4 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20, gap: 8 },
    shareBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.social },

    referralStats: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 20 },
    referralStat: { flex: 1, alignItems: 'center' },
    referralStatValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.social },
    referralStatLabel: { fontSize: 11, color: COLORS.gray600, marginTop: 2 },

    howItWorks: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
    step: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.social, justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    stepText: { flex: 1, fontSize: 13, color: COLORS.black, marginLeft: 12 },
});
