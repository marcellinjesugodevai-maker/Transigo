// =============================================
// TRANSIGO - TABS LAYOUT
// =============================================

import { Tabs } from 'expo-router';
import Icon from '@/components/Icon';
import { COLORS } from '@/constants';
import { useThemeStore } from '@/stores';

export default function TabsLayout() {
    const { colors, isDark } = useThemeStore();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: isDark ? '#888' : '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopWidth: isDark ? 1 : 0,
                    borderTopColor: isDark ? '#333' : 'transparent',
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Poppins-Medium',
                    fontSize: 12,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activité',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="time" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="services"
                options={{
                    title: 'Services',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="grid" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

