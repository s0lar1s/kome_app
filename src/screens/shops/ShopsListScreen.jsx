import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { shopsApi } from '../../Api';

function norm(v) {
  return String(v ?? '').trim();
}

function includesCI(haystack, needle) {
  if (!needle) return true;
  return norm(haystack).toLowerCase().includes(needle);
}

export default function ShopsListScreen() {
  const navigation = useNavigation();

  const [shops, setShops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const activeShops = useMemo(() => {
    if (!Array.isArray(shops)) return [];
    return shops.filter((s) => String(s?.state) === '1' || s?.state === 1);
  }, [shops]);

  const q = useMemo(() => norm(query).toLowerCase(), [query]);

  const filteredShops = useMemo(() => {
    if (!q) return activeShops;

    return activeShops.filter((s) => {
      return (
        includesCI(s?.city, q) ||
        includesCI(s?.store, q) ||
        includesCI(s?.address, q) ||
        includesCI(s?.description, q) ||
        includesCI(s?.work_time, q)
      );
    });
  }, [activeShops, q]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await shopsApi.getAll();
      setShops(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      alert('Проблем със зареждането на обектите.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openShop = (item) => {
    navigation.navigate('ShopDetails', { shop: item, id: item?.id });
  };

  const renderItem = ({ item }) => {
    const city = norm(item?.city);
    const store = norm(item?.store);
    const address = norm(item?.address);
    const workTime = norm(item?.work_time);
    const desc = norm(item?.description);

    const title = [city, store].filter(Boolean).join(' • ') || 'Обект';

    return (
      <Pressable onPress={() => openShop(item)} style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {/* <Text style={styles.badge}>ОБЕКТ</Text> */}
        </View>

        {!!address && (
          <Text style={styles.meta} numberOfLines={2}>
            {address}
          </Text>
        )}

        {!!workTime && (
          <Text style={styles.workTime} numberOfLines={2}>
            Работно време: {workTime}
          </Text>
        )}

        {!!desc && (
          <Text style={styles.desc} numberOfLines={3}>
            {desc}
          </Text>
        )}

        <Text style={styles.hint}>Виж детайли →</Text>
      </Pressable>
    );
  };

  const ListHeader = (
    <View style={styles.searchWrap}>
      <Text style={styles.pageTitle}>Коме магазини</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Търси по град, магазин, адрес…"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing" 
      />

      {!!q && (
        <Text style={styles.resultHint}>
          Резултати: {filteredShops.length} / {activeShops.length}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredShops}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]} 
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>
                {q ? 'Няма резултати' : 'Няма активни обекти'}
              </Text>
              <Text style={styles.emptyText}>
                {q ? 'Пробвай с друга дума.' : 'Провери по-късно.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  searchWrap: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  searchInput: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
  },

  resultHint: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },

  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 6,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  badge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6366f1',
  },

  meta: { fontSize: 13, color: '#334155' },

  workTime: { fontSize: 13, color: '#0f172a', fontWeight: '700' },

  desc: { fontSize: 13, color: '#64748b' },

  hint: { marginTop: 2, fontSize: 13, fontWeight: '800', color: '#6366f1' },

  emptyWrap: {
    marginTop: 30,
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
  emptyText: { fontSize: 13, color: '#64748b' },
});
