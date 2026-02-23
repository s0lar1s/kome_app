import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { shopsApi } from '../../Api';

function norm(v) {
  return String(v ?? '').trim();
}

function includesCI(haystack, needle) {
  if (!needle) return true;
  return norm(haystack).toLowerCase().includes(needle);
}

function getCoords(item) {
  const latRaw = item?.lat ?? item?.latitude;
  const lngRaw = item?.lang ?? item?.lng ?? item?.lon ?? item?.longitude;

  const lat = Number.parseFloat(String(latRaw ?? '').replace(',', '.'));
  const lng = Number.parseFloat(String(lngRaw ?? '').replace(',', '.'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}

function openExternalMaps({ title, address, coords }) {
  if (coords) {
    const { latitude, longitude } = coords;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${encodeURIComponent(title || 'Магазин')}&ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(title || 'Магазин')})`;
    Linking.openURL(url).catch(() => {});
    return;
  }

  const q = encodeURIComponent([title, address].filter(Boolean).join(' - '));
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${q}`
      : `geo:0,0?q=${q}`;
  Linking.openURL(url).catch(() => {});
}

export default function ShopsListScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [shops, setShops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // USER LOCATION
  const [userCoords, setUserCoords] = useState(null);
  const [locDenied, setLocDenied] = useState(false);

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

  const shopsWithCoords = useMemo(() => {
    return filteredShops
      .map((s) => ({ shop: s, coords: getCoords(s) }))
      .filter((x) => !!x.coords);
  }, [filteredShops]);

  const initialRegion = useMemo(() => {
    // 0) ако имаме user coords -> старт там (по-приятно)
    if (userCoords) {
      return {
        ...userCoords,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    // 1) ако има координати на магазини
    if (shopsWithCoords.length > 0) {
      const { latitude, longitude } = shopsWithCoords[0].coords;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
    }

    // 2) fallback (София)
    return {
      latitude: 42.6977,
      longitude: 23.3219,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    };
  }, [shopsWithCoords, userCoords]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await shopsApi.getAll();
      setShops(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      Alert.alert('Грешка', 'Проблем със зареждането на обектите.');
    } finally {
      setRefreshing(false);
    }
  };

  // get user location once
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocDenied(true);
        return;
      }

      setLocDenied(false);

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      setUserCoords(coords);

      // ако картата е заредена, центрирай към него (само първия път)
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          },
          350
        );
      }
    } catch (e) {
      // тиха грешка
    }
  };

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  const openShopDetails = (item) => {
    navigation.navigate('ShopDetails', { shop: item, id: item?.id });
  };

  const focusOnShop = (item) => {
    setSelectedId(item?.id);

    const coords = getCoords(item);
    if (!coords || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      350
    );
  };

  const focusOnMe = async () => {
    if (!userCoords) {
      await getUserLocation();
      return;
    }
    if (!mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        ...userCoords,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350
    );
  };

  const renderItem = ({ item }) => {
    const city = norm(item?.city);
    const store = norm(item?.store);
    const address = norm(item?.address);
    const workTime = norm(item?.work_time);
    const desc = norm(item?.description);

    const title = [city, store].filter(Boolean).join(' • ') || 'Обект';
    const isSelected = String(selectedId) === String(item?.id);
    const coords = getCoords(item);

    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <Pressable onPress={() => focusOnShop(item)} style={{ gap: 6 }}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {!!coords && <Text style={styles.pinBadge}>📍</Text>}
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
        </Pressable>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => openShopDetails(item)} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Виж детайли</Text>
          </Pressable>

          <Pressable
            onPress={() => openExternalMaps({ title, address, coords })}
            style={styles.btnGhost}
          >
            <Text style={styles.btnGhostText}>Навигация</Text>
          </Pressable>
        </View>
      </View>
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
      {/* MAP */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
        >
          {/* USER MARKER */}
          {userCoords && (
            <Marker
              coordinate={userCoords}
              title="Ти си тук"
              pinColor="#f59e0b" // жълто/оранжево
            />
          )}

          {/* SHOPS MARKERS */}
          {shopsWithCoords.map(({ shop, coords }) => {
            const city = norm(shop?.city);
            const store = norm(shop?.store);
            const title = [city, store].filter(Boolean).join(' • ') || 'Обект';

            return (
              <Marker
                key={String(shop?.id)}
                coordinate={coords}
                title={title}
                description={norm(shop?.address)}
                onPress={() => setSelectedId(shop?.id)}
              />
            );
          })}
        </MapView>

        {/* BUTTON: MY LOCATION */}
        <Pressable onPress={focusOnMe} style={styles.myLocBtn}>
          <Text style={styles.myLocText}>Моята локация</Text>
        </Pressable>

        {/* Ако няма координати за магазини */}
        {shopsWithCoords.length === 0 && (
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>Няма координати за обектите</Text>
            <Text style={styles.mapOverlayText}>
              Добави lat/lng в базата (или направи geocoding), за да се показват на картата.
            </Text>
          </View>
        )}

        {/* Ако локацията е отказана */}
        {locDenied && (
          <View style={styles.locOverlay}>
            <Text style={styles.locOverlayTitle}>Локацията е изключена</Text>
            <Text style={styles.locOverlayText}>
              Разреши Location, за да виждаш “Ти си тук”.
            </Text>
          </View>
        )}
      </View>

      {/* LIST */}
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

  mapWrap: {
    height: 230,
    backgroundColor: '#e5e7eb',
  },

  myLocBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  myLocText: { fontSize: 12, fontWeight: '900', color: '#111827' },

  mapOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mapOverlayTitle: { fontSize: 13, fontWeight: '900', color: '#111827', marginBottom: 4 },
  mapOverlayText: { fontSize: 12, color: '#475569', fontWeight: '700' },

  locOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locOverlayTitle: { fontSize: 13, fontWeight: '900', color: '#111827', marginBottom: 4 },
  locOverlayText: { fontSize: 12, color: '#475569', fontWeight: '700' },

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
    gap: 10,
  },

  cardSelected: {
    borderColor: '#6366f1',
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

  pinBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
  },

  meta: { fontSize: 13, color: '#334155' },

  workTime: { fontSize: 13, color: '#0f172a', fontWeight: '700' },

  desc: { fontSize: 13, color: '#64748b' },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  btnPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  btnGhost: {
    width: 110,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  btnGhostText: { color: '#111827', fontWeight: '900', fontSize: 13 },

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