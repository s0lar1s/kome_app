import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

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

function norm(v) {
  return String(v ?? '').trim();
}

function shortCode(v, max = 18) {
  const s = norm(v);
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

/**
 * Очаквани props:
 * - id
 * - title
 * - image
 * - category
 * - code (вече resolved: personal_code или default code)
 * - onPress(id)
 */
export default function PromoCodeCard({
  id,
  title,
  image,
  category,
  code,
  onPress,
}) {
  const imgUrl = useMemo(() => toUrl(PROMO_BASE, image), [image]);
  const badge = useMemo(() => categoryLabel(category), [category]);
  const codeShort = useMemo(() => shortCode(code), [code]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={() => onPress?.(id)}
    >
      <View style={styles.imageWrap}>
        {!!imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>PROMO</Text>
          </View>
        )}

        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {!!norm(title) && (
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        )}

        {!!norm(codeShort) && (
          <View style={styles.codePill}>
            <Text numberOfLines={1} style={styles.codeText}>
              {codeShort}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1, // квадратна визия
    backgroundColor: '#f1f5f9',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#94a3b8',
    fontWeight: '900',
    letterSpacing: 2,
  },

  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },

  content: {
    padding: 10,
    gap: 8,
  },

  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    minHeight: 18,
  },

  codePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  codeText: {
    color: '#3730a3',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
  },
});