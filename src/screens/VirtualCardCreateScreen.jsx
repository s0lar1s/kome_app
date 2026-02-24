import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clientCardsApi } from "../Api/index.js";

function norm(s) {
  return String(s ?? "").trim();
}
function onlyDigits(s) {
  return String(s ?? "").replace(/\D+/g, "");
}
function isValidEgn(egn) {
  return onlyDigits(egn).length === 10;
}
function isValidPostCode(pc) {
  return onlyDigits(pc).length === 4;
}
function isValidPhone(ph) {
  return onlyDigits(ph).length >= 8;
}
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(norm(email));
}

export default function VirtualCardCreateScreen({ navigation }) {
  // Required
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [egn, setEgn] = useState("");
  const [postCode, setPostCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Optional (raffles/games)
  const [wantsGames, setWantsGames] = useState(false);
  const [city, setCity] = useState("");
  const [streetOrDistrict, setStreetOrDistrict] = useState("");
  const [streetNo, setStreetNo] = useState("");
  const [block, setBlock] = useState("");
  const [entrance, setEntrance] = useState("");
  const [apartment, setApartment] = useState("");

  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  const askedRef = useRef(false);

  // Ако вече има виртуална карта – предлагаме да я добавим
  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;

    (async () => {
      try {
        const res = await clientCardsApi.getMine();
        const vAvail = !!res?.data?.virtual_available;
        const vCcnum = res?.data?.virtual_ccnum;

        if (vAvail && vCcnum) {
          Alert.alert(
            "Вече имаш виртуална карта",
            "Искаш ли да я добавиш в приложението?",
            [
              { text: "Не", style: "cancel" },
              {
                text: "Добави",
                onPress: async () => {
                  try {
                    setSaving(true);
                    await clientCardsApi.setCard({ ccnum: String(vCcnum) });
                    Alert.alert("Готово", "Виртуалната карта е добавена.");
                    navigation.goBack();
                  } catch (e) {
                    const msg =
                      e?.response?.data?.error || e?.message || "Неуспешно добавяне.";
                    Alert.alert("Грешка", msg);
                  } finally {
                    setSaving(false);
                  }
                },
              },
            ]
          );
        }
      } catch {
        // тихо
      }
    })();
  }, [navigation]);

  const validate = () => {
    if (norm(firstName).length < 2) return "Моля, въведи име.";
    if (norm(middleName).length < 2) return "Моля, въведи презиме.";
    if (norm(lastName).length < 2) return "Моля, въведи фамилия.";
    if (!isValidEgn(egn)) return "Моля, въведи валидно ЕГН (10 цифри).";
    if (!isValidPostCode(postCode)) return "Моля, въведи валиден пощенски код (4 цифри).";
    if (!isValidPhone(phone)) return "Моля, въведи валиден телефон.";
    if (!isValidEmail(email)) return "Моля, въведи валиден email.";
    if (!agree) return "Трябва да потвърдиш съгласието за обработка на данни.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Проверка", err);
      return;
    }

    const payload = {
      first_name: norm(firstName),
      middle_name: norm(middleName),
      last_name: norm(lastName),
      egn: onlyDigits(egn),
      post_code: onlyDigits(postCode),
      phone: norm(phone),
      email: norm(email),
      wants_games: !!wantsGames,

      city: norm(city),
      street_or_district: norm(streetOrDistrict),
      street_no: norm(streetNo),
      block: norm(block),
      entrance: norm(entrance),
      apartment: norm(apartment),

      consent: true,
    };

    setSaving(true);
    try {
      if (typeof clientCardsApi?.createVirtual !== "function") {
        Alert.alert(
          "Готово (демо)",
          "Формата е готова. Следващата стъпка е да вържем API за създаване на виртуална карта."
        );
        navigation.goBack();
        return;
      }

      const res = await clientCardsApi.createVirtual(payload);

      const ccnum =
        res?.data?.ccnum ||
        res?.data?.card?.ccnum ||
        res?.data?.virtual_ccnum ||
        null;

      if (ccnum) {
        await clientCardsApi.setCard({ ccnum: String(ccnum) });
      }

      Alert.alert("Успех", "Виртуалната карта е създадена и добавена в приложението.");
      navigation.goBack();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Неуспешно създаване на виртуална карта.";
      Alert.alert("Грешка", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Създай виртуална карта</Text>
        <Text style={styles.sub}>
          Полетата със звездичка са задължителни. Номерът се генерира автоматично.
        </Text>

        {/* Section: Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Лични данни</Text>
          <Field label="Име *" value={firstName} onChangeText={setFirstName} editable={!saving} />
          <Field label="Презиме *" value={middleName} onChangeText={setMiddleName} editable={!saving} />
          <Field label="Фамилия *" value={lastName} onChangeText={setLastName} editable={!saving} />

          <Field
            label="ЕГН *"
            value={egn}
            onChangeText={(t) => setEgn(onlyDigits(t).slice(0, 10))}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            placeholder="10 цифри"
            editable={!saving}
          />

          <Field
            label="Пощенски код *"
            value={postCode}
            onChangeText={(t) => setPostCode(onlyDigits(t).slice(0, 4))}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            placeholder="4 цифри"
            editable={!saving}
          />
        </View>

        {/* Section: Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контакт</Text>

          <Field
            label="Телефон *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="напр. 0888 123 456"
            editable={!saving}
          />

          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
            editable={!saving}
          />
        </View>

        {/* Section: Optional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>По желание</Text>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setWantsGames((v) => !v)}
            disabled={saving}
          >
            <View style={[styles.checkbox, wantsGames && styles.checkboxOn]} />
            <Text style={styles.checkboxText}>
              Искам да участвам в томболи и игри за притежателите на клиентски карти
            </Text>
          </Pressable>

          {wantsGames && (
            <View style={styles.optionalBox}>
              <Text style={styles.optTitle}>Адресни данни</Text>
              <Field label="Град" value={city} onChangeText={setCity} editable={!saving} />
              <Field label="ж.к./ул." value={streetOrDistrict} onChangeText={setStreetOrDistrict} editable={!saving} />

              <View style={styles.gridRow}>
                <View style={{ flex: 1 }}>
                  <Field label="№" value={streetNo} onChangeText={setStreetNo} editable={!saving} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Блок" value={block} onChangeText={setBlock} editable={!saving} />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={{ flex: 1 }}>
                  <Field label="Вх." value={entrance} onChangeText={setEntrance} editable={!saving} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Ап." value={apartment} onChangeText={setApartment} editable={!saving} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section: Consent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Съгласие</Text>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgree((v) => !v)}
            disabled={saving}
          >
            <View style={[styles.checkbox, agree && styles.checkboxOn]} />
            <Text style={styles.checkboxText}>
              Съгласен/на съм личните ми данни да се обработват за целите на програмата за лоялни клиенти.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primary, saving && { opacity: 0.7 }]}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.primaryText}>
              {saving ? "Създавам…" : "Създай виртуална карта"}
            </Text>
          </Pressable>

          <Text style={styles.micro}>
            След създаване, картата ще се добави автоматично и ще се показва като баркод.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6fb" },
  content: { padding: 16, paddingBottom: 28 },

  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 6, fontSize: 13, color: "#6b7280", lineHeight: 18 },

  section: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 12 },

  label: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },

  checkboxRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 6, marginBottom: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginTop: 1,
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: "#111827", borderColor: "#111827" },
  checkboxText: { flex: 1, fontSize: 12, color: "#374151", lineHeight: 18 },

  optionalBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  optTitle: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 10 },

  gridRow: { flexDirection: "row", gap: 10 },

  primary: {
    marginTop: 6,
    backgroundColor: "#111827",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 13 },

  micro: { marginTop: 10, fontSize: 12, color: "#6b7280", lineHeight: 18 },
});