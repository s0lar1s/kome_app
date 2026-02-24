import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Barcode } from 'expo-barcode-generator';
import { promoCodesApi } from '../../Api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = SCREEN_WIDTH;

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

function categoryLabel(cat) {
  switch (Number(cat)) {
    case 1:
      return 'Категория 1';
    case 2:
      return 'Категория 2';
    case 3:
      return 'Категория 3';
    default:
      return null;
  }
}

function normCode(v) {
  return String(v ?? '').trim();
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
        alert('Проблем при зареждане на промо кода.');
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

  const imgUrl = toUrl(PROMO_BASE, item.image);
  const badge = categoryLabel(item.category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.imageWrapper}>
        {!!imgUrl && (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        )}

        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      {/* Barcode + code */}
      <View style={styles.barcodeCard}>
        <Text style={styles.barcodeTitle}>Твоят промо код</Text>

        {code ? (
          <>
            <View style={styles.barcodeWrap}>
              <Barcode
                value={code}
                options={{ format: 'CODE128' }}
                style={styles.barcode}
              />
            </View>

            <Text style={styles.codeText}>{code}</Text>
            <Text style={styles.hintText}>
              Покажи кода на каса или го въведи при нужда.
            </Text>
          </>
        ) : (
          <Text style={styles.hintText}>Няма наличен код за показване.</Text>
        )}
      </View>

      <View style={styles.content}>
        {!!item.title && <Text style={styles.title}>{item.title}</Text>}
        {!!item.description && <Text style={styles.description}>{item.description}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  imageWrapper: { position: 'relative' },

  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: '#f1f5f9',
  },

  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  barcodeCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  barcodeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  barcodeWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  // expo-barcode-generator е view; ширина/височина идват от layout-а.
  barcode: {
    width: '100%',
    height: 90,
  },

  codeText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#111827',
    textAlign: 'center',
  },

  hintText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
    textAlign: 'center',
  },

  content: { padding: 16 },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  description: { fontSize: 15, lineHeight: 22, color: '#374151' },
});