import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { brochuresApi } from '../../Api';

const BROCHURES_BASE = 'https://kome.bg/komeadmin/brochures/images/';

function toUrl(base, value) {
  const vRaw = String(value ?? '');
  const v = vRaw.trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  const clean = v.replace(/^\/+/, '');
  const encoded = clean
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return base + encoded;
}

export default function BrochuresScreen({ route }) {
  const id = route?.params?.id;

  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [brochure, setBrochure] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setFailed(false);

      try {
        let data = null;

        if (id) {
          const res = await brochuresApi.getOne(id);
          data = res?.data || null;
        } else {
          const res = await brochuresApi.getAll();
          const list = Array.isArray(res?.data) ? res.data : [];
          data = list.find((x) => String(x?.state) === '1' || x?.state === 1) || list[0] || null;
        }

        const url = data?.pdf ? toUrl(BROCHURES_BASE, data.pdf) : '';

        if (mounted) {
          setBrochure(data);
          setPdfUrl(url);
        }
      } catch (e) {
        if (mounted) setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, reloadKey]);

  const viewerUrl = useMemo(() => {
    if (!pdfUrl) return '';
    if (Platform.OS === 'android') {
      const encoded = encodeURIComponent(pdfUrl);
      return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
    }
    return pdfUrl;
  }, [pdfUrl]);

  const onRetry = () => setReloadKey((k) => k + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{brochure?.title || 'Седмична брошура'}</Text>
        {brochure?.category ? <Text style={styles.title2}>Категория: {brochure.category}</Text> : null}
      </View>

      {viewerUrl ? (
        <WebView
          key={`${reloadKey}-${viewerUrl}`}
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
      ) : (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Няма PDF за показване.</Text>
          <TouchableOpacity onPress={onRetry} activeOpacity={0.85} style={styles.retryBtn}>
            <Text style={styles.retryText}>Обнови</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.overlayText}>Зареждане…</Text>
        </View>
      )}

      {failed && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Не успях да заредя брошурата.</Text>
          <TouchableOpacity onPress={onRetry} activeOpacity={0.85} style={styles.retryBtn}>
            <Text style={styles.retryText}>Опитай пак</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.title}>{brochure?.title || 'Седмична брошура'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    backgroundColor: '#fff',
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  title2: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },

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
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  retryText: { color: '#fff', fontWeight: '800' },
});
