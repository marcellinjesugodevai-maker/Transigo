// =============================================
// TRANSIGO DRIVER - LEADERBOARD & GAMIFICATION
// Classement, badges, achievements, XP
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { rideService } from '../src/services/supabaseService';
import { useDriverStore } from '../src/stores/driverStore';
import { useProfileTerms } from '../src/hooks/useProfileTerms';

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
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
};

import { useDriverPremiumsStore } from '../src/stores/driverPremiumsStore';

// Leaderboard data (Mock pour les autres utilisateurs)
const MOCK_LEADERBOARD_OTHERS = [
    { rank: 1, name: 'Mamadou K.', earnings: 2850000, rides: 412, rating: 4.98, avatar: '👨🏾', streak: 45, isCurrentUser: false },
    { rank: 2, name: 'Ibrahim T.', earnings: 2650000, rides: 398, rating: 4.95, avatar: '👨🏿', streak: 32, isCurrentUser: false },
    { rank: 3, name: 'Kofi A.', earnings: 2480000, rides: 376, rating: 4.92, avatar: '👨🏾', streak: 28, isCurrentUser: false },
    { rank: 4, name: 'Jean-Baptiste M.', earnings: 2320000, rides: 354, rating: 4.91, avatar: '👨🏿', streak: 21, isCurrentUser: false },
    // Rank 5 is Current User
    { rank: 6, name: 'Ousmane D.', earnings: 1980000, rides: 298, rating: 4.88, avatar: '👨🏾', streak: 15, isCurrentUser: false },
    { rank: 7, name: 'Amadou S.', earnings: 1850000, rides: 276, rating: 4.85, avatar: '👨🏿', streak: 12, isCurrentUser: false },
    { rank: 8, name: 'François L.', earnings: 1720000, rides: 254, rating: 4.82, avatar: '👨🏾', streak: 9, isCurrentUser: false },
];

// Badges - Will be synced from Supabase later
const BADGES: any[] = []; // Empty - no mock data

