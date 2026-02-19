import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { productsApi } from '../../Api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = SCREEN_WIDTH;

const PRODUCTS_BASE =
  'https://kome.bg/komeadmin/products/images/';

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
      return 'Ново';
    case 2:
      return 'Акцент';
    case 3:
      return 'Фокус';
    default:
      return null;
  }
}

export default function ProductsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const result = await productsApi.getById(id);
        setProduct(result?.data ?? null);
      } catch (e) {
        alert('Проблем при зареждане на продукта.');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loader}>
        <Text>Продуктът не е намерен.</Text>
      </View>
    );
  }

  const imgUrl = toUrl(PRODUCTS_BASE, product.image);
  const badge = categoryLabel(product.category);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imgUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>

        {product.content ? (
          <Text style={styles.description}>{product.content}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageWrapper: {
    position: 'relative',
  },

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

  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
});
