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
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Barcode } from "expo-barcode-generator";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/auth/useAuth.js";
import { clientCardsApi } from "../Api/index.js";
import TopBrandBar from '../components/TopBrandBar';

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
      showFlash("err", "Проблем със зареждането на картата.", 2500);
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
        showFlash("err", "Нужен е достъп до камерата.", 2600);
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

      await load();

      if (fullTimerRef.current) clearTimeout(fullTimerRef.current);
      setShowFullNumber(true);
      showFlash("ok", "Картата е добавена успешно.", 4000);
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
              showFlash("ok", "Картата беше премахната.", 2500);
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
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingTop: (insets?.top ?? 0) + 12,
    paddingBottom: (insets?.bottom ?? 0) + 12,
  };

  const goHowToGet = () => navigation.navigate("CardHowToGet");
  const goVirtual = () => navigation.navigate("VirtualCardCreate");

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <TopBrandBar />

      <RNStatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Клиентска карта</Text>
          <Text style={styles.subtitle}>
            Покажи баркода на касата и картата ще бъде сканирана директно от телефона.
          </Text>
        </View>

        {flash && (
          <View style={[styles.flash, flash.type === "ok" ? styles.flashOk : styles.flashErr]}>
            <Text style={styles.flashText}>{flash.text}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Зареждане на данните...</Text>
          </View>
        ) : card ? (
          <>
            <View style={styles.digitalCard}>
              <View style={styles.digitalCardTop}>
                <View>
                  <Text style={styles.cardLabel}>KOME Club</Text>
                  <Text style={styles.cardTitle}>Твоята клиентска карта</Text>
                </View>

                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Активна</Text>
                </View>
              </View>

              <Text style={styles.cardNumber}>
                {showFullNumber ? card.ccnum : maskCard(card.ccnum)}
              </Text>

              <Pressable
                style={styles.toggleNumberBtn}
                onPress={() => setShowFullNumber((v) => !v)}
              >
                <Text style={styles.toggleNumberText}>
                  {showFullNumber ? "Скрий номера" : "Покажи целия номер"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.barcodeCard}>
              <Text style={styles.sectionTitle}>Баркод за сканиране</Text>
              <Text style={styles.sectionSubtitle}>
                Покажи този екран на касата, за да бъде сканирана картата.
              </Text>

              <View style={styles.barcodeInner}>
                <Barcode
                  value={String(card.ccnum)}
                  options={{
                    format: "CODE128",
                    width: 2,
                    height: 96,
                    displayValue: false,
                    background: "#FFFFFF",
                    lineColor: "#111827",
                    margin: 8,
                  }}
                />
              </View>

              <Text style={styles.micro}>
                Подсказка: увеличи яркостта на екрана за по-лесно сканиране.
              </Text>
            </View>

            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Управление</Text>

              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.btnPrimary, saving && styles.btnDisabled]}
                  onPress={openScanner}
                  disabled={saving}
                >
                  <Text style={styles.btnPrimaryText}>Сканирай нова</Text>
                </Pressable>

                <Pressable
                  style={[styles.btnOutline, saving && styles.btnDisabled]}
                  onPress={() => setManualOpen(true)}
                  disabled={saving}
                >
                  <Text style={styles.btnOutlineText}>Въведи ръчно</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.btnDangerSoft, saving && styles.btnDisabled]}
                onPress={remove}
                disabled={saving}
              >
                <Text style={styles.btnDangerSoftText}>Премахни картата</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.emptyCard}>
              <Text style={styles.cardLabel}>KOME Club</Text>
              <Text style={styles.emptyTitle}>Нямаш добавена карта</Text>
              <Text style={styles.emptyText}>
                Добави физическа или виртуална карта и я използвай удобно директно от телефона.
              </Text>
            </View>

            <View style={styles.group}>
              <Text style={styles.groupTitle}>Физическа карта</Text>
              <Text style={styles.groupText}>
                Ако вече имаш издадена карта, можеш да я добавиш бързо чрез сканиране или ръчно въвеждане.
              </Text>

              <Pressable
                style={[styles.btnPrimaryWide, saving && styles.btnDisabled]}
                onPress={openScanner}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>Сканирай карта</Text>
              </Pressable>

              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.btnOutline, styles.flexBtn, saving && styles.btnDisabled]}
                  onPress={() => setManualOpen(true)}
                  disabled={saving}
                >
                  <Text style={styles.btnOutlineText}>Въведи ръчно</Text>
                </Pressable>

                <Pressable
                  style={[styles.btnGhost, styles.flexBtn, saving && styles.btnDisabled]}
                  onPress={goHowToGet}
                  disabled={saving}
                >
                  <Text style={styles.btnGhostText}>Как да получа карта</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.group}>
              <Text style={styles.groupTitle}>Виртуална карта</Text>

              {virtualAvailable && virtualCcnum ? (
                <>
                  <Text style={styles.groupText}>
                    Имаш налична виртуална карта, която можеш да добавиш веднага в приложението.
                  </Text>

                  <Pressable
                    style={[styles.btnPrimaryWide, saving && styles.btnDisabled]}
                    onPress={addVirtualNow}
                    disabled={saving}
                  >
                    <Text style={styles.btnPrimaryText}>Добави виртуалната ми карта</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.groupText}>
                  Нямаш създадена виртуална карта. Можеш да я направиш бързо и да я използваш на касата.
                </Text>
              )}

              <Pressable
                style={[styles.btnOutlineWide, saving && styles.btnDisabled]}
                onPress={goVirtual}
                disabled={saving}
              >
                <Text style={styles.btnOutlineText}>Създай виртуална карта</Text>
              </Pressable>

              <Text style={styles.micro}>
                Виртуалната карта се показва като баркод на телефона и се използва по същия начин на касата.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={scanOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeScanner}
      >
        <SafeAreaView style={modalContainerStyle} edges={[]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Сканиране на карта</Text>
            <Pressable style={styles.pill} onPress={closeScanner}>
              <Text style={styles.pillText}>Затвори</Text>
            </Pressable>
          </View>

          <Text style={styles.modalInfo}>
            Насочи камерата към баркода. Картата ще бъде записана автоматично.
          </Text>

          <View style={styles.cameraBox}>
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={scanEnabled ? onBarcodeScanned : undefined}
            />
            <View style={styles.scanFrame} />
          </View>

          {saving ? (
            <View style={[styles.rowCenter, { marginTop: 14 }]}>
              <ActivityIndicator />
              <Text style={styles.muted}> Записвам...</Text>
            </View>
          ) : null}

          {__DEV__ && (
            <Pressable
              style={[styles.btnOutlineWide, { marginTop: 14 }]}
              onPress={() => onBarcodeScanned({ data: "1234567890123" })}
              disabled={saving}
            >
              <Text style={styles.btnOutlineText}>Simulate scan (DEV)</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={manualOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setManualOpen(false)}
      >
        <SafeAreaView style={modalContainerStyle} edges={[]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ръчно въвеждане</Text>
            <Pressable style={styles.pill} onPress={() => setManualOpen(false)}>
              <Text style={styles.pillText}>Затвори</Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Номер на карта</Text>
            <Text style={styles.formHint}>
              Въведи номера без интервали и допълнителни символи.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Напр. 123456..."
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              value={manualValue}
              onChangeText={setManualValue}
              placeholderTextColor="#94a3b8"
            />

            <Pressable
              style={[styles.btnPrimaryWide, { marginTop: 14 }, saving && styles.btnDisabled]}
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
              <Text style={styles.btnPrimaryText}>{saving ? "Записвам..." : "Запази"}</Text>
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
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },

  header: {
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },

  flash: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
  },

  flashOk: {
    backgroundColor: "#ecfdf5",
    borderColor: "#34d399",
  },

  flashErr: {
    backgroundColor: "#fef2f2",
    borderColor: "#f87171",
  },

  flashText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },

  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },

  digitalCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  digitalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#cbd5e1",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  cardTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
  },

  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  activeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  cardNumber: {
    marginTop: 22,
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.4,
  },

  toggleNumberBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  toggleNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#e2e8f0",
  },

  barcodeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748b",
  },

  barcodeInner: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingVertical: 14,
  },

  micro: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  actionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  emptyTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },

  group: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  groupText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },

  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },

  muted: {
    fontSize: 13,
    color: "#64748b",
  },

  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  flexBtn: {
    flex: 1,
  },

  btnPrimary: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimaryWide: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  btnPrimaryText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },

  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  btnOutlineWide: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  btnOutlineText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 14,
  },

  btnGhost: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  btnGhostText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 14,
  },

  btnDangerSoft: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  btnDangerSoftText: {
    color: "#b91c1c",
    fontWeight: "900",
    fontSize: 14,
  },

  btnDisabled: {
    opacity: 0.7,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  modalInfo: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginBottom: 14,
  },

  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },

  pillText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },

  cameraBox: {
    height: 430,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#000",
    position: "relative",
  },

  scanFrame: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 155,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
  },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  label: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },

  formHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    padding: 13,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
});