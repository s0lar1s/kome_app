import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeBrochures = useMemo(() => {
    if (!Array.isArray(brochures)) return [];

    return brochures
      .filter((b) => String(b?.state) === '1' || b?.state === 1)
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
  }, [brochures]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await brochuresApi.getAll();
      setBrochures(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      Alert.alert('Грешка', 'Проблем със зареждането на брошурите.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openBrochure = (item) => {
    navigation.navigate('Brochures', { id: item.id, title: item.title });
  };

  const renderItem = ({ item, index }) => {
    const imgUrl = toUrl(BROCHURES_BASE, item.image);

    return (
      <Pressable
        onPress={() => openBrochure(item)}
        android_ripple={{ color: '#e5e7eb' }}
        style={({ pressed }) => [
          styles.brochureCard,
          pressed && styles.cardPressed,
          index !== activeBrochures.length - 1 && styles.cardSpacing,
        ]}
      >
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={styles.brochureImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.brochureImage, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>Няма изображение</Text>
          </View>
        )}

        <View style={styles.brochureFooter}>
          <View style={styles.brochureTextWrap}>
            <Text style={styles.brochureTitle} numberOfLines={2}>
              {item.title || 'Брошура'}
            </Text>
            <Text style={styles.brochureHint}>Разгледай брошурата</Text>
          </View>

          <Text style={styles.brochureArrow}>›</Text>
        </View>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerWrap}>
      {/* <Text style={styles.pageTitle}>Актуални брошури</Text> */}
      <Text style={styles.pageSubtitle}>
        Разгледай последните оферти и промоции
      </Text>

      {!loading && activeBrochures.length > 0 ? (
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>
            {activeBrochures.length} активн{activeBrochures.length === 1 ? 'а' : 'и'} брошур{activeBrochures.length === 1 ? 'а' : 'и'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Зареждане на брошурите...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activeBrochures}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Няма активни брошури</Text>
              <Text style={styles.emptyText}>
                В момента няма публикувани активни брошури. Провери по-късно.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  headerWrap: {
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  counterPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },

  brochureCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardSpacing: {
    marginBottom: 14,
  },

  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },

  brochureImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#eef2ff',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },

  imagePlaceholderText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  brochureFooter: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  brochureTextWrap: {
    flex: 1,
  },

  brochureTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#111827',
  },

  brochureHint: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },

  brochureArrow: {
    fontSize: 28,
    lineHeight: 28,
    color: '#94a3b8',
    fontWeight: '400',
  },

  emptyWrap: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});