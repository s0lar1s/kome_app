import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';

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

export default function BrochureCard({ id, title, image, onPress, style }) {
  const imgUrl = toUrl(BROCHURES_BASE, image);

  return (
    <TouchableOpacity onPress={() => onPress(id)} activeOpacity={0.9} style={[styles.card, style]}>
      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Брошура'}
        </Text>
      </View>      
      <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#eef2ff',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  hint: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
});
