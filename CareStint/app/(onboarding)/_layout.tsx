import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
                gestureEnabled: false,
            }}
        >
            <Stack.Screen name="employer/index" />
            <Stack.Screen name="professional/index" />
        </Stack>
    );
}
