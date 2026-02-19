import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';

const PRODUCTS_BASE = 'https://kome.bg/komeadmin/products/images/';

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

export default function ProductCard({ id, title, image, onPress, style }) {
  const imgUrl = toUrl(PRODUCTS_BASE, image);

  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Image
        source={{ uri: imgUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>
          {title || 'Продукт'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
  },

  footer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});

