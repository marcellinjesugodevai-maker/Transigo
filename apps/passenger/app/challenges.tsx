// =============================================
// TRANSIGO - DÉFIS & BADGES
// Gamification avec défis hebdo et badges
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore, useAuthStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// Défis hebdomadaires
const WEEKLY_CHALLENGES = [
    {
        id: 'c1',
        title: '5 courses cette semaine',
        titleEn: '5 rides this week',
        reward: 2000,
        progress: 3,
        target: 5,
        icon: '🚗',
        color: '#4CAF50',
    },
    {
        id: 'c2',
        title: 'Commander 3 repas',
        titleEn: 'Order 3 meals',
        reward: 1500,
        progress: 1,
        target: 3,
        icon: '🍔',
        color: '#FF9800',
    },
    {
        id: 'c3',
        title: 'Partager TransiGo',
        titleEn: 'Share TransiGo',
        reward: 500,
        progress: 0,
        target: 1,
        icon: '📤',
        color: '#2196F3',
    },
    {
        id: 'c4',
        title: 'Note 5 étoiles à un chauffeur',
        titleEn: 'Rate a driver 5 stars',
        reward: 300,
        progress: 1,
        target: 1,
        icon: '⭐',
        color: '#FFD700',
        completed: true,
    },
];

// Badges disponibles
const BADGES = [
    { id: 'b1', name: 'Voyageur Débutant', nameEn: 'Beginner Traveler', icon: '🎒', unlocked: true, requirement: '1ère course', color: '#9E9E9E' },
    { id: 'b2', name: 'Voyageur Régulier', nameEn: 'Regular Traveler', icon: '🚗', unlocked: true, requirement: '10 courses', color: '#4CAF50' },
    { id: 'b3', name: 'Voyageur Expert', nameEn: 'Expert Traveler', icon: '🏆', unlocked: false, requirement: '50 courses', color: '#FF9800' },
    { id: 'b4', name: 'Voyageur Nocturne', nameEn: 'Night Traveler', icon: '🌙', unlocked: true, requirement: 'Course après 22h', color: '#673AB7' },
    { id: 'b5', name: 'Gourmet', nameEn: 'Gourmet', icon: '🍽️', unlocked: true, requirement: '5 commandes Food', color: '#E91E63' },
    { id: 'b6', name: 'Eco-Warrior', nameEn: 'Eco-Warrior', icon: '🌱', unlocked: false, requirement: '10 courses Moto', color: '#4CAF50' },
    { id: 'b7', name: 'Généreux', nameEn: 'Generous', icon: '💝', unlocked: false, requirement: 'Offrir un repas', color: '#E91E63' },
    { id: 'b8', name: 'Parrain Gold', nameEn: 'Gold Referrer', icon: '👑', unlocked: false, requirement: '5 parrainages', color: '#FFD700' },
    { id: 'b9', name: 'VIP', nameEn: 'VIP', icon: '💎', unlocked: false, requirement: '100 courses', color: '#2196F3' },
];

// Classement
const LEADERBOARD = [
    { rank: 1, name: 'Kouamé A.', points: 12500, avatar: '👨🏾' },
    { rank: 2, name: 'Fatou S.', points: 11200, avatar: '👩🏾' },
    { rank: 3, name: 'Ibrahim K.', points: 10800, avatar: '👨🏿' },
    { rank: 4, name: 'Marie T.', points: 9500, avatar: '👩🏽' },
    { rank: 5, name: 'Jean P.', points: 8900, avatar: '👨🏽' },
];

