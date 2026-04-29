import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XPBarProps {
  xp: number;
  tier: string;
  nextTierXp?: number;
}

const TIER_COLORS: Record<string, string> = {
  SPARK: '#ff6b6b',
  FLAME: '#ff9800',
  CALIBRATOR: '#9c27b0',
  INFERNO: '#f44336',
  SOVEREIGN: '#ffd700',
};

function XPBar({ xp, tier, nextTierXp = 1000 }: XPBarProps) {
  const progress = Math.min(xp / nextTierXp, 1);
  const tierColor = TIER_COLORS[tier] ?? '#ff6b6b';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierText, { color: tierColor }]}>{tier}</Text>
        </View>
        <Text style={styles.xpText}>
          {xp} <Text style={styles.xpLabel}>XP</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%` as `${number}%`, backgroundColor: tierColor },
          ]}
        />
      </View>
      <Text style={styles.nextLabel}>
        {nextTierXp - xp} XP to next tier
      </Text>
    </View>
  );
}

export { XPBar };
export default XPBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  xpText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  xpLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '400',
  },
  track: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  nextLabel: {
    color: '#666',
    fontSize: 11,
    textAlign: 'right',
  },
});
