import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { brochuresApi } from '../../Api';

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

export default function BrochuresListScreen() {
  const navigation = useNavigation();

  const [brochures, setBrochures] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const activeBrochures = useMemo(() => {
    if (!Array.isArray(brochures)) return [];
    return brochures.filter((b) => String(b?.state) === '1' || b?.state === 1);
  }, [brochures]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await brochuresApi.getAll();
      setBrochures(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      alert('Проблем със зареждането на брошурите.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openBrochure = (item) => {
    navigation.navigate('Brochures', { id: item.id });
  };

  const renderItem = ({ item }) => {
    const imgUrl = toUrl(BROCHURES_BASE, item.image);

    return (
      <Pressable onPress={() => openBrochure(item)} style={styles.brochureCard}>
        <View style={styles.brochureFooter}>
          <Text style={styles.brochureTitle} numberOfLines={1}>
            {item.title || 'Брошура'}
          </Text>
        </View>
        <Image source={{ uri: imgUrl }} style={styles.brochureImage} resizeMode="cover" />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={activeBrochures}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        showsVerticalScrollIndicator={false}
        // ListHeaderComponent={<Text style={styles.pageTitle}>Актуални брошури 2</Text>}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Няма активни брошури</Text>
              <Text style={styles.emptyText}>Провери по-късно.</Text>
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

  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },

  brochureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  brochureImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#eef2ff',
  },
  brochureFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  brochureTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  brochureHint: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366f1',
  },

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
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
});
