import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/auth/useAuth.js";

export default function OthersScreen( { navigation }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "HomeTab" }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All others</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
