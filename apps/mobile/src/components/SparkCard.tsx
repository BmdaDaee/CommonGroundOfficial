import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SparkGameType =
  | 'truths_lies'
  | 'rate_day'
  | 'would_you_rather'
  | 'finish_sentence';

export interface SparkGame {
  type: SparkGameType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const SPARK_GAMES: SparkGame[] = [
  {
    type: 'truths_lies',
    title: '2 Truths & a Lie',
    description: 'Guess which statement is false.',
    icon: 'help-circle-outline',
    color: '#9c27b0',
  },
  {
    type: 'rate_day',
    title: 'Rate My Day',
    description: 'Share how your day went 1–10.',
    icon: 'sunny-outline',
    color: '#ff9800',
  },
  {
    type: 'would_you_rather',
    title: 'Would You Rather',
    description: 'Tough choices, fun conversations.',
    icon: 'git-branch-outline',
    color: '#2196f3',
  },
  {
    type: 'finish_sentence',
    title: 'Finish the Sentence',
    description: 'Complete the prompt together.',
    icon: 'chatbubble-ellipses-outline',
    color: '#4caf50',
  },
];

interface SparkCardProps {
  game: SparkGame;
  onPlay: (type: SparkGameType) => void;
}

export function SparkCard({ game, onPlay }: SparkCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: game.color + '44' }]}
      onPress={() => onPlay(game.type)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: game.color + '22' }]}>
        <Ionicons name={game.icon} size={24} color={game.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    color: '#888',
    fontSize: 12,
  },
});
