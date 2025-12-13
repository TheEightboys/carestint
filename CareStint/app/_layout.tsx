import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Try to hide expo splash screen, but don't crash if it fails
        const hideSplash = async () => {
            try {
                const SplashScreenExpo = await import('expo-splash-screen');
                await SplashScreenExpo.hideAsync();
            } catch (error) {
                // Ignore errors - splash screen will still work
                console.log('Splash screen hide skipped');
            }
        };
        hideSplash();
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    if (showSplash) {
        return <SplashScreen onAnimationComplete={handleSplashComplete} />;
    }

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <View style={styles.container}>
                    <StatusBar style="light" translucent backgroundColor="transparent" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: Colors.background },
                            animation: 'slide_from_right',
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                        <Stack.Screen name="(employer)" options={{ headerShown: false }} />
                        <Stack.Screen name="(professional)" options={{ headerShown: false }} />
                        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                        <Stack.Screen name="notifications" options={{ headerShown: false }} />
                    </Stack>
                </View>
            </AuthProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});
