import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const { session, activePairId } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session) {
        router.replace('/auth/login');
      } else if (activePairId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/create-pair');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [session, activePairId, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6b6b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
