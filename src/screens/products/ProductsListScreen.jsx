import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { productsApi } from '../../Api';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../../components/ProductCard.jsx';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const GAP = 12;

const ITEM_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2;

const TABS = [
  { label: 'Всички', value: null },
  { label: 'Нови', value: 1 },
  { label: 'Акцент', value: 2 },
  { label: 'Фокус', value: 3 },
];

export default function ProductsListScreen() {
  const navigation = useNavigation();

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts(1, true);
  }, [category]);

  async function loadProducts(pageToLoad = 1, reset = false) {
    if (loading) return;

    setLoading(true);

    try {
      const result = await productsApi.getAll({
        page: pageToLoad,
        limit: 20,
        category,
      });

      const data = result?.data?.data ?? [];
      const meta = result?.data?.meta ?? {};

      setTotalPages(meta.pages ?? 1);
      setPage(pageToLoad);

      if (reset) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }
    } catch (e) {
      alert('Проблем със зареждането на продуктите.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleLoadMore() {
    if (page < totalPages && !loading) {
      loadProducts(page + 1);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadProducts(1, true);
  }

  function handleTabChange(value) {
    setCategory(value);
    setPage(1);
  }

  function renderItem({ item }) {
    return (
      <View style={{ width: ITEM_WIDTH, marginBottom: GAP }}>
        <ProductCard
          {...item}
          onPress={(id) =>
            navigation.navigate('ProductDetails', { id })
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab.value === category;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handleTabChange(tab.value)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: H_PADDING,
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    paddingVertical: 12,
    gap: 8,
  },

  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },

  tabActive: {
    backgroundColor: '#6366f1',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  tabTextActive: {
    color: '#fff',
  },
});
