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
      <View style={styles.bulletDotWrap}>
        <View style={styles.bulletDot} />
      </View>
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
      ? 'Получава се на място в обект и можеш да я използваш веднага.'
      : 'Създаваш я сам през телефона си – бързо и без посещение на магазин.';
  }, [tab]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Image source={{ uri: CC_IMG_URL }} style={styles.heroImg} resizeMode="cover" />

        <View style={styles.heroOverlay} />

        <View style={styles.heroTextWrap}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>KOME Club</Text>
          </View>

          <Text style={styles.heroTitle}>Клиентска карта KOME CBA</Text>
          <Text style={styles.heroDesc}>
            Събираш пари от покупките си и ги използваш във всички магазини от веригата.
          </Text>
        </View>
      </View>

      <View style={styles.tabsShell}>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>

        <View style={styles.divider} />

        {tab === 'physical' ? (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Как се издава</Text>

              <Bullet>Посети удобен за теб магазин KOME CBA.</Bullet>
              <Bullet>Поискай издаване на клиентска карта на каса или инфо точка според обекта.</Bullet>
              <Bullet>Картата се активира и можеш да я използваш веднага.</Bullet>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionH}>Подходяща е за теб, ако:</Text>
              <Bullet>предпочиташ физическа карта в портфейла си;</Bullet>
              <Bullet>не искаш да използваш телефон при пазаруване;</Bullet>
              <Bullet>искаш класически вариант за ползване в магазина.</Bullet>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Как работи</Text>

              <Bullet>Създаваш я сам през приложението – за минута.</Bullet>
              <Bullet>Не е нужно да посещаваш магазин за издаване.</Bullet>
              <Bullet>Използваш я директно от телефона си на касата.</Bullet>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionH}>Важно да знаеш</Text>
              <Bullet>
                Виртуалната карта е <Text style={styles.bold}>същата като физическата</Text> –
                с нея се натрупват и използват средства по същите правила.
              </Bullet>
              <Bullet>
                Разликата е само в начина на издаване и това, че я носиш в телефона си.
              </Bullet>
            </View>

            <Pressable
              onPress={() => navigation.navigate('VirtualCardCreate')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryBtnText}>Създай виртуална карта</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Полезно</Text>
        <Text style={styles.footNote}>
          Ако вече имаш карта, можеш да я добавиш към профила си от екрана „Карти“.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  content: {
    padding: 16,
    paddingBottom: 28,
  },

  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  heroImg: {
    width: '100%',
    height: 190,
    backgroundColor: '#f1f5f9',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },

  heroTextWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },

  heroBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },

  heroDesc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
  },

  tabsShell: {
    marginTop: 14,
  },

  tabsWrap: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eef2f7',
    borderRadius: 18,
    padding: 4,
  },

  tabBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  tabBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#475569',
  },

  tabBtnTextActive: {
    color: '#111827',
  },

  card: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },

  cardSub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },

  infoBox: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },

  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
  },

  section: {
    marginTop: 16,
  },

  sectionH: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  bulletDotWrap: {
    width: 16,
    alignItems: 'center',
    paddingTop: 6,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#111827',
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },

  bold: {
    fontWeight: '900',
    color: '#0f172a',
  },

  primaryBtn: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111827',
  },

  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },

  noteCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },

  noteTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },

  footNote: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  pressed: {
    opacity: 0.92,
  },
});