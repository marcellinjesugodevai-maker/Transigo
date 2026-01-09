import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, useThemeStore } from '@/stores';
import { View, Text } from 'react-native';

import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
    const { isLoading } = useAuthStore();
    const { colors, isDark } = useThemeStore();

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load assets
                const imageAssets = [
                    require('../assets/icon.png'),
                    require('../assets/splash.png'),
                    require('../assets/onboarding/travel.png'),
                    require('../assets/onboarding/negotiate.png'),
                    require('../assets/onboarding/safety.png'),
                ];

                await Promise.all([
                    ...imageAssets.map(image => Asset.fromModule(image).downloadAsync()),
                    Font.loadAsync(Ionicons.font),
                ]);
            } catch (e) {
                console.warn(e);
            } finally {
                if (!isLoading) {
                    await SplashScreen.hideAsync();
                }
            }
        }

        prepare();

        // Fix legacy mock user
        const { user, logout } = useAuthStore.getState();
        if (user && user.id === '1') {
            logout();
        }
    }, [isLoading]);


    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFCC80', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, color: '#1A1A1A' }}>Initialisation TransiGo...</Text>
                <Text style={{ marginTop: 20, color: 'red' }}>Debug: isLoading=true</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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

