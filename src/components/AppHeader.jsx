import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  rightAction = null,
  badge = null,
}) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.wrap}>
        <View style={styles.topRow}>
          <View style={styles.side}>
            {showBack ? (
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <Text style={styles.backText}>‹</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sideRight}>
            {rightAction}
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>

          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}

          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#f8fafc',
  },

  wrap: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },

  topRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  sideRight: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#0f172a',
    fontWeight: '500',
    marginTop: -2,
  },

  textWrap: {
    marginTop: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },

  pressed: {
    opacity: 0.92,
  },
});