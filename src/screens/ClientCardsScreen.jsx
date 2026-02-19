import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useAuth } from '../contexts/auth/useAuth.js';
import { authService } from '../Api/index.js'; // нагласи пътя ако е различен

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function ClientCardsScreen() {
  const { isAuthenticated, isLoading, error, user, logout } = useAuth();

  const [meLoading, setMeLoading] = useState(false);
  const [meResult, setMeResult] = useState(null);

  const testMe = async () => {
    setMeResult(null);
    setMeLoading(true);
    try {
      const data = await authService.me();
      setMeResult(data);
    } catch (e) {
      setMeResult({
        ok: false,
        error:
          e?.response?.data?.error ||
          e?.message ||
          'Request failed',
        status: e?.response?.status ?? null,
      });
    } finally {
      setMeLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Client Cards</Text>

      <View style={styles.card}>
        <Text style={styles.row}>isAuthenticated: {String(isAuthenticated)}</Text>
        <Text style={styles.row}>authLoading: {String(isLoading)}</Text>
        <Text style={styles.row}>authError: {error ? String(error) : '—'}</Text>

        <Text style={styles.h2}>User</Text>
        <Text style={styles.mono}>{user ? pretty(user) : '—'}</Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, (meLoading || !isAuthenticated) && styles.btnDisabled]}
            onPress={testMe}
            disabled={meLoading || !isAuthenticated}
          >
            <Text style={styles.btnText}>
              {meLoading ? 'Testing...' : 'Test /me'}
            </Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnDanger]} onPress={logout}>
            <Text style={styles.btnText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.h}>/me result</Text>
        <Text style={styles.mono}>{meResult ? pretty(meResult) : '—'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  h: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  h2: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  row: {
    fontSize: 13,
    marginBottom: 4,
  },
  mono: {
    fontSize: 12,
    fontFamily: 'Menlo',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnDanger: {
    borderColor: '#ef4444',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
