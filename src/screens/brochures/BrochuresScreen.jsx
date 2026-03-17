import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
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

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
          setFailed(!url);
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

  const validUntil = brochure?.date_end ? formatDate(brochure.date_end) : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.container}>
        <View style={styles.infoBar}>
          <View style={styles.infoTextWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {brochure?.title || 'Седмична брошура'}
            </Text>
            {validUntil ? (
              <Text style={styles.metaText}>Валидна до {validUntil}</Text>
            ) : (
              <Text style={styles.metaText}>Актуални предложения</Text>
            )}
          </View>
        </View>

        <View style={styles.viewerWrap}>
          {viewerUrl && !failed ? (
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
              startInLoadingState={false}
              javaScriptEnabled
              domStorageEnabled
              allowsBackForwardNavigationGestures
              setSupportMultipleWindows={false}
              style={styles.webview}
            />
          ) : (
            <View style={styles.centerStateWrap}>
              <View style={styles.stateCard}>
                <Text style={styles.stateIcon}>📄</Text>
                <Text style={styles.errorTitle}>Няма PDF за показване</Text>
                <Text style={styles.errorText}>
                  В момента брошурата не може да бъде заредена. Обнови и опитай отново.
                </Text>

                <TouchableOpacity
                  onPress={onRetry}
                  activeOpacity={0.88}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Обнови</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.overlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.overlayTitle}>Зареждане на брошурата</Text>
                <Text style={styles.overlayText}>Моля, изчакай момент...</Text>
              </View>
            </View>
          )}

          {failed && !loading && (
            <View style={styles.overlay}>
              <View style={styles.loadingCard}>
                <Text style={styles.stateIcon}>⚠️</Text>
                <Text style={styles.overlayTitle}>Не успях да заредя брошурата</Text>
                <Text style={styles.overlayText}>
                  Провери връзката си и опитай отново.
                </Text>

                <TouchableOpacity
                  onPress={onRetry}
                  activeOpacity={0.88}
                  style={[styles.retryBtn, styles.retryBtnOverlay]}
                >
                  <Text style={styles.retryText}>Опитай пак</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  infoBar: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  infoTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  metaText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },

  viewerWrap: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  overlayTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  overlayText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },

  centerStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#f8fafc',
  },

  stateCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  stateIcon: {
    fontSize: 30,
    marginBottom: 10,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },

  retryBtn: {
    marginTop: 18,
    minWidth: 140,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#991b1b',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  retryBtnOverlay: {
    marginTop: 16,
  },

  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});