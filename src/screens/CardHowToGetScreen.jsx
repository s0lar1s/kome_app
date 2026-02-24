import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CC_IMG_URL =
  'https://kome.bg/komeadmin/cc/images/Client_Card_Front.jpg';

function TabButton({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.tabBtn,
        active && styles.tabBtnActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Bullet({ children }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function CardHowToGetScreen({ navigation }) {
  const [tab, setTab] = useState('physical'); // 'physical' | 'virtual'

  const title = useMemo(() => {
    return tab === 'physical' ? 'Физическа карта' : 'Виртуална карта';
  }, [tab]);

  const subtitle = useMemo(() => {
    return tab === 'physical'
      ? 'Получава се на място в обект.'
      : 'Регистрираш я сам от телефона – без посещение на магазин.';
  }, [tab]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HERO */}
      <View style={styles.heroCard}>
        <Image source={{ uri: CC_IMG_URL }} style={styles.heroImg} resizeMode="cover" />

        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Клиентска карта KOME CBA</Text>
          <Text style={styles.heroDesc} numberOfLines={2}>
            Събираш пари от покупките си и ги използваш във всички магазини.
          </Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrap}>
        <TabButton
          label="Физическа"
          active={tab === 'physical'}
          onPress={() => setTab('physical')}
        />
        <TabButton
          label="Виртуална"
          active={tab === 'virtual'}
          onPress={() => setTab('virtual')}
        />
      </View>

      {/* CONTENT CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>

        {tab === 'physical' ? (
          <>
            <View style={styles.divider} />

            <Text style={styles.sectionH}>Как се взима</Text>
            <Bullet>Посети удобен за теб магазин KOME CBA.</Bullet>
            <Bullet>Поискай издаване на клиентска карта на каса/инфо точка (според обекта).</Bullet>
            <Bullet>Картата се активира и започваш да я ползваш веднага.</Bullet>

            <View style={styles.divider} />

            <Text style={styles.sectionH}>Кога е подходяща</Text>
            <Bullet>Ако предпочиташ пластика в портфейла си.</Bullet>
            <Bullet>Ако не искаш да използваш телефон при пазаруване.</Bullet>
          </>
        ) : (
          <>
            <View style={styles.divider} />

            <Text style={styles.sectionH}>Как работи</Text>
            <Bullet>Създаваш я сам през приложението – за минута.</Bullet>
            <Bullet>Не е нужно да ходиш до обект за издаване.</Bullet>
            <Bullet>Ползваш я директно от телефона при пазаруване.</Bullet>

            <View style={styles.divider} />

            <Text style={styles.sectionH}>Важно</Text>
            <Bullet>
              Виртуалната карта е <Text style={styles.bold}>абсолютно същата</Text> като физическата –
              същите правила, същото натрупване и използване.
            </Bullet>
            <Bullet>Разликата е само в начина на издаване и носене – в телефона.</Bullet>

            {/* <Pressable
              onPress={() => navigation.navigate('VirtualCardCreate')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryBtnText}>Създай виртуална карта</Text>
            </Pressable> */}
          </>
        )}
      </View>

      {/* FOOT NOTE */}
      <Text style={styles.footNote}>
        Ако вече имаш карта, можеш да я добавиш към профила си от „Карти“.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  content: { padding: 16, paddingBottom: 24 },

  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  heroImg: { width: '100%', height: 170, backgroundColor: '#f1f5f9' },
  heroTextWrap: { padding: 14 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  heroDesc: { marginTop: 4, fontSize: 13, color: '#64748b', lineHeight: 18 },

  tabsWrap: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabBtnText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  tabBtnTextActive: { color: '#fff' },

  card: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  cardSub: { marginTop: 4, fontSize: 13, color: '#64748b', lineHeight: 18 },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },

  sectionH: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginBottom: 8 },

  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bulletDot: { fontSize: 16, lineHeight: 20, color: '#0f172a' },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#334155' },

  bold: { fontWeight: '900', color: '#0f172a' },

  primaryBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  footNote: { marginTop: 12, fontSize: 12, color: '#64748b', lineHeight: 16 },

  pressed: { opacity: 0.9 },
});