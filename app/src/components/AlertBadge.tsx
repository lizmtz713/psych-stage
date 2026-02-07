import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AlertBadgeProps {
  level: 'green' | 'yellow' | 'red';
  message: string;
  guidance?: string;
  onPress?: () => void;
}

const LEVEL_CONFIG = {
  green: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
    icon: '💚',
    title: 'All Good',
  },
  yellow: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
    icon: '💛',
    title: 'Check In',
  },
  red: {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
    icon: '❤️',
    title: 'Needs Attention',
  },
};

export function AlertBadge({ level, message, guidance, onPress }: AlertBadgeProps) {
  const config = LEVEL_CONFIG[level];

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={[styles.title, { color: config.text }]}>{config.title}</Text>
      </View>
      <Text style={[styles.message, { color: config.text }]}>{message}</Text>
      {guidance && (
        <Text style={[styles.guidance, { color: config.text }]}>{guidance}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  guidance: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
