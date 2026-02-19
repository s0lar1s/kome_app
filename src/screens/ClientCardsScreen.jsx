import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/auth/useAuth.js';

function maskToken(token, showAll) {
  const t = String(token || '');
  if (!t) return '';
  if (showAll) return t;
  if (t.length <= 18) return '••••••';
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function ClientCardsScreen() {
  const { isAuthenticated, isLoading, error, user, auth, logout } = useAuth();

  const [showToken, setShowToken] = useState(false);
  const [rawAuthFromStorage, setRawAuthFromStorage] = useState(null);
  const [rawAuthError, setRawAuthError] = useState(null);

  const accessTokenMasked = useMemo(
    () => maskToken(auth?.accessToken, showToken),
    [auth?.accessToken, showToken]
  );

  const loadRawAuth = useCallback(async () => {
    setRawAuthError(null);
    try {
      const v = await AsyncStorage.getItem('auth');
      setRawAuthFromStorage(v ? JSON.parse(v) : null);
    } catch (e) {
      setRawAuthError(e?.message || 'Failed to read AsyncStorage');
      setRawAuthFromStorage(null);
    }
  }, []);

  useEffect(() => {
    loadRawAuth();
  }, [loadRawAuth]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Client Card (debug)</Text>

      <View style={styles.card}>
        <Text style={styles.h}>Auth state</Text>
        <Text style={styles.row}>isAuthenticated: {String(isAuthenticated)}</Text>
        <Text style={styles.row}>isLoading: {String(isLoading)}</Text>
        <Text style={styles.row}>error: {error ? String(error) : '—'}</Text>

        <Text style={styles.h2}>accessToken</Text>
        <Text style={styles.mono}>{accessTokenMasked || '—'}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => setShowToken((s) => !s)}>
            <Text style={styles.btnText}>{showToken ? 'Hide token' : 'Show token'}</Text>
          </Pressable>

          <Pressable style={styles.btn} onPress={loadRawAuth}>
            <Text style={styles.btnText}>Refresh</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={() => {
              // това чисти persisted auth; logout() вече го прави през setAuth
              logout?.();
              loadRawAuth();
            }}
          >
            <Text style={styles.btnText}>Clear auth (debug)</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.h}>User (from context)</Text>
        <Text style={styles.mono}>{user ? pretty(user) : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h}>Auth (from context)</Text>
        <Text style={styles.mono}>{auth ? pretty(auth) : '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h}>Raw "auth" (from AsyncStorage)</Text>
        {rawAuthError ? <Text style={styles.error}>{rawAuthError}</Text> : null}
        <Text style={styles.mono}>{rawAuthFromStorage ? pretty(rawAuthFromStorage) : '—'}</Text>
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
  btnDanger: {
    borderColor: '#ef4444',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
    marginBottom: 6,
  },
});
