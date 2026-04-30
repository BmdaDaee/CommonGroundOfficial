import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

export default function JoinPairScreen() {
  const router = useRouter();
  const { setActivePairId } = useAuthStore();
  const [pairCode, setPairCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const code = pairCode.trim().toUpperCase();
    if (code.length !== 6) { Alert.alert('Invalid Code', 'Please enter a 6-character pair code.'); return; }
    setLoading(true);
    try {
      const result = await (trpc as any).pairs.join.mutate({ pairCode: code });
      const joinedPairId = result.id ?? result.pairId ?? '';
      if (!joinedPairId) throw new Error('Invalid response from server.');
      setActivePairId(joinedPairId);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Join Failed', err instanceof Error ? err.message : 'Failed to join pair.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>AxM</Text>
            <Text style={styles.tagline}>CommonGround</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="people" size={40} color="#ff6b6b" style={styles.icon} />
            <Text style={styles.title}>Join a Pair</Text>
            <Text style={styles.subtitle}>Enter the 6-character code your partner shared with you.</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="XXXXXX"
              placeholderTextColor="#333"
              value={pairCode}
              onChangeText={(t) => setPairCode(t.toUpperCase().slice(0, 6))}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.joinButton, (loading || pairCode.trim().length !== 6) && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={loading || pairCode.trim().length !== 6}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinText}>Join Pair</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32 },
  header: { alignItems: 'center' },
  logo: { color: '#ff6b6b', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: '#888', fontSize: 13, letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  icon: { marginBottom: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeInput: { backgroundColor: '#0a0a0a', borderWidth: 2, borderColor: '#ff6b6b', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 32, marginTop: 8, color: '#ff6b6b', fontSize: 36, fontWeight: '900', letterSpacing: 10, textAlign: 'center', width: '100%' },
  actions: { gap: 12 },
  joinButton: { backgroundColor: '#ff6b6b', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonDisabled: { opacity: 0.4 },
  backButton: { alignItems: 'center', paddingVertical: 8 },
  backText: { color: '#888', fontSize: 14 },
});
