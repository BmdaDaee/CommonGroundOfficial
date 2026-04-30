import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { usePair } from '@/hooks/usePair';
import { BentlyBubble } from '@/components/BentlyBubble';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  bentlySuggestion?: string;
  rewrites?: Array<{ label: string; tone: 'gentle' | 'direct' | 'collaborative'; content: string }>;
}

export default function ChatScreen() {
  const pairId = usePair();
  const { session } = useAuthStore();
  const myUserId = session?.user?.id ?? '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!pairId) return;
    try {
      const data = await (trpc as any).messages.list.query({ pairId });
      setMessages(Array.isArray(data) ? data : data.messages ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [pairId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || !pairId || sending) return;
    setDraft('');
    setSending(true);
    try {
      await (trpc as any).messages.send.mutate({ pairId, content });
      await fetchMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { setDraft(content); } finally { setSending(false); }
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === myUserId;
    return (
      <View style={styles.messageWrapper}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          <Text style={styles.bubbleTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        {item.bentlySuggestion && (
          <BentlyBubble suggestion={item.bentlySuggestion} rewrites={item.rewrites} onSelectRewrite={(c) => setDraft(c)} />
        )}
      </View>
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#ff6b6b" /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySubtext}>Say something to your partner!</Text>
            </View>
          }
        />
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Message…" placeholderTextColor="#555" value={draft} onChangeText={setDraft} multiline maxLength={1000} />
          <TouchableOpacity style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!draft.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  messageWrapper: { marginBottom: 8 },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  myBubble: { backgroundColor: '#ff6b6b', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  bubbleTime: { color: 'rgba(255,255,255,0.6)', fontSize: 10, alignSelf: 'flex-end' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#444', fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a', backgroundColor: '#0f0f0f', gap: 8 },
  input: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: '#2a2a2a' },
  sendBtn: { backgroundColor: '#ff6b6b', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
