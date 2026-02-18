import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

function toNumber(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

async function openMaps(lat, lng, label = 'KOME') {
  const ll = `${lat},${lng}`;
  const encodedLabel = encodeURIComponent(label);

  const iosApple = `http://maps.apple.com/?daddr=${ll}&dirflg=d`;
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`;

  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL(iosApple);
      return;
    }

    const androidGoogleNav = `google.navigation:q=${ll}&mode=d`;
    const canNav = await Linking.canOpenURL('google.navigation:');
    if (canNav) {
      await Linking.openURL(androidGoogleNav);
      return;
    }

    await Linking.openURL(googleWeb);
  } catch {
    await Linking.openURL(googleWeb);
  }
}

function row(label, value) {
  const v = String(value ?? '').trim();
  if (!v) return null;
  return (
    <View style={styles.row} key={label}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{v}</Text>
    </View>
  );
}

export default function ShopDetailsScreen() {
  const route = useRoute();
  const shop = route?.params?.shop ?? {};

  const title = useMemo(() => {
    const city = String(shop?.city ?? '').trim();
    const store = String(shop?.store ?? '').trim();
    return [city, store].filter(Boolean).join(' • ') || 'Обект';
  }, [shop]);

  const lat = toNumber(shop?.lat);
  const lng = toNumber(shop?.lang); 
  const hasCoords = lat !== null && lng !== null;

  const coordsText = hasCoords ? `${lat}, ${lng}` : '';

  const onNavigate = () => {
    if (!hasCoords) return;
    openMaps(lat, lng, title);
  };

  const copyCoords = async () => {
    if (!hasCoords) return;
    await Clipboard.setStringAsync(coordsText);

    Alert.alert('Копирано', `Координатите са копирани:\n${coordsText}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>

      {hasCoords && (
        <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
          <Text style={styles.navBtnText}>🧭 Навигация</Text>
          <Text style={styles.navBtnHint}>
            Отвори {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}
          </Text>
        </TouchableOpacity>
      )}

      {row('Адрес', shop?.address)}
      {row('Работно време', shop?.work_time)}
      {row('Описание', shop?.description)}

      {/* Координати */}
      {hasCoords ? (
        <TouchableOpacity style={styles.row} onPress={copyCoords} activeOpacity={0.8}>
          <View style={styles.coordsHeader}>
            <Text style={styles.label}>Координати</Text>
            <Text style={styles.copyHint}>Натисни за копиране</Text>
          </View>
          <Text style={styles.value}>{coordsText}</Text>
        </TouchableOpacity>
      ) : (
        row('Координати', '')
      )}

      {!hasCoords && (
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>Няма координати</Text>
          <Text style={styles.warnText}>Добави lat/lang за този обект, за да работи навигацията.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 6 },

  navBtn: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    padding: 12,
    gap: 4,
  },
  navBtnText: { fontSize: 15, fontWeight: '900', color: '#4338ca' },
  navBtnHint: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  row: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  value: { fontSize: 14, color: '#111827', fontWeight: '700' },

  coordsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  copyHint: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
  },

  warnBox: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    gap: 4,
  },
  warnTitle: { fontSize: 13, fontWeight: '900', color: '#991b1b' },
  warnText: { fontSize: 13, color: '#7f1d1d', fontWeight: '600' },
});
