import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardHowToGetScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Как да получиш физическа карта</Text>

        <View style={styles.card}>
          <Text style={styles.h}>Издаване</Text>
          <Text style={styles.p}>• Картата се издава в обект на КОМЕ.</Text>
          <Text style={styles.p}>• За лица над 16 години.</Text>
          <Text style={styles.p}>• Попълва се регистрационен формуляр и се представя лична карта.</Text>
          <Text style={styles.p}>• Първата карта е безплатна.</Text>

          <Text style={[styles.h, { marginTop: 12 }]}>При загуба/повреда</Text>
          <Text style={styles.p}>• Нова карта се издава срещу 1 лв., който се приспада от натрупаната сума.</Text>

          <Text style={[styles.h, { marginTop: 12 }]}>Натрупване на отстъпки</Text>
          <Text style={styles.p}>• Отстъпки се натрупват при предоставяне на картата на каса преди приключване на бона.</Text>
          <Text style={styles.p}>• Натрупаните суми се използват само за пазаруване в магазини КОМЕ.</Text>

          <Text style={[styles.h, { marginTop: 12 }]}>Важно</Text>
          <Text style={styles.p}>• Ако картата не се използва 6 месеца, натрупаната сума се занулява.</Text>
          <Text style={styles.p}>• Не се натрупват отстъпки за промоции, тютюневи изделия и лотарийни игри.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h}>Лични данни</Text>
          <Text style={styles.p}>
            Данните се обработват от „КОМЕ“ ООД само за целите на програмата за лоялни клиенти.
            Можеш да поискаш прекратяване по всяко време на:
          </Text>

          <Pressable onPress={() => Linking.openURL("mailto:dpo.kome@cba.bg")} style={styles.mailBtn}>
            <Text style={styles.mailText}>dpo.kome@cba.bg</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "900", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  h: { fontSize: 14, fontWeight: "900", color: "#111827", marginBottom: 6 },
  p: { fontSize: 13, color: "#374151", marginBottom: 6, lineHeight: 18 },

  mailBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  mailText: { fontSize: 13, fontWeight: "900", color: "#111827" },
});