export default function LeaderboardScreen() {
    const { driver } = useDriverStore();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'challenges'>('leaderboard');
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const { xp, level, streakDays, activeChallenges, fetchData } = useDriverPremiumsStore();

    useEffect(() => {
        fetchData();
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        setLoading(true);
        const { leaderboard: data, error } = await rideService.getLeaderboard();
        if (data) {
            // Mapping real data to UI format
            const mapped = data.map((d: any, i: number) => ({
                rank: i + 1,
                name: `${d.first_name} ${d.last_name.charAt(0)}.`,
                earnings: d.wallet_balance || 0,
                rides: d.total_rides || 0,
                rating: d.rating || 5.0,
                avatar: d.profile_type === 'delivery' ? (i % 2 === 0 ? '🛵' : '🚲') : (i % 2 === 0 ? '👨🏾' : '👨🏿'),
                streak: Math.floor(Math.random() * 20) + 1, // Streak still simulated or needs field in DB
                isCurrentUser: d.id === driver?.id
            }));
            setLeaderboard(mapped);
        }
        setLoading(false);
    };

    const currentUser = leaderboard.find(u => u.isCurrentUser) || {
        rank: '?',
        name: `${driver?.firstName} ${driver?.lastName?.charAt(0)}. (Vous)`,
        earnings: 0,
        rides: 0,
        rating: 5.0,
        avatar: driver?.profileType === 'delivery' ? '🛵' : '👨🏾',
        streak: streakDays,
        isCurrentUser: true
    };

    const LEADERBOARD_DISPLAY = leaderboard.length > 0 ? leaderboard : [];

    const userXP = xp;
    const nextLevelXP = level * 1000;
    const currentLevel = level;

    const getRankColor = (rank: number) => {
        if (rank === 1) return COLORS.gold;
        if (rank === 2) return COLORS.silver;
        if (rank === 3) return COLORS.bronze;
        return COLORS.gray600;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `${rank}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header with XP */}
            <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🏆 Classement & Badges</Text>

                    {/* XP Bar */}
                    <View style={styles.xpContainer}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>Nv.{currentLevel}</Text>
                        </View>
                        <View style={styles.xpBarContainer}>
                            <View style={[styles.xpBar, { width: `${(userXP / nextLevelXP) * 100}%` }]} />
                        </View>
                        <Text style={styles.xpText}>{userXP.toLocaleString('fr-FR')} / {nextLevelXP.toLocaleString('fr-FR')} XP</Text>
                    </View>

                    {/* Streak */}
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakIcon}>🔥</Text>
                        <Text style={styles.streakText}>{currentUser?.streak} jours consécutifs</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
                    onPress={() => setActiveTab('leaderboard')}
                >
                    <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>🏅 Classement</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
                    onPress={() => setActiveTab('badges')}
                >
                    <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>🎖️ Badges</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
                    onPress={() => setActiveTab('challenges')}
                >
                    <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>🎯 Défis</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'leaderboard' && (
                    <>
                        {loading ? (
                            <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                        ) : leaderboard.length >= 3 ? (
                            <>
                                {/* Top 3 Podium */}
                                <View style={styles.podium}>
                                    {/* 2nd */}
                                    <View style={styles.podiumItem}>
                                        <Text style={styles.podiumAvatar}>{leaderboard[1].avatar}</Text>
                                        <View style={[styles.podiumBar as any, styles.podiumSecond]}>
                                            <Text style={styles.podiumRank}>🥈</Text>
                                        </View>
                                        <Text style={styles.podiumName}>{leaderboard[1].name.split(' ')[0]}</Text>
                                        <Text style={styles.podiumEarnings}>{leaderboard[1].rides} courses</Text>
                                    </View>
                                    {/* 1st */}
                                    <View style={styles.podiumItem}>
                                        <Text style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>{leaderboard[0].avatar}</Text>
                                        <View style={[styles.podiumBar as any, styles.podiumFirst]}>
                                            <Text style={styles.podiumRank}>🥇</Text>
                                        </View>
                                        <Text style={styles.podiumName}>{leaderboard[0].name.split(' ')[0]}</Text>
                                        <Text style={styles.podiumEarnings}>{leaderboard[0].rides} courses</Text>
                                    </View>
                                    {/* 3rd */}
                                    <View style={styles.podiumItem}>
                                        <Text style={styles.podiumAvatar}>{leaderboard[2].avatar}</Text>
                                        <View style={[styles.podiumBar as any, styles.podiumThird]}>
                                            <Text style={styles.podiumRank}>🥉</Text>
                                        </View>
                                        <Text style={styles.podiumName}>{leaderboard[2].name.split(' ')[0]}</Text>
                                        <Text style={styles.podiumEarnings}>{leaderboard[2].rides} courses</Text>
                                    </View>
                                </View>

                                {/* Leaderboard list */}
                                <View style={styles.leaderboardList}>
                                    {leaderboard.slice(3).map((user) => (
                                        <View key={user.rank} style={[styles.leaderboardItem, user.isCurrentUser && styles.leaderboardItemCurrent]}>
                                            <Text style={[styles.rankText, { color: getRankColor(user.rank) }]}>{getRankIcon(user.rank)}</Text>
                                            <Text style={styles.userAvatar}>{user.avatar}</Text>
                                            <View style={styles.userInfo}>
                                                <Text style={[styles.userName, user.isCurrentUser && styles.userNameCurrent]}>{user.name}</Text>
                                                <View style={styles.userStats}>
                                                    <Text style={styles.userStat}>🚗 {user.rides}</Text>
                                                    <Text style={styles.userStat}>⭐ {user.rating}</Text>
                                                    <Text style={styles.userStat}>🔥 {user.streak}j</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.userEarnings}>{user.earnings.toLocaleString()} F</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text>Pas assez de participants pour le podium</Text>
                            </View>
                        )}
                    </>
                )}

                {activeTab === 'badges' && (
                    <View style={styles.badgesGrid}>
                        {BADGES.length === 0 ? (
                            <View style={{ alignItems: 'center', paddingVertical: 60, width: '100%' }}>
                                <Text style={{ fontSize: 64, marginBottom: 16 }}>🎖️</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 }}>Badges à venir</Text>
                                <Text style={{ fontSize: 14, color: COLORS.gray600, textAlign: 'center', paddingHorizontal: 32 }}>
                                    Le système de badges sera bientôt disponible. Complétez des livraisons pour débloquer des récompenses !
                                </Text>
                            </View>
                        ) : (
                            BADGES.map((badge) => (
                                <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}>
                                    <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>{badge.icon}</Text>
                                    <Text style={styles.badgeName}>{badge.name}</Text>
                                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                                    {badge.unlocked ? (
                                        <Text style={styles.badgeDate}>✅ {badge.date}</Text>
                                    ) : (
                                        <View style={styles.badgeProgress}>
                                            <View style={[styles.badgeProgressFill, { width: `${(badge.progress! / (badge.id === 'b8' ? 500 : badge.id === 'b9' ? 1000000 : 30)) * 100}%` }]} />
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'challenges' && (
                    <View style={styles.challengesList}>
                        {activeChallenges.map((challenge) => (
                            <View key={challenge.id} style={styles.challengeCard}>
                                <View style={styles.challengeHeader}>
                                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                    <View style={styles.challengeReward}>
                                        <Text style={styles.challengeRewardText}>+{challenge.reward.toLocaleString('fr-FR')} F</Text>
                                    </View>
                                </View>
                                <Text style={styles.challengeDesc}>{challenge.description}</Text>
                                <View style={styles.challengeProgressBar}>
                                    <View style={[styles.challengeProgressFill, { width: `${(challenge.current / challenge.target) * 100}%` }]} />
                                </View>
                                <View style={styles.challengeFooter}>
                                    <Text style={styles.challengeProgressText}>{challenge.current} / {challenge.target}</Text>
                                    <Text style={styles.challengeEnds}>⏰ {challenge.expiresIn}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Bonus streak */}
                        <View style={styles.streakBonusCard}>
                            <LinearGradient colors={['#FF6B00', '#FF8F00']} style={styles.streakBonusGradient}>
                                <Text style={styles.streakBonusIcon}>🔥</Text>
                                <View style={styles.streakBonusContent}>
                                    <Text style={styles.streakBonusTitle}>Bonus Streak x{currentUser?.streak}</Text>
                                    <Text style={styles.streakBonusDesc}>+{(currentUser?.streak || 0) * 50} F par course</Text>
                                </View>
                                <Text style={styles.streakBonusValue}>+{((currentUser?.streak || 0) * 50 * 10).toLocaleString('fr-FR')} F/jour</Text>
                            </LinearGradient>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerContent: {},
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white, marginBottom: 16 },
    xpContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    levelBadge: { backgroundColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    levelText: { fontSize: 12, fontWeight: 'bold', color: COLORS.black },
    xpBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
    xpBar: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 4 },
    xpText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    streakContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
    streakIcon: { fontSize: 20 },
    streakText: { fontSize: 14, color: COLORS.white },

    // Tabs
    tabs: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: -16, borderRadius: 16, padding: 4, elevation: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    tabActive: { backgroundColor: '#9C27B0' },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    tabTextActive: { color: COLORS.white },

    content: { padding: 16 },

    // Podium
    podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 20, paddingTop: 20 },
    podiumItem: { alignItems: 'center', marginHorizontal: 8 },
    podiumAvatar: { fontSize: 32, marginBottom: 4 },
    podiumAvatarFirst: { fontSize: 40 },
    podiumBar: { width: 60, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    podiumFirst: { height: 100, backgroundColor: COLORS.gold },
    podiumSecond: { height: 75, backgroundColor: COLORS.silver },
    podiumThird: { height: 55, backgroundColor: COLORS.bronze },
    podiumRank: { fontSize: 24 },
    podiumName: { fontSize: 12, fontWeight: '600', color: COLORS.black, marginTop: 4 },
    podiumEarnings: { fontSize: 11, color: COLORS.secondary, fontWeight: 'bold' },

    // Leaderboard
    leaderboardList: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    leaderboardItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    leaderboardItemCurrent: { backgroundColor: '#E8F5E9' },
    rankText: { fontSize: 18, fontWeight: 'bold', width: 30 },
    userAvatar: { fontSize: 28, marginRight: 10 },
    userInfo: { flex: 1 },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    userNameCurrent: { color: COLORS.secondary },
    userStats: { flexDirection: 'row', gap: 10, marginTop: 2 },
    userStat: { fontSize: 11, color: COLORS.gray600 },
    userEarnings: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },

    // Badges
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badgeCard: { width: (width - 56) / 3, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, alignItems: 'center' },
    badgeCardLocked: { opacity: 0.6, backgroundColor: COLORS.gray100 },
    badgeIcon: { fontSize: 32, marginBottom: 6 },
    badgeIconLocked: { opacity: 0.5 },
    badgeName: { fontSize: 11, fontWeight: 'bold', color: COLORS.black, textAlign: 'center' },
    badgeDesc: { fontSize: 9, color: COLORS.gray600, textAlign: 'center', marginTop: 2 },
    badgeDate: { fontSize: 9, color: COLORS.secondary, marginTop: 4 },
    badgeProgress: { width: '100%', height: 4, backgroundColor: COLORS.gray100, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
    badgeProgressFill: { height: '100%', backgroundColor: '#9C27B0', borderRadius: 2 },

    // Challenges
    challengesList: { gap: 12 },
    challengeCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
    challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    challengeTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
    challengeReward: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    challengeRewardText: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary },
    challengeDesc: { fontSize: 12, color: COLORS.gray600, marginBottom: 10 },
    challengeProgressBar: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
    challengeProgressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 4 },
    challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    challengeProgressText: { fontSize: 12, fontWeight: '600', color: COLORS.black },
    challengeEnds: { fontSize: 11, color: COLORS.primary },

    // Streak bonus
    streakBonusCard: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    streakBonusGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    streakBonusIcon: { fontSize: 40 },
    streakBonusContent: { flex: 1, marginLeft: 12 },
    streakBonusTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    streakBonusDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
    streakBonusValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
});

