import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MoodCheckin, MOOD_EMOJIS } from '../types';
import { format, subDays } from 'date-fns';

interface MoodChartProps {
  checkins: MoodCheckin[];
  days?: number;
}

export function MoodChart({ checkins, days = 7 }: MoodChartProps) {
  const width = Dimensions.get('window').width - 48;
  const barWidth = (width - (days - 1) * 8) / days;

  // Get last N days
  const dayLabels = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    return {
      date,
      label: format(date, 'EEE'),
      dateStr: format(date, 'yyyy-MM-dd'),
    };
  });

  // Map checkins to days
  const moodByDay = dayLabels.map(({ dateStr, label }) => {
    const dayCheckins = checkins.filter(c => 
      format(new Date(c.createdAt), 'yyyy-MM-dd') === dateStr
    );
    const avgMood = dayCheckins.length > 0
      ? Math.round(dayCheckins.reduce((sum, c) => sum + c.mood, 0) / dayCheckins.length)
      : null;
    return { label, mood: avgMood };
  });

  const getBarColor = (mood: number | null) => {
    if (!mood) return '#E5E7EB';
    return MOOD_EMOJIS[mood]?.color || '#E5E7EB';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Week</Text>
      <View style={styles.chart}>
        {moodByDay.map(({ label, mood }, i) => (
          <View key={i} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    height: mood ? (mood / 5) * 100 : 20,
                    backgroundColor: getBarColor(mood),
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{label}</Text>
            {mood && <Text style={styles.emoji}>{MOOD_EMOJIS[mood].emoji}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 8,
    minHeight: 20,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  emoji: {
    fontSize: 16,
    marginTop: 4,
  },
});
