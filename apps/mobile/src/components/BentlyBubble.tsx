import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RewriteOption {
  label: string;
  tone: 'gentle' | 'direct' | 'collaborative';
  content: string;
}

interface BentlyBubbleProps {
  suggestion: string;
  rewrites?: RewriteOption[];
  onSelectRewrite?: (content: string) => void;
}

export function BentlyBubble({
  suggestion,
  rewrites,
  onSelectRewrite,
}: BentlyBubbleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color="#ff6b6b" />
        <Text style={styles.label}>Bently suggests</Text>
      </View>
      <Text style={styles.suggestion}>{suggestion}</Text>
      {rewrites && rewrites.length > 0 && (
        <View style={styles.rewrites}>
          {rewrites.map((rw) => (
            <TouchableOpacity
              key={rw.tone}
              style={styles.pill}
              onPress={() => onSelectRewrite?.(rw.content)}
            >
              <Text style={styles.pillText}>{rw.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1010',
    borderLeftWidth: 2,
    borderLeftColor: '#ff6b6b',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  label: {
    color: '#ff6b6b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  suggestion: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 20,
  },
  rewrites: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    backgroundColor: '#2a1515',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
  },
});
