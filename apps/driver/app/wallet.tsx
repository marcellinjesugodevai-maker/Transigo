import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    RefreshControl,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverWalletStore, formatCFA, WalletTransaction } from '../src/stores';
import { useDriverStore } from '../src/stores/driverStore';
import { useProfileTerms } from '../src/hooks/useProfileTerms';
import { supabase, walletService } from '../src/services/supabaseService';
import { useEffect } from 'react';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    primaryDark: '#E55A00',
    secondary: '#00C853',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray100: '#F5F5F5',
    gray300: '#E0E0E0',
    gray600: '#757575',
    error: '#F44336',
    warning: '#FF9800',
    blue: '#3b82f6',
};

const TOPUP_OPTIONS = [5000, 10000, 20000, 50000];

export default function WalletScreen() {
    const { driver } = useDriverStore();
    const terms = useProfileTerms(); // Dynamic terminology
    const {
        balance,
        isBlocked,
        minimumBalance,
        commissionRate,
        transactions,
        getTotalCommissionPaid,
        getRecentTransactions,
        setWalletState // Store update comes from sync hook
    } = useDriverWalletStore();

    const [refreshing, setRefreshing] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [reference, setReference] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (driver?.id) {
            loadWalletData();
            // Real-time subscription
            const subscription = walletService.subscribeToWallet(driver.id, (newBalance) => {
                setWalletState(newBalance, newBalance < minimumBalance);
            });
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [driver?.id]);

    const loadWalletData = async () => {
        if (!driver?.id) return;
        setLoading(true);
        const data = await walletService.getWallet(driver.id);
        // We need to update the store with the fetched data
        // Since setWalletState only takes balance and isBlocked, we might need to manually set transactions if the store supports it, 
        // or just rely on the local state if the store doesn't have a setTransactions.
        // Looking at the store, it doesn't have setTransactions. I'll use local state for txs.
        setLocalTransactions(data.transactions);
        setWalletState(data.balance, data.balance < minimumBalance);
        setLoading(false);
    };

    const [localTransactions, setLocalTransactions] = useState<any[]>([]);

    const totalCommission = getTotalCommissionPaid();
    const recentTransactions = localTransactions.length > 0 ? localTransactions : getRecentTransactions(20);

    const handleTopUpRequest = (amount: number) => {
        setSelectedAmount(amount);
        setReference('');
        setShowDepositModal(true);
    };

    const submitDeposit = async () => {
        if (!reference.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir la référence de la transaction (ID Wave/Orange)');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('wallet_transactions').insert({
                driver_id: driver?.id,
                type: 'topup',
                amount: selectedAmount,
                status: 'pending',
                reference_id: reference,
                description: `Dépôt Manuel (${reference})`,
                receipt_image_url: null
            });

            if (error) throw error;

            Alert.alert(
                '⏳ Demande envoyée',
                'Votre dépôt est en cours de validation par l\'administration. Votre solde sera mis à jour dès validation.',
                [{ text: 'OK', onPress: () => setShowDepositModal(false) }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', 'Impossible d\'envoyer la demande: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadWalletData();
        setRefreshing(false);
    };

    const renderTransaction = (tx: WalletTransaction, index: number) => {
        const isTopUp = tx.type === 'topup' || tx.type === 'deposit';
        // @ts-ignore - status exists in DB but maybe not in store type yet if not updated
        const status = (tx as any).status || 'completed';
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';

        const date = tx.created_at ? new Date(tx.created_at) : new Date(tx.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <View key={tx.id} style={styles.transactionItem}>
                <View style={[
                    styles.txIcon,
                    { backgroundColor: isPending ? '#FFF3E0' : isRejected ? '#FFEBEE' : isTopUp ? '#E8F5E9' : '#EDE7F6' }
                ]}>
                    <View style={[
                        styles.txIcon,
                        { backgroundColor: isPending ? '#FFF3E0' : isRejected ? '#FFEBEE' : isTopUp ? '#E8F5E9' : '#EDE7F6' }
                    ]}>
                        <Text style={{ fontSize: 20 }}>
                            {isPending ? '⏳' : isRejected ? '❌' : isTopUp ? '⬇️' : '⬆️'}
                        </Text>
                    </View>
                </View>
                <View style={styles.txInfo}>
                    <Text style={styles.txDescription}>
                        {tx.description}
                        {isPending && <Text style={{ color: COLORS.warning, fontWeight: 'bold' }}> (En attente)</Text>}
                        {isRejected && <Text style={{ color: COLORS.error, fontWeight: 'bold' }}> (Rejeté)</Text>}
                    </Text>
                    <Text style={styles.txDate}>{formattedDate}</Text>
                </View>
                <Text style={[
                    styles.txAmount,
                    { color: isRejected ? COLORS.gray600 : isTopUp ? COLORS.secondary : COLORS.primary }
                ]}>
                    {isTopUp ? '+' : '-'}{formatCFA(tx.amount)}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Portefeuille</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={isBlocked ? ['#F44336', '#D32F2F'] : [COLORS.primary, COLORS.primaryDark]}
                    style={styles.balanceCard}
                >
                    <Text style={styles.balanceLabel}>Solde disponible</Text>
                    <Text style={styles.balanceAmount}>{formatCFA(balance)}</Text>

                    {isBlocked ? (
                        <View style={styles.blockedBadge}>
                            <Text style={{ fontSize: 16, color: COLORS.white, marginRight: 6 }}>⚠️</Text>
                            <Text style={styles.blockedText}>Compte bloqué - Solde insuffisant</Text>
                        </View>
                    ) : (
                        <View style={styles.activeBadge}>
                            <Text style={{ fontSize: 16, color: COLORS.white, marginRight: 6 }}>✅</Text>
                            <Text style={styles.activeText}>Compte actif</Text>
                        </View>
                    )}

                    <View style={styles.balanceInfo}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Minimum requis</Text>
                            <Text style={styles.infoValue}>{formatCFA(minimumBalance)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Commission</Text>
                            <Text style={styles.infoValue}>{commissionRate * 100}%</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Top-Up */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recharger (Dépôt Manuel)</Text>
                    <Text style={{ color: COLORS.gray600, marginBottom: 16, fontSize: 13 }}>
                        1. Envoyez le montant au <Text style={{ fontWeight: 'bold', color: COLORS.black }}>07 00 00 00 00 (Wave/OM)</Text>
                        {'\n'}2. Cliquez sur le montant ci-dessous pour le déclarer.
                    </Text>
                    <View style={styles.topUpOptions}>
                        {TOPUP_OPTIONS.map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={styles.topUpButton}
                                onPress={() => handleTopUpRequest(amount)}
                            >
                                <Text style={styles.topUpAmount}>{formatCFA(amount)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Commission Info */}
                <View style={styles.commissionCard}>
                    <View style={styles.commissionHeader}>
                        <Text style={{ fontSize: 24, color: COLORS.primary }}>ℹ️</Text>
                        <Text style={styles.commissionTitle}>Comment ça marche ?</Text>
                    </View>
                    <Text style={styles.commissionText}>
                        TransiGo prélève <Text style={styles.bold}>15%</Text> sur chaque {terms.trip} effectuée,
                        automatiquement depuis votre compte TransiGo.{'\n\n'}
                        Assurez-vous d'avoir un solde d'au moins <Text style={styles.bold}>{formatCFA(minimumBalance)}</Text> pour
                        continuer à recevoir des {terms.trips}.
                    </Text>
                    <View style={styles.totalPaidRow}>
                        <Text style={styles.totalPaidLabel}>Total commissions payées</Text>
                        <Text style={styles.totalPaidValue}>{formatCFA(totalCommission)}</Text>
                    </View>
                </View>

                {/* Transactions History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historique des transactions</Text>
                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48, color: COLORS.gray300 }}>📭</Text>
                            <Text style={styles.emptyText}>Aucune transaction</Text>
                        </View>
                    ) : (
                        <View style={styles.transactionsList}>
                            {recentTransactions.map(renderTransaction)}
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Deposit Modal */}
            <Modal
                visible={showDepositModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDepositModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Déclarer un Dépôt</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                                <Text style={{ fontSize: 24, color: COLORS.black }}>❌</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Vous allez déclarer un dépôt de <Text style={{ fontWeight: 'bold' }}>{formatCFA(selectedAmount)}</Text>.
                            {'\n'}Veuillez saisir l'ID de la transaction (Wave ou Orange Money).
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Référence Transaction / ID</Text>
                            <TextInput
                                style={styles.input}
                                value={reference}
                                onChangeText={setReference}
                                placeholder="ex: TX-123456789"
                                autoFocus={true}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                            onPress={submitDeposit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>Envoyer Demande</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    balanceCard: {
        margin: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 16,
    },
    blockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    blockedText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    activeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    balanceInfo: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 12,
    },
    topUpOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    topUpButton: {
        flex: 1,
        minWidth: (width - 60) / 2,
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    topUpAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    commissionCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    commissionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    commissionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
        marginLeft: 8,
    },
    commissionText: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    bold: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    totalPaidRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray300,
    },
    totalPaidLabel: {
        fontSize: 14,
        color: COLORS.gray600,
    },
    totalPaidValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    transactionsList: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    txInfo: {
        flex: 1,
        marginLeft: 12,
    },
    txDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.black,
    },
    txDate: {
        fontSize: 12,
        color: COLORS.gray600,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: COLORS.white,
        borderRadius: 16,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.gray600,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.gray600,
        marginBottom: 24,
        lineHeight: 20
    },
    inputContainer: {
        marginBottom: 24
    },
    inputLabel: {
        fontSize: 12,
        color: COLORS.gray600,
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    input: {
        backgroundColor: COLORS.gray100,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.gray300
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold'
    }
});


