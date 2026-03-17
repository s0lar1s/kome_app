import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Barcode } from 'expo-barcode-generator';
import * as Clipboard from 'expo-clipboard';
import { promoCodesApi } from '../../Api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 16;
const PROMO_BASE = 'https://kome.bg/komeadmin/promocodes/images/';

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

function normCode(v) {
  return String(v ?? '').trim();
}

function typeLabel(item) {
  if (Number(item?.category) === 1) return 'Седмичен код';
  if (Number(item?.is_personal) === 1) return 'Персонален код';
  return 'Промо код';
}

export default function PromoCodeDetailsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copiedTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchItem() {
      try {
        const result = await promoCodesApi.getById(id);
        if (!mounted) return;
        setItem(result?.data ?? null);
      } catch (e) {
        Alert.alert('Грешка', 'Проблем при зареждане на промо кода.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchItem();

    return () => {
      mounted = false;
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, [id]);

  const code = useMemo(() => normCode(item?.code), [item?.code]);
  const imgUrl = useMemo(() => toUrl(PROMO_BASE, item?.image), [item?.image]);
  const chip = useMemo(() => typeLabel(item), [item]);

  async function copyCode() {
    if (!code) return;

    await Clipboard.setStringAsync(code);
    setCopied(true);

    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }

    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Зареждане на промо кода...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.emptyIcon}>🏷️</Text>
        <Text style={styles.emptyTitle}>Промо кодът не е намерен</Text>
        <Text style={styles.emptyText}>Възможно е вече да не е наличен.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {copied ? (
        <View style={styles.copyToastFloating}>
          <Text style={styles.copyToastText}>Кодът е копиран</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentWrap}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {!!imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>Няма снимка</Text>
            </View>
          )}

          <View style={styles.heroOverlay} />

          <View style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {!!item.title ? <Text style={styles.title}>{item.title}</Text> : null}

          {!!item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : (
            <Text style={styles.descriptionMuted}>Няма допълнителна информация.</Text>
          )}
        </View>

        <View style={styles.barcodeCard}>
          <View style={styles.barcodeHeader}>
            <View style={styles.barcodeHeaderTextWrap}>
              <Text style={styles.barcodeTitle}>Използвай на каса</Text>
              <Text style={styles.barcodeSub}>Покажи баркода за сканиране</Text>
            </View>

            {!!code ? (
              <Pressable
                onPress={copyCode}
                style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
              >
                <Text style={styles.copyBtnText}>Копирай код</Text>
              </Pressable>
            ) : null}
          </View>

          {!!code ? (
            <>
              <View style={styles.barcodeWrap}>
                <Barcode
                  value={code}
                  options={{
                    format: 'CODE128',
                    width: 2,
                    height: 96,
                    displayValue: false,
                    background: '#FFFFFF',
                    lineColor: '#111827',
                    margin: 8,
                  }}
                  style={styles.barcode}
                />
              </View>

              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Код</Text>
                <Text style={styles.codeValue}>{code}</Text>
              </View>

              <Text style={styles.hintText}>
                Покажи баркода на каса. При нужда кодът може да бъде въведен и ръчно.
              </Text>
            </>
          ) : (
            <View style={styles.noCodeBox}>
              <Text style={styles.noCodeTitle}>Няма наличен код</Text>
              <Text style={styles.noCodeText}>
                В момента този промо код не може да бъде показан.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Полезно</Text>
          <Text style={styles.helpText}>
            За по-лесно сканиране увеличи яркостта на екрана на телефона.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  contentWrap: {
    padding: CARD_PADDING,
    paddingBottom: 28,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },

  copyToastFloating: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    zIndex: 50,
    backgroundColor: 'rgba(17,24,39,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  copyToastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  heroImage: {
    width: '100%',
    height: Math.round(SCREEN_WIDTH * 0.62),
    backgroundColor: '#e5e7eb',
  },

  heroPlaceholder: {
    width: '100%',
    height: Math.round(SCREEN_WIDTH * 0.62),
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroPlaceholderText: {
    color: '#64748b',
    fontWeight: '700',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },

  chip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(17,24,39,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  chipText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  infoCard: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#111827',
  },

  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },

  descriptionMuted: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#9ca3af',
  },

  barcodeCard: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  barcodeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  barcodeHeaderTextWrap: {
    flex: 1,
  },

  barcodeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  barcodeSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },

  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#111827',
  },

  copyBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },

  barcodeWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
  },

  barcode: {
    width: '100%',
    height: 92,
  },

  codeBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    alignItems: 'center',
  },

  codeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  codeValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 1,
  },

  hintText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
  },

  noCodeBox: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    alignItems: 'center',
  },

  noCodeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },

  noCodeText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
  },

  helpCard: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  helpTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },

  helpText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },

  pressed: {
    opacity: 0.92,
  },
});