export default function ChallengesScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const { user } = useAuthStore();
    const t = (key: any) => getTranslation(key, language);

    const [selectedTab, setSelectedTab] = useState('challenges');

    // Stats utilisateur
    const userPoints = 4500;
    const userRank = 12;
    const unlockedBadges = BADGES.filter(b => b.unlocked).length;

    const renderChallenges = () => (
        <>
            {/* Défis en cours */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🎯 {language === 'fr' ? 'Défis de la semaine' : 'Weekly challenges'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Se termine dans 3 jours' : 'Ends in 3 days'}
            </Text>

            {WEEKLY_CHALLENGES.map((challenge) => {
                const progress = (challenge.progress / challenge.target) * 100;
                const isCompleted = challenge.progress >= challenge.target;

                return (
                    <View key={challenge.id} style={[styles.challengeCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.challengeIcon, { backgroundColor: challenge.color + '20' }]}>
                            <Text style={styles.challengeIconText}>{challenge.icon}</Text>
                        </View>
                        <View style={styles.challengeContent}>
                            <Text style={[styles.challengeTitle, { color: colors.text }]}>
                                {language === 'fr' ? challenge.title : challenge.titleEn}
                            </Text>
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: challenge.color }]} />
                                </View>
                                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                    {challenge.progress}/{challenge.target}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.rewardContainer}>
                            {isCompleted ? (
                                <View style={styles.completedBadge}>
                                    <Text style={styles.completedText}>✅</Text>
                                </View>
                            ) : (
                                <Text style={styles.rewardText}>+{challenge.reward} F</Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </>
    );

    const renderBadges = () => (
        <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🎖️ {language === 'fr' ? 'Mes badges' : 'My badges'} ({unlockedBadges}/{BADGES.length})
            </Text>

            <View style={styles.badgesGrid}>
                {BADGES.map((badge) => (
                    <View
                        key={badge.id}
                        style={[
                            styles.badgeCard,
                            { backgroundColor: colors.card },
                            !badge.unlocked && styles.badgeLocked
                        ]}
                    >
                        <View style={[
                            styles.badgeIconContainer,
                            { backgroundColor: badge.unlocked ? badge.color + '20' : '#9E9E9E20' }
                        ]}>
                            <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
                                {badge.icon}
                            </Text>
                        </View>
                        <Text style={[
                            styles.badgeName,
                            { color: badge.unlocked ? colors.text : colors.textSecondary }
                        ]} numberOfLines={2}>
                            {language === 'fr' ? badge.name : badge.nameEn}
                        </Text>
                        <Text style={[styles.badgeRequirement, { color: colors.textSecondary }]} numberOfLines={1}>
                            {badge.requirement}
                        </Text>
                        {!badge.unlocked && (
                            <View style={styles.lockIcon}>
                                <Text>🔒</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        </>
    );

    const renderLeaderboard = () => (
        <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🏆 {language === 'fr' ? 'Classement Abidjan' : 'Abidjan Ranking'}
            </Text>

            {/* Ma position */}
            <View style={[styles.myRankCard, { backgroundColor: '#673AB7' }]}>
                <Text style={styles.myRankIcon}>👤</Text>
                <View style={styles.myRankInfo}>
                    <Text style={styles.myRankName}>{user?.firstName || (language === 'fr' ? 'Vous' : 'You')}</Text>
                    <Text style={styles.myRankPoints}>{userPoints.toLocaleString('fr-FR')} pts</Text>
                </View>
                <View style={styles.myRankPosition}>
                    <Text style={styles.myRankNumber}>#{userRank}</Text>
                </View>
            </View>

            {/* Top 5 */}
            {LEADERBOARD.map((player, index) => (
                <View key={player.rank} style={[styles.leaderRow, { backgroundColor: colors.card }]}>
                    <View style={[
                        styles.rankBadge,
                        { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.background }
                    ]}>
                        <Text style={[styles.rankText, { color: index < 3 ? '#000' : colors.text }]}>
                            {player.rank}
                        </Text>
                    </View>
                    <Text style={styles.leaderAvatar}>{player.avatar}</Text>
                    <View style={styles.leaderInfo}>
                        <Text style={[styles.leaderName, { color: colors.text }]}>{player.name}</Text>
                        <Text style={[styles.leaderPoints, { color: colors.textSecondary }]}>
                            {player.points.toLocaleString('fr-FR')} pts
                        </Text>
                    </View>
                    {index === 0 && <Text style={styles.crownIcon}>👑</Text>}
                </View>
            ))}
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#9C27B0', '#7B1FA2']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🎮 {language === 'fr' ? 'Défis & Badges' : 'Challenges & Badges'}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{userPoints.toLocaleString('fr-FR')}</Text>
                        <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>#{userRank}</Text>
                        <Text style={styles.statLabel}>{language === 'fr' ? 'Rang' : 'Rank'}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{unlockedBadges}</Text>
                        <Text style={styles.statLabel}>Badges</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
                {['challenges', 'badges', 'leaderboard'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.tabActive]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: selectedTab === tab ? '#9C27B0' : colors.textSecondary }
                        ]}>
                            {tab === 'challenges' ? '🎯 ' + (language === 'fr' ? 'Défis' : 'Challenges') :
                                tab === 'badges' ? '🎖️ Badges' :
                                    '🏆 ' + (language === 'fr' ? 'Classement' : 'Ranking')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {selectedTab === 'challenges' && renderChallenges()}
                {selectedTab === 'badges' && renderBadges()}
                {selectedTab === 'leaderboard' && renderLeaderboard()}
                <View style={{ height: 40 }} />
            </ScrollView>
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
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: SPACING.md,
        marginTop: SPACING.md,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Tabs
    tabsContainer: { flexDirection: 'row', paddingVertical: SPACING.sm },
    tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#9C27B0' },
    tabText: { fontSize: 13, fontWeight: '600' },

    content: { padding: SPACING.lg },

    // Section
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, marginBottom: SPACING.md },

    // Challenge card
    challengeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.sm,
    },
    challengeIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    challengeIconText: { fontSize: 24 },
    challengeContent: { flex: 1, marginLeft: SPACING.sm },
    challengeTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 11, fontWeight: '600' },
    rewardContainer: { marginLeft: SPACING.sm },
    rewardText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
    completedBadge: {},
    completedText: { fontSize: 24 },

    // Badges grid
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    badgeCard: {
        width: (width - SPACING.lg * 2 - SPACING.sm * 2) / 3,
        padding: SPACING.sm,
        borderRadius: 16,
        alignItems: 'center',
    },
    badgeLocked: { opacity: 0.6 },
    badgeIconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    badgeIcon: { fontSize: 24 },
    badgeIconLocked: { opacity: 0.5 },
    badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
    badgeRequirement: { fontSize: 9, textAlign: 'center' },
    lockIcon: { position: 'absolute', top: 4, right: 4 },

    // Leaderboard
    myRankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    myRankIcon: { fontSize: 30 },
    myRankInfo: { flex: 1, marginLeft: SPACING.sm },
    myRankName: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    myRankPoints: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    myRankPosition: {},
    myRankNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },

    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    rankBadge: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: 'bold' },
    leaderAvatar: { fontSize: 24, marginLeft: SPACING.sm },
    leaderInfo: { flex: 1, marginLeft: SPACING.sm },
    leaderName: { fontSize: 14, fontWeight: '600' },
    leaderPoints: { fontSize: 12 },
    crownIcon: { fontSize: 20 },
});
