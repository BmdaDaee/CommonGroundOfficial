import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { usePair } from '@/hooks/usePair';

interface DailyQuestion {
  id: string;
  question: string;
  myAnswer?: string;
  partnerAnswer?: string;
  bothAnswered?: boolean;
}

export default function HomeScreen() {
  const pairId = usePair();
  const router = useRouter();
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!pairId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await (trpc as any).dailyQuestions.getToday.query({ pairId });
      setQuestion(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load question.');
    } finally {
      setLoading(false);
    }
  }, [pairId]);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);

  async function handleSubmitAnswer() {
    if (!answer.trim() || !question || !pairId) return;
    setSubmitting(true);
    try {
      await (trpc as any).dailyQuestions.answer.mutate({ pairId, questionId: question.id, answer: answer.trim() });
      await fetchQuestion();
      setAnswer('');
      Alert.alert('Answer saved!', 'Check back when your partner answers too.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Today's Question</Text>
        {loading && <View style={styles.loadingBox}><ActivityIndicator size="large" color="#ff6b6b" /></View>}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchQuestion} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        )}
        {!loading && question && (
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.myAnswer ? (
              <View style={styles.myAnswerBox}>
                <Text style={styles.answerLabel}>Your Answer</Text>
                <Text style={styles.answerText}>{question.myAnswer}</Text>
              </View>
            ) : (
              <View style={styles.answerForm}>
                <TextInput style={styles.answerInput} placeholder="Type your answer…" placeholderTextColor="#555" value={answer} onChangeText={setAnswer} multiline numberOfLines={3} />
                <TouchableOpacity style={[styles.submitBtn, (!answer.trim() || submitting) && styles.btnDisabled]} onPress={handleSubmitAnswer} disabled={!answer.trim() || submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit Answer</Text>}
                </TouchableOpacity>
              </View>
            )}
            {question.bothAnswered && question.partnerAnswer && (
              <View style={styles.partnerAnswerBox}>
                <Text style={styles.answerLabel}>Partner's Answer</Text>
                <Text style={styles.answerText}>{question.partnerAnswer}</Text>
              </View>
            )}
            {question.myAnswer && !question.bothAnswered && (
              <View style={styles.waitingBox}>
                <Ionicons name="time-outline" size={16} color="#888" />
                <Text style={styles.waitingText}>Waiting for your partner to answer…</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/missions')}>
            <Ionicons name="flash" size={22} color="#ff6b6b" />
            <Text style={styles.quickBtnText}>Play a Spark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/missions')}>
            <Ionicons name="flag" size={22} color="#ff6b6b" />
            <Text style={styles.quickBtnText}>Start Mission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/chat')}>
            <Ionicons name="chatbubble" size={22} color="#ff6b6b" />
            <Text style={styles.quickBtnText}>Open Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '700' },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center', gap: 12 },
  errorText: { color: '#ff6b6b', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontSize: 14 },
  questionCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, gap: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  questionText: { color: '#fff', fontSize: 17, fontWeight: '600', lineHeight: 24 },
  answerForm: { gap: 12 },
  answerInput: { backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#ff6b6b', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  myAnswerBox: { backgroundColor: '#1f1f2e', borderRadius: 10, padding: 14, gap: 6 },
  partnerAnswerBox: { backgroundColor: '#1f2a1f', borderRadius: 10, padding: 14, gap: 6 },
  answerLabel: { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  answerText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  waitingBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingText: { color: '#888', fontSize: 13 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  quickBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
