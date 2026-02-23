import React from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { useAuth } from "../contexts/auth/useAuth.js";

export default function OthersScreen({ navigation }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Изход", "Сигурен ли си, че искаш да излезеш?", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изход",
        style: "destructive",
        onPress: () => {
          logout();
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: "HomeTab" }],
          });
        },
      },
    ]);
  };

  const goToShops = () => navigation.navigate("ShopsList");
  const goToShoppingList = () => navigation.navigate("ShoppingList");

  const Item = ({ title, subtitle, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.itemSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      <Text style={styles.chev}>›</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Други</Text> */}
      <Text style={styles.subtitle}>Бързи инструменти и полезни секции</Text>

      <View style={styles.card}>
        <Item
          title="Обекти / Магазини"
          subtitle="Списък с обектите + детайли и карта"
          onPress={goToShops}
        />
        <View style={styles.divider} />
        <Item
          title="Списък за пазаруване"
          subtitle="Добавяй, отметни купеното, редактирай"
          onPress={goToShoppingList}
        />
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
      >
        <Text style={styles.logoutText}>Изход</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 16,
    paddingTop: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
  },

  item: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemPressed: {
    opacity: 0.85,
  },

  itemLeft: {
    flex: 1,
    gap: 3,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  itemSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },

  chev: {
    fontSize: 26,
    fontWeight: "900",
    color: "#94a3b8",
    marginTop: -2,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  logoutBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
  },
  logoutBtnPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 14,
  },
});