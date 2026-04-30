import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { usePair } from '@/hooks/usePair';
import { MissionCard, type Mission } from '@/components/MissionCard';
import { SparkCard, SPARK_GAMES, type SparkGameType } from '@/components/SparkCard';

export default function MissionsScreen() {
  const pairId = usePair();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!pairId) return;
    try {
      const data = await (trpc as any).missions.list.query({ pairId });
      setMissions(Array.isArray(data) ? data : data.missions ?? []);
    } catch { } finally { setLoading(false); }
  }, [pairId]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  async function handleComplete(missionId: string) {
    if (!pairId) return;
    setCompletingId(missionId);
    try {
      const result = await (trpc as any).missions.complete.mutate({ pairId, missionId });
      showToast(`Mission complete! +${result?.xpAwarded ?? result?.xp ?? 0} XP`);
      await fetchMissions();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to complete mission.');
    } finally { setCompletingId(null); }
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handlePlaySpark(type: SparkGameType) {
    Alert.alert('Spark Game', `Starting "${type.replace(/_/g, ' ')}"!\n\nThis feature is coming soon.`, [{ text: 'OK' }]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {toastMessage && <View style={styles.toast}><Text style={styles.toastText}>{toastMessage}</Text></View>}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Missions</Text>
        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color="#ff6b6b" /></View>
        ) : missions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No missions available yet.</Text>
            <Text style={styles.emptySubtext}>Check back soon!</Text>
          </View>
        ) : (
          missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} onComplete={handleComplete} completing={completingId === mission.id} />
          ))
        )}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Spark Games</Text>
        {SPARK_GAMES.map((game) => <SparkCard key={game.type} game={game} onPlay={handlePlaySpark} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  sectionGap: { marginTop: 8 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  emptyBox: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, alignItems: 'center', gap: 8, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 15, fontWeight: '600' },
  emptySubtext: { color: '#555', fontSize: 13 },
  toast: { position: 'absolute', top: 60, left: 24, right: 24, backgroundColor: '#4caf50', borderRadius: 10, padding: 14, zIndex: 100, alignItems: 'center' },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
