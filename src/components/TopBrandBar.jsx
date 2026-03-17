import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TopBrandBar() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.bar}>
        {/* Смени source с вашето реално лого */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoPlaceholderText}>CBA</Text>
        </View>

        <Text style={styles.brandText}>Kome CBA</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#ffffff',
  },

  bar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },

  logoPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoPlaceholderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  brandText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
});