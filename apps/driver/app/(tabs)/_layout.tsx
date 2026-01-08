import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '../../src/stores/driverStore';

// Charte Graphique: Vert, Blanc, Orange Clémé
const COLORS = { primary: '#00C853', orange: '#FF8C00', gray500: '#9E9E9E', white: '#FFFFFF' };

export default function TabsLayout() {
    const { driver } = useDriverStore();
    const isDelivery = driver?.profileType === 'delivery';

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.orange,
            tabBarInactiveTintColor: COLORS.gray500,
            tabBarStyle: { backgroundColor: COLORS.white, borderTopWidth: 0, elevation: 20, height: 70, paddingBottom: 10, paddingTop: 10 },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}>
            <Tabs.Screen name="home" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
            <Tabs.Screen name="earnings" options={{ title: 'Gains', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
            <Tabs.Screen
                name="carpool"
                options={{
                    title: 'Covoit',
                    tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
                    href: isDelivery ? null : '/carpool'
                }}
            />
            <Tabs.Screen name="activity" options={{ title: 'Activité', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
        </Tabs>
    );
}
