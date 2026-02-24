import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { promoCodesApi } from '../../Api';
import PromoCodeCard from '../../components/PromoCodeCard.jsx';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2;

const TABS = [
  { label: 'Седмични', value: 'weekly' },
  { label: 'Персонални', value: 'personal' },
];

export default function PromoCodesListScreen() {
  const navigation = useNavigation();

  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('weekly');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Сървърно дърпим "всички видими" (public + assigned) и после филтрираме локално по таб.
  // Така "Персонални" ще работи истински (is_personal=1), а не през category.
  useEffect(() => {
    loadItems(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadItems(pageToLoad = 1, reset = false) {
    if (loading) return;
    setLoading(true);

    try {
      const result = await promoCodesApi.getAll({
        page: pageToLoad,
        limit: 30,
        category: null, // не филтрираме по категория от API
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
    if (page < totalPages && !loading) loadItems(page + 1);
  }

  function handleRefresh() {
    setRefreshing(true);
    loadItems(1, true);
  }

  const filtered = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    if (tab === 'personal') {
      return arr.filter((x) => Number(x?.is_personal) === 1);
    }
    // weekly
    return arr.filter((x) => Number(x?.category) === 1);
  }, [items, tab]);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.h1}>Промо кодове</Text>
        <Text style={styles.sub}>
          {tab === 'weekly'
            ? 'Седмични оферти.'
            : 'Твоите персонални кодове.'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.value)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Empty state */}
      {!loading && filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {tab === 'weekly' ? 'Няма активни седмични кодове.' : 'Нямаш персонални кодове.'}
          </Text>
          <Text style={styles.emptyText}>
            {tab === 'personal'
              ? 'Когато има специални предложения за теб, ще се появят тук.'
              : 'Провери пак по-късно.'}
          </Text>
        </View>
      ) : null}

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: H_PADDING,
        }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 40,
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={
          loading ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },

  header: {
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 6,
  },
  h1: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    paddingVertical: 10,
    gap: 10,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },

  tabActive: { backgroundColor: '#6366f1' },

  tabText: { fontSize: 14, fontWeight: '800', color: '#374151' },

  tabTextActive: { color: '#fff' },

  empty: {
    marginHorizontal: H_PADDING,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#111827' },
  emptyText: { marginTop: 4, fontSize: 13, color: '#6b7280', lineHeight: 18 },
});