import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProgressBar({ value, color, theme }) {
  const C = theme;
  return (
    <View style={[styles.pbBg, { backgroundColor: C.sep }]}>
      <View style={[styles.pbFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color || C.purple }]} />
    </View>
  );
}

export function Badge({ children, color, theme }) {
  const C = theme;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeText, { color: C.white }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pbBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pbFill: { height: 4, borderRadius: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
});