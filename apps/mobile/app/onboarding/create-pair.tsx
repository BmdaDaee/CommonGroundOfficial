import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

export default function CreatePairScreen() {
  const router = useRouter();
  const { setActivePairId } = useAuthStore();
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createPair();
  }, []);

  async function createPair() {
    setLoading(true);
    setError(null);
    try {
      const result = await (trpc as any).pairs.create.mutate({});
      setPairCode(result.pairCode ?? result.code ?? result.invite_code ?? '');
      setPairId(result.id ?? result.pairId ?? '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pair.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!pairCode) return;
    try {
      await Share.share({
        message: `Join me on AxM CommonGround! Use pair code: ${pairCode}`,
        title: 'AxM CommonGround Pair Code',
      });
    } catch {
      // User cancelled
    }
  }

  function handleDone() {
    if (!pairId) { Alert.alert('Error', 'Pair not ready yet.'); return; }
    setActivePairId(pairId);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>AxM</Text>
          <Text style={styles.tagline}>CommonGround</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="heart" size={40} color="#ff6b6b" style={styles.icon} />
          <Text style={styles.title}>Your Pair Code</Text>
          <Text style={styles.subtitle}>Share this code with your partner so they can join.</Text>
          {loading && <View style={styles.codeBox}><ActivityIndicator size="large" color="#ff6b6b" /></View>}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={createPair}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loading && !error && pairCode && (
            <View style={styles.codeBox}>
              <Text style={styles.code}>{pairCode}</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.shareButton, !pairCode && styles.buttonDisabled]} onPress={handleShare} disabled={!pairCode}>
            <Ionicons name="share-outline" size={18} color="#ff6b6b" />
            <Text style={styles.shareText}>Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneButton, !pairId && styles.buttonDisabled]} onPress={handleDone} disabled={!pairId}>
            <Text style={styles.doneText}>I'm Done — Enter App</Text>
          </TouchableOpacity>
          <Link href="/onboarding/join-pair" asChild>
            <TouchableOpacity style={styles.joinLink}>
              <Text style={styles.joinLinkText}>Partner already has a code? Join instead</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32 },
  header: { alignItems: 'center' },
  logo: { color: '#ff6b6b', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: '#888', fontSize: 13, letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  icon: { marginBottom: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeBox: { backgroundColor: '#0a0a0a', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 32, marginTop: 8, minWidth: 200, alignItems: 'center', borderWidth: 2, borderColor: '#ff6b6b' },
  code: { color: '#ff6b6b', fontSize: 36, fontWeight: '900', letterSpacing: 8, textTransform: 'uppercase' },
  errorBox: { alignItems: 'center', gap: 12 },
  errorText: { color: '#ff6b6b', fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontSize: 14 },
  actions: { gap: 12 },
  shareButton: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#ff6b6b', borderRadius: 10, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: '#ff6b6b', fontWeight: '700', fontSize: 16 },
  doneButton: { backgroundColor: '#ff6b6b', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonDisabled: { opacity: 0.4 },
  joinLink: { alignItems: 'center', paddingVertical: 8 },
  joinLinkText: { color: '#888', fontSize: 13 },
});
