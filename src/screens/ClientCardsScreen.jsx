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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState(null);

  // virtual hint from backend
  const [virtualAvailable, setVirtualAvailable] = useState(false);
  const [virtualCcnum, setVirtualCcnum] = useState(null);

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

  const canScan = useMemo(
    () => scanOpen && scanEnabled && !saving,
    [scanOpen, scanEnabled, saving]
  );

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await clientCardsApi.getMine();
      const data = res?.data || {};
      setCard(data?.card ?? null);
      setVirtualAvailable(!!data?.virtual_available);
      setVirtualCcnum(data?.virtual_ccnum ?? null);
    } catch {
      showFlash("err", "Проблем със зареждането на картата.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) load();
    }, [isAuthenticated])
  );

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

      // refresh hints
      await load();

      if (fullTimerRef.current) clearTimeout(fullTimerRef.current);
      setShowFullNumber(true);
      showFlash("ok", "Картата е добавена. Проверете номера.", 6000);

      fullTimerRef.current = setTimeout(() => setShowFullNumber(false), 4500);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Неуспешно записване.";
      showFlash("err", msg, 3000);
      if (scanOpen) setScanEnabled(true);
    } finally {
      setSaving(false);
    }
  };

  const addVirtualNow = async () => {
    if (!virtualCcnum) {
      showFlash("err", "Няма налична виртуална карта.", 2200);
      return;
    }
    await saveCard(String(virtualCcnum));
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
      "Сигурни ли сте, че искате да премахнете тази клиентска карта от приложението?",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Премахни",
          style: "destructive",
          onPress: async () => {
            try {
              await clientCardsApi.removeCard();
              setCard(null);
              await load();
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

  const goHowToGet = () => navigation.navigate("CardHowToGet");
  const goVirtual = () => navigation.navigate("VirtualCardCreate");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Клиентска карта</Text>
        <Text style={styles.subtitle}>
          На касата показваш баркода от телефона и го сканират от екрана.
        </Text>
      </View>

      {flash && (
        <View style={[styles.flash, flash.type === "ok" ? styles.flashOk : styles.flashErr]}>
          <Text style={styles.flashText}>{flash.text}</Text>
        </View>
      )}

      <View style={styles.panel}>
        {loading ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.muted}> Зареждане…</Text>
          </View>
        ) : card ? (
          <>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.kicker}>KOME Club</Text>
                <Text style={styles.ccnum}>
                  {showFullNumber ? card.ccnum : maskCard(card.ccnum)}
                </Text>
              </View>

              <Pressable
                style={[styles.iconBtn, saving && { opacity: 0.6 }]}
                onPress={remove}
                disabled={saving}
              >
                <Text style={styles.iconBtnText}>🗑</Text>
              </Pressable>
            </View>

            <View style={styles.barcodeCard}>
              <Text style={styles.barcodeHint}>Покажи баркода на касата:</Text>

              <View style={styles.barcodeInner}>
                <Barcode
                  value={String(card.ccnum)}
                  options={{
                    format: "CODE128",
                    width: 2,
                    height: 92,
                    displayValue: false,
                    background: "#FFFFFF",
                    lineColor: "#111827",
                    margin: 8,
                  }}
                />
              </View>

              <Text style={styles.micro}>Подсказка: увеличи яркостта за по-лесно сканиране.</Text>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
                onPress={openScanner}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>Сканирай нова</Text>
              </Pressable>

              <Pressable
                style={[styles.btnOutline, saving && { opacity: 0.7 }]}
                onPress={() => setManualOpen(true)}
                disabled={saving}
              >
                <Text style={styles.btnOutlineText}>Въведи ръчно</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.emptyTop}>
              <Text style={styles.kicker}>KOME Club</Text>
              <Text style={styles.emptyTitle}>Нямаш добавена карта</Text>
              <Text style={styles.muted}>
                Избери удобния за теб вариант — физическа (сканиране/ръчно) или виртуална карта.
              </Text>
            </View>

            {/* ВИНАГИ: физическа карта */}
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Физическа карта</Text>
              <Pressable
                style={[styles.btnPrimaryWide, saving && { opacity: 0.7 }]}
                onPress={openScanner}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>Сканирай карта</Text>
              </Pressable>

              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.btnOutline, { flex: 1 }, saving && { opacity: 0.7 }]}
                  onPress={() => setManualOpen(true)}
                  disabled={saving}
                >
                  <Text style={styles.btnOutlineText}>Въведи ръчно</Text>
                </Pressable>

                <Pressable
                  style={[styles.btnGhost, { flex: 1 }, saving && { opacity: 0.7 }]}
                  onPress={goHowToGet}
                  disabled={saving}
                >
                  <Text style={styles.btnGhostText}>Как да получа карта</Text>
                </Pressable>
              </View>
            </View>

            {/* ВИНАГИ: виртуална карта */}
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Виртуална карта</Text>

              {virtualAvailable && virtualCcnum ? (
                <Pressable
                  style={[styles.btnPrimaryWide, saving && { opacity: 0.7 }]}
                  onPress={addVirtualNow}
                  disabled={saving}
                >
                  <Text style={styles.btnPrimaryText}>Добави виртуалната ми карта</Text>
                </Pressable>
              ) : (
                <View style={styles.infoLine}>
                  <Text style={styles.muted}>
                    Нямаш създадена виртуална карта. Можеш да я направиш за минута.
                  </Text>
                </View>
              )}

              <Pressable
                style={[styles.btnOutlineWide, saving && { opacity: 0.7 }]}
                onPress={goVirtual}
                disabled={saving}
              >
                <Text style={styles.btnOutlineText}>Създай виртуална карта</Text>
              </Pressable>

              <Text style={styles.micro}>
                Виртуалната карта се показва като баркод в телефона и се използва на касата.
              </Text>
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
              <Text style={styles.muted}> Записвам…</Text>
            </View>
          ) : (
            <Text style={[styles.muted, { marginTop: 12 }]}>
              Насочи камерата към баркода — записът става автоматично.
            </Text>
          )}

          {__DEV__ && (
            <Pressable
              style={[styles.btnOutline, { marginTop: 12 }]}
              onPress={() => onBarcodeScanned({ data: "1234567890123" })}
              disabled={saving}
            >
              <Text style={styles.btnOutlineText}>Simulate scan (DEV)</Text>
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

          <View style={styles.formCard}>
            <Text style={styles.label}>Номер на карта</Text>

            <TextInput
              style={styles.input}
              placeholder="Напр. 123456..."
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              value={manualValue}
              onChangeText={setManualValue}
            />

            <Pressable
              style={[styles.btnPrimaryWide, { marginTop: 12 }, saving && { opacity: 0.7 }]}
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
              <Text style={styles.btnPrimaryText}>{saving ? "Записвам…" : "Запази"}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6fb", padding: 16 },

  header: { marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#6b7280", lineHeight: 18 },

  flash: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1 },
  flashOk: { backgroundColor: "#ECFDF5", borderColor: "#10B981" },
  flashErr: { backgroundColor: "#FEF2F2", borderColor: "#EF4444" },
  flashText: { fontSize: 13, fontWeight: "800", color: "#111827" },

  panel: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 4,
  },

  rowCenter: { flexDirection: "row", alignItems: "center" },
  muted: { fontSize: 13, color: "#6b7280" },

  kicker: { fontSize: 12, fontWeight: "900", color: "#6b7280" },
  ccnum: { marginTop: 4, fontSize: 19, fontWeight: "900", color: "#111827" },

  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  iconBtnText: { fontSize: 18 },

  barcodeCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    backgroundColor: "#fafafa",
    padding: 12,
  },
  barcodeHint: { fontSize: 12, color: "#374151", marginBottom: 10, fontWeight: "700" },
  barcodeInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingVertical: 10,
  },
  micro: { marginTop: 8, fontSize: 12, color: "#6b7280", lineHeight: 18 },

  emptyTop: { gap: 6, marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },

  group: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    gap: 10,
  },
  groupTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  infoLine: { paddingVertical: 2 },

  btnRow: { flexDirection: "row", gap: 10 },

  btnPrimary: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  btnPrimaryWide: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 13 },

  btnOutline: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineWide: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnOutlineText: { color: "#111827", fontWeight: "900", fontSize: 13 },

  btnGhost: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: { color: "#111827", fontWeight: "900", fontSize: 13 },

  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },

  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillText: { fontSize: 13, fontWeight: "900", color: "#111827" },

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

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  label: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
});