// =============================================
// TRANSIGO DRIVER - OBJECTIFS & BONUS
// Défis journaliers et bonus du chauffeur
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
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

// Objectifs journaliers
const DAILY_OBJECTIVES = [
    {
        id: 'o1',
        title: 'Compléter 10 courses',
        progress: 7,
        target: 10,
        reward: 3000,
        icon: '🚗',
        completed: false,
    },
    {
        id: 'o2',
        title: 'Atteindre 50 000 F',
        progress: 45000,
        target: 50000,
        reward: 2000,
        icon: '💰',
        completed: false,
    },
    {
        id: 'o3',
        title: 'Rester en ligne 8h',
        progress: 6.5,
        target: 8,
        reward: 1500,
        icon: '⏱️',
        completed: false,
    },
    {
        id: 'o4',
        title: 'Maintenir 95% acceptation',
        progress: 94,
        target: 95,
        reward: 1000,
        icon: '✅',
        completed: false,
    },
];

// Bonus actifs
const ACTIVE_BONUSES = [
    {
        id: 'b1',
        title: 'Bonus Heure de Pointe',
        description: '+500 F par course',
        time: '17h - 20h',
        active: true,
        color: '#FF9800',
    },
    {
        id: 'b2',
        title: 'Bonus Aéroport',
        description: '+1000 F par course',
        time: 'Toute la journée',
        active: true,
        color: '#2196F3',
    },
    {
        id: 'b3',
        title: 'Bonus Week-end',
        description: '+300 F par course',
        time: 'Sam-Dim',
        active: false,
        color: '#9C27B0',
    },
];

// Niveaux
const LEVELS = [
    { name: 'Bronze', minRides: 0, commission: 15, color: '#CD7F32' },
    { name: 'Argent', minRides: 100, commission: 12, color: '#C0C0C0' },
    { name: 'Or', minRides: 300, commission: 10, color: '#FFD700' },
    { name: 'Platine', minRides: 500, commission: 8, color: '#E5E4E2' },
    { name: 'Diamant', minRides: 1000, commission: 5, color: '#B9F2FF' },
];

