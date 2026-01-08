// =============================================
// TRANSIGO - AUTH LAYOUT
// =============================================

import { Stack } from 'expo-router';
import { COLORS } from '@/constants';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.white },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}

