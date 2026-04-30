import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0a0a0a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="create-pair" options={{ title: 'Create Your Pair', headerShown: false }} />
      <Stack.Screen name="join-pair" options={{ title: 'Join a Pair', headerShown: false }} />
    </Stack>
  );
}
