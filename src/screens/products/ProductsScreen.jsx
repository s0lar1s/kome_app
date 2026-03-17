import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { productsApi } from '../../Api';

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchProduct() {
      setLoading(true);
      setFailed(false);

      try {
        const result = await productsApi.getById(id);
        if (!mounted) return;
        setProduct(result?.data ?? null);
      } catch (e) {
        if (!mounted) return;
        setFailed(true);
        Alert.alert('Грешка', 'Проблем при зареждане на продукта.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Зареждане на продукта...</Text>
      </View>
    );
  }

  if (failed || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Продуктът не е намерен</Text>
        <Text style={styles.errorText}>Моля, опитай отново по-късно.</Text>
      </View>
    );
  }

  const imgUrl = toUrl(PRODUCTS_BASE, product.image);
  const badge = categoryLabel(product.category);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageCard}>
          {imgUrl ? (
            <Image
              source={{ uri: imgUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imagePlaceholderText}>Няма изображение</Text>
            </View>
          )}

          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.title}>{product.title}</Text>

          {product.content ? (
            <Text style={styles.description}>{product.content}</Text>
          ) : (
            <Text style={styles.descriptionMuted}>
              Няма допълнителна информация за този продукт.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
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

  imageCard: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#f1f5f9',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },

  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 30,
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },

  descriptionMuted: {
    fontSize: 14,
    lineHeight: 22,
    color: '#94a3b8',
  },
});