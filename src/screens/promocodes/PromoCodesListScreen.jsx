import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { promoCodesApi } from '../../Api';
import PromoCodeCard from '../../components/PromoCodeCard.jsx';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const GAP = 12;

const ITEM_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2;

const TABS = [
  { label: 'Всички', value: null },
  { label: 'Категория 1', value: 1 },
  { label: 'Категория 2', value: 2 },
  { label: 'Категория 3', value: 3 },
];

export default function PromoCodesListScreen() {
  const navigation = useNavigation();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function loadItems(pageToLoad = 1, reset = false) {
    if (loading) return;
    setLoading(true);

    try {
      const result = await promoCodesApi.getAll({
        page: pageToLoad,
        limit: 20,
        category,
      });

      const data = result?.data?.data ?? [];
      const meta = result?.data?.meta ?? {};

      setTotalPages(meta.pages ?? 1);
      setPage(pageToLoad);

      if (reset) setItems(data);
      else setItems((prev) => [...prev, ...data]);
    } catch (e) {
      alert('Проблем със зареждането на промо кодовете.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleLoadMore() {
    if (page < totalPages && !loading) {
      loadItems(page + 1);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadItems(1, true);
  }

  function handleTabChange(value) {
    setCategory(value);
    setPage(1);
  }

  function renderItem({ item }) {
    return (
      <View style={{ width: ITEM_WIDTH, marginBottom: GAP }}>
        <PromoCodeCard
          {...item}
          onPress={(id) => navigation.navigate('PromoCodeDetails', { id })}
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
        data={items}
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
  container: { flex: 1, backgroundColor: '#f8f8f8' },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap', // ако табовете станат по-дълги да не се чупи
  },

  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },

  tabActive: { backgroundColor: '#6366f1' },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  tabTextActive: { color: '#fff' },
});