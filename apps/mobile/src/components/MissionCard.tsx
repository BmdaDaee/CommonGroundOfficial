import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  category?: string;
}

interface MissionCardProps {
  mission: Mission;
  onComplete: (id: string) => Promise<void>;
  completing?: boolean;
}

export function MissionCard({ mission, onComplete, completing }: MissionCardProps) {
  return (
    <View style={[styles.card, mission.completed && styles.cardCompleted]}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          {mission.completed && (
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" style={styles.checkIcon} />
          )}
          <Text style={[styles.title, mission.completed && styles.titleCompleted]}>
            {mission.title}
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={12} color="#ff6b6b" />
          <Text style={styles.xpText}>+{mission.xpReward}</Text>
        </View>
      </View>
      <Text style={styles.description}>{mission.description}</Text>
      {!mission.completed && (
        <TouchableOpacity
          style={[styles.button, completing && styles.buttonDisabled]}
          onPress={() => onComplete(mission.id)}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  cardCompleted: {
    borderColor: '#1a3a1a',
    opacity: 0.7,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    marginRight: 6,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  titleCompleted: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1515',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  xpText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
