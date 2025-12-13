import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.backgroundSecondary,
                    borderTopColor: Colors.border,
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 70,
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
                    title: 'Overview',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="employers"
                options={{
                    title: 'Employers',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="business-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="professionals"
                options={{
                    title: 'Pros',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stints"
                options={{
                    title: 'Stints',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="audit"
                options={{
                    title: 'Audit',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
