import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Linking,
  Platform,
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
  const [mapExpanded, setMapExpanded] = useState(false);

  const [userCoords, setUserCoords] = useState(null);
  const [locDenied, setLocDenied] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

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
    if (userCoords) {
      return {
        ...userCoords,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    if (shopsWithCoords.length > 0) {
      const { latitude, longitude } = shopsWithCoords[0].coords;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
    }

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

  const requestAndGetUserLocation = async (shouldAnimate = true) => {
    try {
      setGettingLocation(true);

      const currentPermission = await Location.getForegroundPermissionsAsync();
      let status = currentPermission.status;

      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setLocDenied(true);
        Alert.alert(
          'Локацията е изключена',
          'Разреши достъп до Location, за да покажем текущото ти местоположение.'
        );
        return null;
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

      if (shouldAnimate && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          350
        );
      }

      return coords;
    } catch (e) {
      Alert.alert('Грешка', 'Не успях да взема текущата локация.');
      return null;
    } finally {
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    fetchData();
    requestAndGetUserLocation(false);
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
    await requestAndGetUserLocation(true);
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
        <Pressable onPress={() => focusOnShop(item)} style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {!!coords ? <Text style={styles.pinBadge}>📍</Text> : null}
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
          <Pressable onPress={() => focusOnShop(item)} style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Покажи на картата</Text>
          </Pressable>

          <Pressable onPress={() => openShopDetails(item)} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Детайли</Text>
          </Pressable>

          <Pressable
            onPress={() => openExternalMaps({ title, address, coords })}
            style={styles.btnOutline}
          >
            <Text style={styles.btnOutlineText}>Навигация</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Търси магазин, град или адрес…"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clearBtnWrap}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.mapOuter}>
        <View style={[styles.mapCard, { height: mapExpanded ? 300 : 165 }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={!!userCoords}
          >
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

          <Pressable onPress={focusOnMe} style={styles.myLocationFab} hitSlop={10}>
            <Text style={styles.myLocationFabText}>
              {gettingLocation ? '…' : '⌖'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMapExpanded((v) => !v)}
            style={styles.expandHandle}
            hitSlop={10}
          >
            <Text style={styles.expandHandleText}>
              {mapExpanded ? '⌃' : '⌄'}
            </Text>
          </Pressable>

          {shopsWithCoords.length === 0 && (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayTitle}>Няма координати за обектите</Text>
              <Text style={styles.mapOverlayText}>
                Добави lat/lng в базата, за да се показват на картата.
              </Text>
            </View>
          )}

          {locDenied && (
            <View style={styles.locOverlay}>
              <Text style={styles.locOverlayTitle}>Локацията е изключена</Text>
              <Text style={styles.locOverlayText}>
                Разреши Location, за да виждаш текущото си местоположение.
              </Text>
            </View>
          )}
        </View>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  headerBlock: {
    backgroundColor: '#f8fafc',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  searchWrap: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    paddingVertical: 10,
  },

  clearBtnWrap: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },

  clearBtn: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '900',
  },

  mapOuter: {
    paddingBottom: 6,
    backgroundColor: '#f8fafc',
  },

  mapCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  myLocationFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  myLocationFabText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  expandHandle: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    minWidth: 44,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
  },

  expandHandleText: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '900',
    color: '#111827',
  },

  mapOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  mapOverlayTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },

  mapOverlayText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '700',
  },

  locOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  locOverlayTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },

  locOverlayText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '700',
  },

  card: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },

  cardSelected: {
    borderColor: '#111827',
    backgroundColor: '#fbfdff',
  },

  cardContent: {
    gap: 6,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#111827',
  },

  pinBadge: {
    fontSize: 13,
  },

  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },

  workTime: {
    fontSize: 13,
    lineHeight: 18,
    color: '#0f172a',
    fontWeight: '700',
  },

  desc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },

  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  btnGhost: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  btnGhostText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },

  btnPrimary: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  btnPrimaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },

  btnOutline: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },

  btnOutlineText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },

  emptyWrap: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
});