// TRANSIGO DRIVER - ROOT LAYOUT
import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDriverSync } from '../src/services/useDriverSync';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    white: '#FFFFFF',
    background: '#FFFFFF',
};

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    // Activer la synchro Wallet/Profil (Admin -> App)
    useDriverSync();

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts (Ionicons for all icons in the app)
                await Font.loadAsync({
                    ...Ionicons.font,
                });

                // Pre-load critical images (onboarding, splash, logo)
                await Asset.loadAsync([
                    require('../assets/images/onboarding/driver.png'),
                    require('../assets/images/onboarding/delivery.png'),
                    require('../assets/images/onboarding/seller.png'),
                    require('../assets/icon.png'),
                    require('../assets/splash.png'),
                ]);
            } catch (e) {
                console.warn('Error loading assets:', e);
            } finally {
                setAppIsReady(true);
            }
        }
        prepare();
    }, []);


    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            await SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="onboarding/intro" options={{ animation: 'fade' }} />
                    <Stack.Screen name="onboarding/choose-profile" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

                    <Stack.Screen name="driver-notifications" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-objectives" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-reviews" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-chat" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-navigation" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-vehicle" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="driver-documents" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="heat-map" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
                    {/* Premium Features */}
                    <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="smart-predictions" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="home-direction" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="clubs" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="premium" options={{ animation: 'slide_from_right' }} />
                </Stack>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
