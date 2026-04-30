import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { usePair } from '@/hooks/usePair';

interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = ['milestone', 'funny', 'romantic', 'adventure', 'other'];
const CATEGORY_COLORS: Record<string, string> = {
  milestone: '#ffd700', funny: '#ff9800', romantic: '#ff6b6b', adventure: '#4caf50', other: '#9c27b0',
};

export default function VaultScreen() {
  const pairId = usePair();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [saving, setSaving] = useState(false);

  const fetchMemories = useCallback(async () => {
    if (!pairId) return;
    try {
      const data = await (trpc as any).vault.getMemories.query({ pairId });
      setMemories(Array.isArray(data) ? data : data.memories ?? []);
    } catch { } finally { setLoading(false); }
  }, [pairId]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  async function handleAddMemory() {
    if (!title.trim() || !content.trim() || !pairId) return;
    setSaving(true);
    try {
      await (trpc as any).vault.addMemory.mutate({ pairId, title: title.trim(), content: content.trim(), category });
      setTitle(''); setContent(''); setCategory('other');
      setModalVisible(false);
      await fetchMemories();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save memory.');
    } finally { setSaving(false); }
  }

  function renderMemory({ item }: { item: Memory }) {
    const color = CATEGORY_COLORS[item.category] ?? '#888';
    return (
      <View style={styles.memoryCard}>
        <View style={[styles.categoryDot, { backgroundColor: color }]} />
        <View style={styles.memoryBody}>
          <Text style={styles.memoryTitle}>{item.title}</Text>
          <Text style={styles.memoryContent} numberOfLines={2}>{item.content}</Text>
          <Text style={styles.memoryDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#ff6b6b" /></View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(m) => m.id}
          renderItem={renderMemory}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="heart-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>No memories yet.</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first memory!</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Memory</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#555" value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.contentInput]} placeholder="Describe this memory…" placeholderTextColor="#555" value={content} onChangeText={setContent} multiline numberOfLines={4} textAlignVertical="top" />
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && { backgroundColor: (CATEGORY_COLORS[cat] ?? '#888') + '33', borderColor: CATEGORY_COLORS[cat] ?? '#888' }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && { color: CATEGORY_COLORS[cat] ?? '#888' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, (!title.trim() || !content.trim() || saving) && styles.btnDisabled]}
              onPress={handleAddMemory}
              disabled={!title.trim() || !content.trim() || saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Memory</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80, gap: 12 },
  memoryCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  memoryBody: { flex: 1, gap: 4 },
  memoryTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  memoryContent: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  memoryDate: { color: '#555', fontSize: 11, marginTop: 4 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 10 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#444', fontSize: 13 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#ff6b6b', borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#ff6b6b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15 },
  contentInput: { minHeight: 90, textAlignVertical: 'top' },
  categoryLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catText: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  saveBtn: { backgroundColor: '#ff6b6b', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
