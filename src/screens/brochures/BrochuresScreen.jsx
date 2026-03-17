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
        <View style={styles.topCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Актуална брошура</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {brochure?.title || 'Седмична брошура'}
          </Text>

          <Text style={styles.subtitle}>
            Разгледай всички страници и актуалните предложения
          </Text>
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
                <Text style={styles.errorTitle}>
                  Няма PDF за показване
                </Text>
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
                <Text style={styles.overlayText}>
                  Моля, изчакай момент...
                </Text>
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

        <View style={styles.bottomCard}>
          {validUntil ? (
            <>
              <Text style={styles.footerLabel}>Валидност</Text>
              <Text style={styles.footerValue}>до {validUntil}</Text>
            </>
          ) : (
            <>
              <Text style={styles.footerLabel}>Информация</Text>
              <Text style={styles.footerMuted}>Няма посочена крайна дата</Text>
            </>
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

  topCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },

  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: '#0f172a',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  viewerWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  bottomCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  footerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },

  footerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },

  footerMuted: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  overlayTitle: {
    marginTop: 14,
    fontSize: 17,
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
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
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