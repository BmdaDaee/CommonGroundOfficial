import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/lib/store';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import XPBar from '@/components/XPBar';

export default function ProfileScreen() {
  const { profile, activePairId, reset } = useAuthStore();
  const [rank, setRank] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deeplyMode, setDeeplyMode] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [activePairId]);

  async function loadProfileData() {
    if (!activePairId) return;
    setLoading(true);
    try {
      const [rankData, achievementData] = await Promise.all([
        (trpc as any).rankings.getRank.query({ pairId: activePairId }),
        (trpc as any).achievements.unlocked.query({ pairId: activePairId }),
      ]);
      setRank(rankData);
      setAchievements(achievementData ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  }

  async function toggleMode(value: boolean) {
    setDeeplyMode(value);
    try {
      await (trpc as any).profile.update.mutate({ app_mode: value ? 'deeply' : 'common' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setDeeplyMode(!value);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.displayName?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.displayName ?? 'User'}</Text>
        <Text style={styles.email}>{profile?.email ?? ''}</Text>
      </View>
      {profile && <XPBar xp={profile.xp} tier={profile.tier} />}
      {loading ? (
        <ActivityIndicator color="#ff6b6b" style={{ marginTop: 20 }} />
      ) : (
        <>
          {rank && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>RANKING</Text>
              <View style={styles.rankRow}>
                <Text style={styles.rankEmoji}>{rank.tierEmoji}</Text>
                <View>
                  <Text style={styles.rankTier}>{rank.tier}</Text>
                  <Text style={styles.rankXP}>{rank.totalXP} XP total</Text>
                </View>
              </View>
            </View>
          )}
          {achievements.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ACHIEVEMENTS ({achievements.length})</Text>
              {achievements.map((a: any) => (
                <View key={a.id} style={styles.achievementRow}>
                  <Text style={styles.achievementIcon}>{a.icon ?? '🏆'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achievementName}>{a.title}</Text>
                    <Text style={styles.achievementDesc}>{a.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SETTINGS</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>DeeplyUs Mode</Text>
            <Text style={styles.settingDesc}>Enhanced intimacy features</Text>
          </View>
          <Switch value={deeplyMode} onValueChange={toggleMode} trackColor={{ false: '#333', true: '#ff6b6b' }} thumbColor="#fff" />
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ff6b6b', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { color: '#666', fontSize: 13 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  cardTitle: { color: '#ff6b6b', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankEmoji: { fontSize: 32 },
  rankTier: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rankXP: { color: '#888', fontSize: 13 },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  achievementIcon: { fontSize: 22 },
  achievementName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  achievementDesc: { color: '#888', fontSize: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
  settingDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginTop: 8 },
  logoutText: { color: '#ff4444', fontWeight: '700', fontSize: 15 },
});