export default function DriverObjectivesScreen() {
    const currentRides = 324;
    const currentLevel = LEVELS.find((l, i) =>
        currentRides >= l.minRides && (i === LEVELS.length - 1 || currentRides < LEVELS[i + 1].minRides)
    ) || LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];

    const totalPotentialReward = DAILY_OBJECTIVES.reduce((sum, o) => sum + o.reward, 0);
    const earnedReward = DAILY_OBJECTIVES.filter(o => o.completed).reduce((sum, o) => sum + o.reward, 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.primary, '#E65100']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🎯 Objectifs du Jour</Text>
                    <Text style={styles.headerSubtitle}>
                        Gagnez jusqu'à {totalPotentialReward.toLocaleString('fr-FR')} F de bonus !
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Niveau actuel */}
                <View style={[styles.levelCard, { borderColor: currentLevel.color }]}>
                    <View style={[styles.levelBadge, { backgroundColor: currentLevel.color }]}>
                        <Text style={styles.levelBadgeText}>
                            {currentLevel.name === 'Or' ? '🥇' : currentLevel.name === 'Argent' ? '🥈' : '🥉'}
                        </Text>
                    </View>
                    <View style={styles.levelInfo}>
                        <Text style={styles.levelTitle}>Niveau {currentLevel.name}</Text>
                        <Text style={styles.levelCommission}>Commission: {currentLevel.commission}%</Text>
                    </View>
                    {nextLevel && (
                        <View style={styles.levelProgress}>
                            <Text style={styles.levelProgressText}>
                                {currentRides}/{nextLevel.minRides}
                            </Text>
                            <Text style={styles.levelNextText}>→ {nextLevel.name}</Text>
                        </View>
                    )}
                </View>

                {/* Objectifs */}
                <Text style={styles.sectionTitle}>📋 Objectifs Journaliers</Text>

                {DAILY_OBJECTIVES.map((objective) => {
                    const progress = typeof objective.progress === 'number' && objective.progress >= 1000
                        ? (objective.progress / objective.target) * 100
                        : (objective.progress / objective.target) * 100;
                    const isCompleted = progress >= 100;

                    return (
                        <View key={objective.id} style={styles.objectiveCard}>
                            <View style={styles.objectiveIcon}>
                                <Text style={styles.objectiveIconText}>{objective.icon}</Text>
                            </View>
                            <View style={styles.objectiveContent}>
                                <Text style={styles.objectiveTitle}>{objective.title}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[
                                        styles.progressFill,
                                        { width: `${Math.min(progress, 100)}%`, backgroundColor: isCompleted ? COLORS.secondary : COLORS.primary }
                                    ]} />
                                </View>
                                <Text style={styles.progressText}>
                                    {typeof objective.progress === 'number' && objective.progress >= 1000
                                        ? `${objective.progress.toLocaleString('fr-FR')} / ${objective.target.toLocaleString('fr-FR')}`
                                        : `${objective.progress} / ${objective.target}`
                                    }
                                </Text>
                            </View>
                            <View style={styles.rewardContainer}>
                                {isCompleted ? (
                                    <View style={styles.completedBadge}>
                                        <Text style={styles.completedText}>✅</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.rewardText}>+{objective.reward.toLocaleString('fr-FR')} F</Text>
                                )}
                            </View>
                        </View>
                    );
                })}

                {/* Bonus actifs */}
                <Text style={styles.sectionTitle}>🎁 Bonus Actifs</Text>

                {ACTIVE_BONUSES.map((bonus) => (
                    <View key={bonus.id} style={[styles.bonusCard, !bonus.active && styles.bonusInactive]}>
                        <View style={[styles.bonusIndicator, { backgroundColor: bonus.active ? bonus.color : COLORS.gray600 }]} />
                        <View style={styles.bonusContent}>
                            <Text style={[styles.bonusTitle, !bonus.active && styles.bonusTitleInactive]}>
                                {bonus.title}
                            </Text>
                            <Text style={styles.bonusDescription}>{bonus.description}</Text>
                            <Text style={styles.bonusTime}>⏰ {bonus.time}</Text>
                        </View>
                        <View style={[styles.bonusStatus, { backgroundColor: bonus.active ? COLORS.secondary + '20' : COLORS.gray100 }]}>
                            <Text style={[styles.bonusStatusText, { color: bonus.active ? COLORS.secondary : COLORS.gray600 }]}>
                                {bonus.active ? 'ACTIF' : 'INACTIF'}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Conseils */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Conseils pour gagner plus</Text>
                    <Text style={styles.tipItem}>• Restez près des zones à forte demande (Plateau, Cocody)</Text>
                    <Text style={styles.tipItem}>• Soyez en ligne pendant les heures de pointe</Text>
                    <Text style={styles.tipItem}>• Maintenez un taux d'acceptation élevé</Text>
                    <Text style={styles.tipItem}>• Offrez un excellent service pour des pourboires</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerContent: {},
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: 16 },

    // Level
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 20,
    },
    levelBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadgeText: { fontSize: 24 },
    levelInfo: { flex: 1, marginLeft: 12 },
    levelTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    levelCommission: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },
    levelProgress: { alignItems: 'flex-end' },
    levelProgressText: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    levelNextText: { fontSize: 11, color: COLORS.gray600 },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

    // Objective
    objectiveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
    },
    objectiveIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    objectiveIconText: { fontSize: 20 },
    objectiveContent: { flex: 1, marginLeft: 12 },
    objectiveTitle: { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    progressBar: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 11, color: COLORS.gray600, marginTop: 4 },
    rewardContainer: { marginLeft: 12 },
    rewardText: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
    completedBadge: {},
    completedText: { fontSize: 24 },

    // Bonus
    bonusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
    },
    bonusInactive: { opacity: 0.6 },
    bonusIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
    bonusContent: { flex: 1 },
    bonusTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    bonusTitleInactive: { color: COLORS.gray600 },
    bonusDescription: { fontSize: 13, color: COLORS.black, marginTop: 2 },
    bonusTime: { fontSize: 11, color: COLORS.gray600, marginTop: 4 },
    bonusStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    bonusStatusText: { fontSize: 10, fontWeight: 'bold' },

    // Tips
    tipsCard: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
    },
    tipsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
    tipItem: { fontSize: 12, color: COLORS.gray600, marginBottom: 4, lineHeight: 18 },
});
