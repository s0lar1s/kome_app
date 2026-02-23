import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Barcode } from "expo-barcode-generator";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/auth/useAuth.js";
import { clientCardsApi } from "../Api/index.js";

function maskCard(ccnum) {
  const s = String(ccnum ?? "");
  if (s.length <= 6) return s;
  return `${s.slice(0, 4)} •••• •••• ${s.slice(-4)}`;
}

function normalizeCcnum(raw) {
  return String(raw ?? "").replace(/\D+/g, "");
}

export default function ClientCardsScreen() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState(null);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const [permission, requestPermission] = useCameraPermissions();
  const [showFullNumber, setShowFullNumber] = useState(false);

  const [flash, setFlash] = useState(null);
  const flashTimerRef = useRef(null);
  const fullTimerRef = useRef(null);

  const showFlash = (type, text, ms = 1800) => {
    setFlash({ type, text });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), ms);
  };

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (fullTimerRef.current) clearTimeout(fullTimerRef.current);
    };
  }, []);

  const canScan = useMemo(() => scanOpen && scanEnabled && !saving, [scanOpen, scanEnabled, saving]);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await clientCardsApi.getMine();
      setCard(res?.data?.card ?? null);
    } catch {
      showFlash("err", "Проблем със зареждането на картата.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  const openScanner = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        showFlash("err", "Нужен е достъп до камерата (Настройки).", 2500);
        Linking.openSettings?.();
        return;
      }
    }
    setScanEnabled(true);
    setScanOpen(true);
  };

  const closeScanner = () => {
    setScanEnabled(false);
    setScanOpen(false);
  };

  const saveCard = async (ccnum) => {
    setSaving(true);
    try {
      const res = await clientCardsApi.setCard({ ccnum });
      setCard(res?.data?.card ?? null);

      closeScanner();
      setManualOpen(false);
      setManualValue("");

      if (fullTimerRef.current) clearTimeout(fullTimerRef.current);
      setShowFullNumber(true);
      showFlash("ok", "Картата е добавена. Проверете номера.", 8000);

      fullTimerRef.current = setTimeout(() => {
        setShowFullNumber(false);
      }, 5000);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Неуспешно записване.";
      showFlash("err", msg, 3000);

      if (scanOpen) setScanEnabled(true);
    } finally {
      setSaving(false);
    }
  };

  const onBarcodeScanned = async ({ data }) => {
    if (!canScan) return;

    const ccnum = normalizeCcnum(data);
    if (!ccnum || ccnum.length < 6) return;

    setScanEnabled(false);
    setScanOpen(false);

    await saveCard(ccnum);
  };

  const remove = () => {
    Alert.alert(
      "Премахване на карта",
      "Сигурни ли сте, че искате да премахнете тази клиентска карта?",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Премахни",
          style: "destructive",
          onPress: async () => {
            try {
              await clientCardsApi.removeCard();
              setCard(null);
              showFlash("ok", "Картата беше премахната.");
            } catch {
              showFlash("err", "Не успях да премахна картата.", 2500);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const modalContainerStyle = {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: (insets?.top ?? 0) + 12,
    paddingBottom: (insets?.bottom ?? 0) + 12,
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="dark-content" />

      <Text style={styles.title}>Клиентска карта</Text>

      {flash && (
        <View style={[styles.flash, flash.type === "ok" ? styles.flashOk : styles.flashErr]}>
          <Text style={styles.flashText}>{flash.text}</Text>
        </View>
      )}

      <View style={styles.shell}>
        {loading ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.sub}> Зареждане…</Text>
          </View>
        ) : card ? (
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.brand}>KOME Club</Text>
                <Text style={styles.masked}>{showFullNumber ? card.ccnum : maskCard(card.ccnum)}</Text>
              </View>

              <Pressable style={styles.trashBtn} onPress={remove} disabled={saving}>
                <Text style={styles.trashIcon}>🗑</Text>
              </Pressable>
            </View>

            <View style={styles.barcodeBox}>
              <Text style={styles.hint}>Покажи баркода на касата и го сканират от екрана.</Text>

              <View style={styles.barcodeInner}>
                <Barcode
                  value={String(card.ccnum)}
                  options={{
                    format: "CODE128",
                    width: 2,
                    height: 90,
                    displayValue: false,
                    background: "#FFFFFF",
                    lineColor: "#111827",
                    margin: 8,
                  }}
                />
              </View>

              <Text style={styles.small}>Подсказка: увеличи яркостта за по-лесно сканиране.</Text>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={openScanner} disabled={saving}>
                <Text style={styles.primaryText}>Сканирай нова</Text>
              </Pressable>

              <Pressable style={styles.secondary} onPress={() => setManualOpen(true)} disabled={saving}>
                <Text style={styles.secondaryText}>Въведи ръчно</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.brand}>KOME Club</Text>
            <Text style={[styles.sub, { marginTop: 4, marginBottom: 14 }]}>
              Нямаш добавена карта. Добави я веднъж и после я носиш в телефона си.
            </Text>

            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={openScanner} disabled={saving}>
                <Text style={styles.primaryText}>Сканирай карта</Text>
              </Pressable>

              <Pressable style={styles.secondary} onPress={() => setManualOpen(true)} disabled={saving}>
                <Text style={styles.secondaryText}>Въведи ръчно</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* CAMERA MODAL */}
      <Modal
        visible={scanOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeScanner}
      >
        <SafeAreaView style={modalContainerStyle} edges={[]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Сканиране</Text>
            <Pressable style={styles.pill} onPress={closeScanner}>
              <Text style={styles.pillText}>Затвори</Text>
            </Pressable>
          </View>

          <View style={styles.cameraBox}>
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={scanEnabled ? onBarcodeScanned : undefined}
            />
            <View style={styles.scanFrame} />
          </View>

          {saving ? (
            <View style={[styles.rowCenter, { marginTop: 12 }]}>
              <ActivityIndicator />
              <Text style={styles.sub}> Записвам…</Text>
            </View>
          ) : (
            <Text style={[styles.sub, { marginTop: 12 }]}>
              Насочи камерата към баркода — записът става автоматично.
            </Text>
          )}

          {__DEV__ && (
            <Pressable
              style={[styles.secondary, { marginTop: 12 }]}
              onPress={() => onBarcodeScanned({ data: "1234567890123" })}
              disabled={saving}
            >
              <Text style={styles.secondaryText}>Simulate scan (DEV)</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </Modal>

      {/* MANUAL MODAL */}
      <Modal
        visible={manualOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setManualOpen(false)}
      >
        <SafeAreaView style={modalContainerStyle} edges={[]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Въведи номер</Text>
            <Pressable style={styles.pill} onPress={() => setManualOpen(false)}>
              <Text style={styles.pillText}>Затвори</Text>
            </Pressable>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Номер на карта</Text>

            <TextInput
              style={styles.input}
              placeholder="Напр. 123456..."
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              value={manualValue}
              onChangeText={setManualValue}
            />

            <Pressable
              style={[styles.primary, { marginTop: 12 }]}
              onPress={() => {
                const val = normalizeCcnum(manualValue);
                if (!val || val.length < 6) {
                  showFlash("err", "Невалиден номер.", 2200);
                  return;
                }
                saveCard(val);
              }}
              disabled={saving}
            >
              <Text style={styles.primaryText}>{saving ? "Записвам…" : "Запази"}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    color: "#111827",
  },

  flash: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  flashOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  flashErr: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  flashText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },

  shell: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },

  brand: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6b7280",
    marginBottom: 4,
  },
  masked: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  sub: {
    fontSize: 13,
    color: "#6b7280",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },

  barcodeBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    backgroundColor: "#fafafa",
    padding: 12,
  },
  hint: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 10,
  },
  barcodeInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingVertical: 10,
  },
  small: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },

  actions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primary: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
  secondary: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 13,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  cameraBox: {
    height: 420,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#000",
    position: "relative",
  },
  scanFrame: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 160,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
  },

  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },

  trashBtn: {
    padding: 8,
  },
  trashIcon: {
    fontSize: 20,
    color: "#EF4444",
  },
});