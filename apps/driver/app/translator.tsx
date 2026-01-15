import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    TextInput,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    lightGray: '#F5F5F5',
};

export default function TranslatorScreen() {
    const [history, setHistory] = useState<{ id: string; text: string; translation: string; lang: 'fr' | 'en' }[]>([
        { id: '1', text: "Bonjour, où allez-vous ?", translation: "Hello, where are you going?", lang: 'fr' }
    ]);

    const speak = (text: string, lang: string) => {
        Speech.speak(text, { language: lang, rate: 0.9 });
    };

    const handleTranslate = (lang: 'fr' | 'en') => {
        // Simulation de traduction
        let input, output, outLang;

        if (lang === 'fr') {
            input = "Combien ça coûte ?";
            output = "How much does it cost?";
            outLang = 'en-US';
        } else {
            input = "I need to go to the airport.";
            output = "Je dois aller à l'aéroport.";
            outLang = 'fr-FR';
        }

        // Ajout à l'historique
        const newItem = {
            id: Date.now().toString(),
            text: input,
            translation: output,
            lang: lang
        };
        setHistory([newItem, ...history]);

        // Prononciation auto
        speak(output, outLang);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[COLORS.black, '#2C3E50']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Traducteur 🌍</Text>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {history.map((item) => (
                    <View key={item.id} style={[styles.bubble, item.lang === 'fr' ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={styles.bubbleText}>{item.text}</Text>
                        <View style={styles.translationContainer}>
                            <Text style={styles.translationText}>{item.translation}</Text>
                            <TouchableOpacity onPress={() => speak(item.translation, item.lang === 'fr' ? 'en-US' : 'fr-FR')}>
                                <Text style={{ fontSize: 20, color: COLORS.primary }}>🔊</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.micButton} onPress={() => handleTranslate('fr')}>
                    <View style={styles.micIcon}>
                        <Text style={{ fontSize: 28, color: COLORS.white }}>🎤</Text>
                    </View>
                    <Text style={styles.micLabel}>Français</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={[styles.micButton]} onPress={() => handleTranslate('en')}>
                    <View style={[styles.micIcon, { backgroundColor: COLORS.secondary }]}>
                        <Text style={{ fontSize: 28, color: COLORS.white }}>🎤</Text>
                    </View>
                    <Text style={styles.micLabel}>English</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightGray },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    content: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 120 },
    bubble: { maxWidth: '85%', padding: 15, borderRadius: 16, marginBottom: 15 },
    bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#E3F2FD', borderBottomRightRadius: 4 },
    bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 16, color: COLORS.black, marginBottom: 8 },
    translationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8 },
    translationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, flex: 1, marginRight: 8 },
    controls: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#EEEEEE' },
    micButton: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
    micIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    micLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
    divider: { width: 1, height: '60%', backgroundColor: '#EEEEEE' },
});

