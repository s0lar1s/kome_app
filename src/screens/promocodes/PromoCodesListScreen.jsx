import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { promoCodesApi } from '../../Api';
import PromoCodeCard from '../../components/PromoCodeCard.jsx';
import TopBrandBar from '../../components/TopBrandBar';

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

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];

    if (tab === 'personal') {
      return arr.filter((x) => Number(x?.is_personal) === 1);
    }

    return arr.filter((x) => Number(x?.category) === 1);
  }, [items, tab]);

  const currentTabText =
    tab === 'weekly'
      ? 'Седмични оферти и актуални предложения.'
      : 'Твоите персонални промо кодове и специални оферти.';

  const loadItems = useCallback(async (pageToLoad = 1, mode = 'initial') => {
    if (mode === 'loadMore' && loadingMore) return;

    if (mode === 'initial') setInitialLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'loadMore') setLoadingMore(true);

    try {
      const result = await promoCodesApi.getAll({
        page: pageToLoad,
        limit: 30,
        category: null,
      });

      const data = result?.data?.data ?? [];
      const meta = result?.data?.meta ?? {};

      setTotalPages(meta.pages ?? 1);
      setPage(pageToLoad);

      if (mode === 'initial' || mode === 'refresh') {
        setItems(data);
      } else {
        setItems((prev) => {
          const prevIds = new Set(prev.map((x) => String(x.id)));
          const next = data.filter((x) => !prevIds.has(String(x.id)));
          return [...prev, ...next];
        });
      }
    } catch (e) {
      Alert.alert('Грешка', 'Проблем със зареждането на промо кодовете.');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    loadItems(1, 'initial');
  }, [loadItems]);

  function handleLoadMore() {
    if (page < totalPages && !loadingMore && !initialLoading && !refreshing) {
      loadItems(page + 1, 'loadMore');
    }
  }

  function handleRefresh() {
    loadItems(1, 'refresh');
  }

  function renderItem({ item }) {
    return (
      <View style={styles.itemWrap}>
        <PromoCodeCard
          {...item}
          onPress={(id) => navigation.navigate('PromoCodeDetails', { id })}
        />
      </View>
    );
  }

  function renderHeader() {
    return (
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.h1}>Промо кодове</Text>
          <Text style={styles.sub}>{currentTabText}</Text>

          {!initialLoading ? (
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                {filtered.length} {filtered.length === 1 ? 'активен код' : 'активни кода'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tabsShell}>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const active = t.value === tab;

              return (
                <Pressable
                  key={t.value}
                  onPress={() => setTab(t.value)}
                  style={({ pressed }) => [
                    styles.tab,
                    active && styles.tabActive,
                    pressed && styles.tabPressed,
                  ]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (initialLoading) return null;

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>
          {tab === 'weekly' ? '🏷️' : '🎁'}
        </Text>

        <Text style={styles.emptyTitle}>
          {tab === 'weekly'
            ? 'Няма активни седмични кодове'
            : 'Нямаш персонални кодове'}
        </Text>

        <Text style={styles.emptyText}>
          {tab === 'personal'
            ? 'Когато има специални предложения за теб, ще се появят тук.'
            : 'Провери отново по-късно за нови седмични оферти.'}
        </Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <TopBrandBar />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.h1}>Промо кодове</Text>
            <Text style={styles.sub}>Зареждане на активните предложения...</Text>
          </View>

          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Моля, изчакай момент...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <TopBrandBar />

      <View style={styles.container}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={filtered.length > 0 ? styles.columnWrap : undefined}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator />
              </View>
            ) : (
              <View style={styles.footerSpace} />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  headerWrap: {
    paddingTop: 12,
    paddingBottom: 8,
  },

  header: {
    paddingHorizontal: H_PADDING,
  },

  h1: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },

  sub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  counterPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },

  counterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },

  tabsShell: {
    paddingHorizontal: H_PADDING,
    marginTop: 14,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#eef2f7',
    borderRadius: 18,
    padding: 4,
    gap: 6,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  tabPressed: {
    opacity: 0.92,
  },

  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },

  tabTextActive: {
    color: '#111827',
  },

  listContent: {
    paddingBottom: 28,
    paddingTop: 2,
  },

  columnWrap: {
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
  },

  itemWrap: {
    width: ITEM_WIDTH,
    marginBottom: GAP,
  },

  empty: {
    marginHorizontal: H_PADDING,
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  footerLoader: {
    paddingVertical: 18,
  },

  footerSpace: {
    height: 18,
  },
});