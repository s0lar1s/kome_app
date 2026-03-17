import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Pressable,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { bannersApi, brochuresApi, productsApi } from '../Api';

import TopBrandBar from '../components/TopBrandBar';
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

const CC_IMG_URL =
  'https://kome.bg/komeadmin/cc/images/Client_Card_Front.jpg';

function isActive(v) {
  return String(v) === '1' || v === 1;
}

function HeaderRow({ title, ctaLabel = 'Виж всички', onPress }) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>

      {!!onPress && (
        <Pressable
          onPress={onPress}
          hitSlop={10}
          style={({ pressed }) => [
            styles.ctaBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const [banners, setBanners] = useState([]);
  const [brochures, setBrochures] = useState([]);
  const [products, setProducts] = useState([]);
  const [toggleRefresh, setToggleRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const navigation = useNavigation();

  const navigateToParentTab = (candidateNames) => {
    let nav = navigation.getParent?.();

    while (nav) {
      const state = nav.getState?.();
      const routeNames = state?.routeNames || [];

      const found = candidateNames.find((name) => routeNames.includes(name));
      if (found) {
        nav.navigate(found);
        return true;
      }

      nav = nav.getParent?.();
    }

    console.warn('No matching parent tab found for:', candidateNames);
    return false;
  };

  const goToBrochuresTab = () => {
    navigateToParentTab([
      'Brochures',
      'BrochuresTab',
      'BrochuresFlow',
      'BrochuresNavigator',
    ]);
  };

  const goToClientCardsTab = () => {
    navigateToParentTab([
      'ClientCards',
      'ClientCardsTab',
      'ClientCardsFlow',
      'ClientCardsNavigator',
    ]);
  };

  useEffect(() => {
    async function fetchData() {
      if (!refreshing) setInitialLoading(true);

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
        Alert.alert('Грешка', 'Проблем със зареждането на данните.');
      } finally {
        setRefreshing(false);
        setInitialLoading(false);
      }
    }

    fetchData();
  }, [toggleRefresh, refreshing]);

  const refreshHandler = () => {
    setRefreshing(true);
    setToggleRefresh((s) => !s);
  };

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
    return brochures.filter((b) => isActive(b?.state));
  }, [brochures]);

  const brochureCardWidth =
    activeBrochures.length > 1
      ? BROCHURE_CARD_WIDTH_BASE - BROCHURE_PEEK
      : BROCHURE_CARD_WIDTH_BASE;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <TopBrandBar />

      {initialLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>Зареждане на началния екран...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshHandler} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.section, styles.heroSection]}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Добре дошли в Kome CBA</Text>
              <Text style={styles.heroSubtitle}>
                Актуални предложения, брошури, продукти и клиентска карта – всичко на едно място.
              </Text>
            </View>
          </View>

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

          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Клиентска карта
              </Text>

              <Pressable
                onPress={goToClientCardsTab}
                style={({ pressed }) => [
                  styles.ccHeroWrap,
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  source={{ uri: CC_IMG_URL }}
                  style={styles.ccHeroImg}
                  resizeMode="cover"
                />
              </Pressable>

              <Text style={styles.ccDesc} numberOfLines={2}>
                Събирай пари от покупките си и ги използвай във всеки магазин KOME CBA.
              </Text>

              <View style={styles.ccButtonsRow}>
                <Pressable
                  onPress={goToClientCardsTab}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.ccBtnPrimaryWide,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.ccBtnPrimaryText}>Карти</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('CardHowToGet')}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.ccBtnGhostWide,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.ccBtnGhostText}>Инфо</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <HeaderRow
                title="Брошура"
                ctaLabel="Всички"
                onPress={goToBrochuresTab}
              />

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
                  contentContainerStyle={styles.sliderListTight}
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
          </View>

          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <HeaderRow
                title="Продукти"
                ctaLabel="Всички"
                onPress={() => navigation.navigate('Products')}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={PRODUCT_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                contentContainerStyle={styles.sliderListTight}
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
          </View>

          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <HeaderRow
                title="Магазини"
                ctaLabel="Обекти"
                onPress={() => navigation.navigate('ShopsList')}
              />

              <View style={styles.shopInfoRow}>
                <Text style={styles.shopInfoText} numberOfLines={1}>
                  35 магазина • адреси • работно време • най-близък обект
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },

  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f6f7fb',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  heroSection: {
    paddingTop: 12,
    paddingBottom: 4,
  },

  heroCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 2 },
    }),
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },

  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 10,
  },

  sectionCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },

  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },

  ctaBtn: {
    flexShrink: 0,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
  },

  ctaBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  sliderList: {
    paddingRight: 16,
  },

  sliderListTight: {
    paddingRight: 6,
  },

  slide: {
    marginRight: 12,
  },

  ccHeroWrap: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  ccHeroImg: {
    width: '100%',
    height: 170,
  },

  ccDesc: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  ccButtonsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },

  ccBtnPrimaryWide: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
  },

  ccBtnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },

  ccBtnGhostWide: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },

  ccBtnGhostText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },

  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },

  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },

  shopInfoRow: {
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  shopInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  pressed: {
    opacity: 0.9,
  },

  bottomPadding: {
    height: 10,
  },
});