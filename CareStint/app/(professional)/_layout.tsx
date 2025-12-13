import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

export default function ProfessionalLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.backgroundCard,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="find-stints"
                options={{
                    title: 'Find Stints',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'Earnings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="wallet-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            {/* Hide old screens from tabs */}
            <Tabs.Screen name="my-stints" options={{ href: null }} />
            <Tabs.Screen name="profile" options={{ href: null }} />
        </Tabs>
    );
}
