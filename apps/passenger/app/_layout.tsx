import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, useThemeStore } from '@/stores';
import { View, Text } from 'react-native';

import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
// import { Ionicons } from '@expo/vector-icons';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { isLoading } = useAuthStore();
    const { colors, isDark } = useThemeStore();

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load essential images (Ionicons font load removed)

                // Pre-load essential images
                await Asset.loadAsync([
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

        // Fix legacy mock user
        const { user, logout } = useAuthStore.getState();
        if (user && user.id === '1') {
            logout();
        }
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady && !isLoading) {
            await SplashScreen.hideAsync();
        }
    }, [appIsReady, isLoading]);

    // BLOCK RENDERING until fonts are loaded
    if (!appIsReady) {
        return null; // Keep showing splash screen
    }

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFCC80', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, color: '#1A1A1A' }}>Initialisation TransiGo...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <QueryClientProvider client={queryClient}>
                <StatusBar style={isDark ? "light" : "dark"} />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background || '#FFF3E0' },
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                    <Stack.Screen
                        name="booking"
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="ride/[id]"
                        options={{
                            animation: 'slide_from_right',
                        }}
                    />
                </Stack>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
