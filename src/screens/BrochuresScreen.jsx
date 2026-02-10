import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const PDF_URL = 'https://kome.bg/komeadmin/brochures/images/kome.pdf';

export default function BrochuresScreen() {
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const viewerUrl = useMemo(() => {
    if (Platform.OS === 'android') {
      const encoded = encodeURIComponent(PDF_URL);
      return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
    }
    return PDF_URL;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
           <Text style={styles.title}>Седмична брошура</Text>
           <Text style={styles.title2}>Период - </Text>
      </View>
      <WebView
        key={reloadKey}
        source={{ uri: viewerUrl }}
        onLoadStart={() => {
          setLoading(true);
          setFailed(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.overlayText}>Зареждане…</Text>
        </View>
      )}

      {failed && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Не успях да заредя брошурата.</Text>
          <TouchableOpacity onPress={() => setReloadKey((k) => k + 1)} activeOpacity={0.85} style={styles.retryBtn}>
            <Text style={styles.retryText}>Опитай пак</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlayText: { fontSize: 14, color: '#64748b' },

  errorBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  title2: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
