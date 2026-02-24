import React, { useEffect, useMemo, useState } from 'react';
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
  // седмични = category 1 (по твоята логика)
  if (Number(item?.category) === 1) return 'Седмичен код';
  // персонален = is_personal=1 (идва от API)
  if (Number(item?.is_personal) === 1) return 'Персонален код';
  return 'Промо код';
}

export default function PromoCodeDetailsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

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
    };
  }, [id]);

  const code = useMemo(() => normCode(item?.code), [item?.code]);
  const imgUrl = useMemo(() => toUrl(PROMO_BASE, item?.image), [item?.image]);

  async function copyCode() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Готово', 'Кодът е копиран.');
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loader}>
        <Text>Промо кодът не е намерен.</Text>
      </View>
    );
  }

  const chip = typeLabel(item);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentWrap}>
      {/* Image card */}
      <View style={styles.heroCard}>
        {!!imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>Няма снимка</Text>
          </View>
        )}

        <View style={styles.chip}>
          <Text style={styles.chipText}>{chip}</Text>
        </View>
      </View>

      {/* Barcode card */}
      <View style={styles.barcodeCard}>
        <View style={styles.barcodeHeader}>
          <Text style={styles.barcodeTitle}>Сканирай на каса</Text>
          {!!code ? (
            <Pressable onPress={copyCode} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Копирай</Text>
            </Pressable>
          ) : null}
        </View>

        {!!code ? (
          <>
            <View style={styles.barcodeWrap}>
              <Barcode value={code} options={{ format: 'CODE128' }} style={styles.barcode} />
            </View>

            <Text style={styles.hintText}>
              Покажи баркода на каса. Ако ти поискат код – натисни „Копирай“.
            </Text>
          </>
        ) : (
          <Text style={styles.hintText}>Няма наличен код за показване.</Text>
        )}
      </View>

      {/* Text content */}
      <View style={styles.textCard}>
        {!!item.title ? <Text style={styles.title}>{item.title}</Text> : null}
        {!!item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : (
          <Text style={styles.descriptionMuted}>Няма допълнителна информация.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  contentWrap: {
    padding: CARD_PADDING,
    paddingBottom: 28,
    gap: 12,
  },

  // Hero image card
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
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
    color: '#6b7280',
    fontWeight: '700',
  },
  chip: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(17,24,39,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Barcode card
  barcodeCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  barcodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  barcodeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  copyBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  barcodeWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  barcode: {
    width: '100%',
    height: 86,
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Text card
  textCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  descriptionMuted: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9ca3af',
  },
});