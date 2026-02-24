import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { bannersApi, brochuresApi, productsApi } from '../Api';
import { useNavigation } from '@react-navigation/native';

import Banners from '../components/Banners.jsx';
import BrochureCard from '../components/BrochureCard.jsx';
import ProductCard from '../components/ProductCard.jsx';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const CARD_GAP = 12;

const BANNER_CARD_WIDTH = SCREEN_WIDTH - H_PADDING * 2;

const BROCHURE_CARD_WIDTH_BASE = SCREEN_WIDTH - H_PADDING * 2;
const BROCHURE_PEEK = 32;

const PRODUCT_CARD_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - CARD_GAP) / 2.2;

export default function HomeScreen() {
  const [banners, setBanners] = useState([]);
  const [brochures, setBrochures] = useState([]);
  const [products, setProducts] = useState([]);
  const [toggleRefresh, setToggleRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    async function fetchData() {
      setRefreshing(true);
      try {
        const [bannersResult, brochuresResult, productsResult] =
          await Promise.all([
            bannersApi.getAll(),
            brochuresApi.getAll(),
            productsApi.getHome(),
          ]);

        setBanners(Array.isArray(bannersResult?.data) ? bannersResult.data : []);
        setBrochures(Array.isArray(brochuresResult?.data) ? brochuresResult.data : []);
        setProducts(Array.isArray(productsResult?.data) ? productsResult.data : []);
      } catch (err) {
        alert('Проблем със зареждането на данните.');
      } finally {
        setRefreshing(false);
      }
    }

    fetchData();
  }, [toggleRefresh]);

  const refreshHandler = () => setToggleRefresh((s) => !s);

  const bannerPressHandler = (itemId) => {
    navigation.navigate('BannersDetail', { itemId });
  };

  const brochurePressHandler = (id) => {
    navigation.navigate('Brochures', { id });
  };

  const productPressHandler = (id) => {
    navigation.navigate('ProductDetails', { id });
  };

  const activeBrochures = useMemo(() => {
    if (!Array.isArray(brochures)) return [];
    return brochures.filter((b) => String(b?.state) === '1' || b?.state === 1);
  }, [brochures]);

  const brochureCardWidth =
    activeBrochures.length > 1
      ? BROCHURE_CARD_WIDTH_BASE - BROCHURE_PEEK
      : BROCHURE_CARD_WIDTH_BASE;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshHandler} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* =================== BANNERS =================== */}
      <View style={styles.section}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={BANNER_CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.sliderList}
        >
          {banners.map((item) => (
            <View key={item.id} style={[styles.slide, { width: BANNER_CARD_WIDTH }]}>
              <Banners {...item} onPress={bannerPressHandler} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* =================== BROCHURES =================== */}
      <View style={styles.section}>
        {activeBrochures.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Няма активни брошури</Text>
            <Text style={styles.emptyText}>Провери по-късно.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={brochureCardWidth + CARD_GAP}
            snapToAlignment="start"
            contentContainerStyle={styles.sliderList}
          >
            {activeBrochures.map((b) => (
              <View key={b.id} style={[styles.slide, { width: brochureCardWidth }]}>
                <BrochureCard
                  {...b}
                  onPress={brochurePressHandler}
                  style={{ width: '100%' }}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* =================== PRODUCTS =================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Продукти</Text>
          <Text
            style={styles.viewAll}
            onPress={() => navigation.navigate('Products')}
          >
            Виж всички
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={PRODUCT_CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.sliderList}
        >
          {products.map((p) => (
            <View key={p.id} style={[styles.slide, { width: PRODUCT_CARD_WIDTH }]}>
              <ProductCard
                {...p}
                onPress={productPressHandler}
                style={{ width: '100%' }}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  section: {
    paddingHorizontal: H_PADDING,
    paddingTop: 16,
    paddingBottom: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },

  sliderList: {
    paddingRight: H_PADDING,
  },

  slide: {
    marginRight: CARD_GAP,
  },

  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },

  bottomPadding: {
    height: 24,
  },
});
