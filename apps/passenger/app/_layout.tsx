import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, useThemeStore } from '@/stores';
import { View, Text } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
    const { isLoading } = useAuthStore();
    const { colors, isDark } = useThemeStore();

    useEffect(() => {
        console.log("[RootLayout] isLoading:", isLoading);
        if (!isLoading) {
            SplashScreen.hideAsync();
        }

        // Fix legacy mock user: id='1' is invalid for Supabase UUID
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

