import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { shoppingListApi } from '../Api'; // ако трябва: '../../Api'
import { useAuth } from '../contexts/auth/useAuth.js'; // ако трябва: '../../contexts/auth/useAuth.js'

function norm(v) {
  return String(v ?? '').trim();
}

const LS_KEY = 'shopping_list_local_v1';

function isUnauthorized(err) {
  const s = err?.response?.status;
  return s === 401 || s === 403;
}

async function readLocalList() {
  try {
    const raw = await AsyncStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalList(list) {
  try {
    await AsyncStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch {
    // ignore
  }
}

// локални “id-та” (за да имаме keyExtractor)
function makeLocalId() {
  return `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export default function ShoppingListScreen({ navigation }) {
  const { logout, accessToken, user } = useAuth?.() ?? {};
  // accessToken/user може да ги нямаш — не е проблем. Ползваме 401 fallback.

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // ако сме в local режим
  const [useLocal, setUseLocal] = useState(false);

  const sortedItems = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((a, b) => {
      const ad = Number(a?.is_done) || 0;
      const bd = Number(b?.is_done) || 0;
      if (ad !== bd) return ad - bd;

      const aso = Number(a?.sort_order) || 0;
      const bso = Number(b?.sort_order) || 0;
      if (aso !== bso) return aso - bso;

      // server id е число, local id е string -> за сортиране ползваме created_at / fallback
      const at = Number(a?.created_at_ts) || 0;
      const bt = Number(b?.created_at_ts) || 0;
      if (at !== bt) return bt - at;

      const aid = Number(a?.id) || 0;
      const bid = Number(b?.id) || 0;
      return bid - aid;
    });
    return arr;
  }, [items]);

  const load = async () => {
    setRefreshing(true);

    // ако сме решили локално (или нямаме токен)
    if (useLocal || !accessToken) {
      const local = await readLocalList();
      setItems(local);
      setUseLocal(true);
      setRefreshing(false);
      return;
    }

    try {
      const res = await shoppingListApi.getAll();
      setItems(Array.isArray(res?.data) ? res.data : []);
      setUseLocal(false);
    } catch (e) {
      if (isUnauthorized(e)) {
        // 1) fallback към локално + опционално пращаме към login
        const local = await readLocalList();
        setItems(local);
        setUseLocal(true);

        // ако искаш директно да праща към login, разкоментирай:
        // logout?.();
        // navigation?.navigate?.('Login');

        return;
      }

      Alert.alert('Грешка', 'Проблем със зареждането на списъка.');
    } finally {
      setRefreshing(false);
    }
  };

  // при отваряне и когато се сменя login state (ако го имаш)
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.id]);

  // helper: когато пипаме items в local режим, да ги запишем
  const setItemsAndPersistLocal = (updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocalList(next);
      return next;
    });
  };

  const onAdd = async () => {
    const title = norm(newTitle);
    if (!title) return;

    Keyboard.dismiss();
    setAdding(true);

    // LOCAL MODE
    if (useLocal || !accessToken) {
      const created = {
        id: makeLocalId(),
        title,
        is_done: 0,
        sort_order: 0,
        created_at_ts: Date.now(),
      };
      setItemsAndPersistLocal((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      setNewTitle('');
      setAdding(false);
      return;
    }

    // API MODE
    try {
      const res = await shoppingListApi.create({ title });
      const created = res?.data;

      if (created?.id) {
        setItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      } else {
        await load();
      }

      setNewTitle('');
    } catch (e) {
      if (isUnauthorized(e)) {
        // fallback to local
        const created = {
          id: makeLocalId(),
          title,
          is_done: 0,
          sort_order: 0,
          created_at_ts: Date.now(),
        };
        setUseLocal(true);
        setItemsAndPersistLocal((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setNewTitle('');
        return;
      }

      Alert.alert('Грешка', 'Не успях да добавя запис.');
    } finally {
      setAdding(false);
    }
  };

  const onToggle = async (item) => {
    const id = item?.id;
    if (!id) return;

    const nextDone = Number(item?.is_done) ? 0 : 1;

    // optimistic UI
    if (useLocal || !accessToken) {
      setItemsAndPersistLocal((prev) =>
        (Array.isArray(prev) ? prev : []).map((x) =>
          x?.id === id ? { ...x, is_done: nextDone } : x
        )
      );
      return;
    }

    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((x) =>
        x?.id === id ? { ...x, is_done: nextDone } : x
      )
    );

    try {
      await shoppingListApi.toggleDone({ id, is_done: nextDone });
    } catch (e) {
      if (isUnauthorized(e)) {
        // fallback: оставяме локално състояние (или можем rollback, но по-приятно е да минем на local)
        setUseLocal(true);
        await writeLocalList(items);
        return;
      }

      // rollback
      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((x) =>
          x?.id === id ? { ...x, is_done: Number(item?.is_done) ? 1 : 0 } : x
        )
      );
      Alert.alert('Грешка', 'Не успях да отбележа.');
    }
  };

  const confirmDelete = (item) => {
    Alert.alert('Изтриване', 'Да изтрия ли този запис?', [
      { text: 'Отказ', style: 'cancel' },
      { text: 'Изтрий', style: 'destructive', onPress: () => onDelete(item) },
    ]);
  };

  const onDelete = async (item) => {
    const id = item?.id;
    if (!id) return;

    if (useLocal || !accessToken) {
      setItemsAndPersistLocal((prev) =>
        Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : prev
      );
      return;
    }

    const snapshot = items;
    setItems((prev) =>
      Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : prev
    );

    try {
      await shoppingListApi.remove(id);
    } catch (e) {
      if (isUnauthorized(e)) {
        setUseLocal(true);
        await writeLocalList(snapshot);
        return;
      }
      setItems(snapshot);
      Alert.alert('Грешка', 'Не успях да изтрия запис.');
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(norm(item?.title));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const title = norm(editTitle);
    if (!editItem?.id) return;

    if (!title) {
      Alert.alert('Грешка', 'Името не може да е празно.');
      return;
    }

    const id = editItem.id;

    if (useLocal || !accessToken) {
      setItemsAndPersistLocal((p) =>
        (Array.isArray(p) ? p : []).map((x) => (x?.id === id ? { ...x, title } : x))
      );
      setEditOpen(false);
      setEditItem(null);
      setEditTitle('');
      return;
    }

    const prev = items;

    // optimistic update
    setItems((p) =>
      (Array.isArray(p) ? p : []).map((x) => (x?.id === id ? { ...x, title } : x))
    );

    setEditOpen(false);

    try {
      await shoppingListApi.update({ id, title });
    } catch (e) {
      if (isUnauthorized(e)) {
        setUseLocal(true);
        await writeLocalList(prev);
        return;
      }
      setItems(prev);
      Alert.alert('Грешка', 'Не успях да запиша промяната.');
    } finally {
      setEditItem(null);
      setEditTitle('');
    }
  };

  const renderItem = ({ item }) => {
    const done = Number(item?.is_done) === 1;
    const title = norm(item?.title) || 'Без име';

    return (
      <View style={[styles.row, done && styles.rowDone]}>
        <Pressable onPress={() => onToggle(item)} style={styles.check} hitSlop={8}>
          <View style={[styles.checkbox, done && styles.checkboxOn]}>
            {done ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </Pressable>

        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, done && styles.rowTitleDone]} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => openEdit(item)} style={styles.editBtn} hitSlop={10}>
            <Text style={styles.editText}>✎</Text>
          </Pressable>

          <Pressable onPress={() => confirmDelete(item)} style={styles.delBtn} hitSlop={10}>
            <Text style={styles.delText}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Списък за пазаруване</Text>

        <View style={styles.addRow}>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Добави продукт…"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={onAdd}
          />
          <Pressable
            onPress={onAdd}
            disabled={adding || !norm(newTitle)}
            style={[styles.addBtn, (adding || !norm(newTitle)) && styles.addBtnDisabled]}
          >
            <Text style={styles.addBtnText}>{adding ? '...' : 'Добави'}</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          ✓: отметни • ✎: редакция • ✕: изтрий
          {useLocal ? ' • Локален режим' : ''}
        </Text>

        {useLocal ? (
          <View style={styles.localBanner}>
            <Text style={styles.localBannerText}>
              В момента списъкът се пази локално (без логин). При логин ще се използва базата.
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={sortedItems}
        keyExtractor={(x) => String(x?.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Няма добавени продукти</Text>
              <Text style={styles.emptyText}>Добави първия продукт от полето горе.</Text>
            </View>
          ) : null
        }
      />

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Редакция</Text>

            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Име…"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveEdit}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnGhost} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalBtnGhostText}>Отказ</Text>
              </Pressable>
              <Pressable style={styles.modalBtnPrimary} onPress={saveEdit}>
                <Text style={styles.modalBtnPrimaryText}>Запази</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  addRow: { flexDirection: 'row', gap: 10 },

  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
  },

  addBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  hint: { fontSize: 12, color: '#64748b', fontWeight: '700' },

  localBanner: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 10,
  },
  localBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowDone: { opacity: 0.7 },

  check: { padding: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { borderColor: '#22c55e' },
  checkMark: { fontWeight: '900', color: '#16a34a', marginTop: -1 },

  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, color: '#111827', fontWeight: '800' },
  rowTitleDone: { textDecorationLine: 'line-through', color: '#64748b' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  editText: { color: '#0f172a', fontWeight: '900', fontSize: 14 },

  delBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff',
  },
  delText: { color: '#ef4444', fontWeight: '900', fontSize: 14 },

  empty: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#64748b', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  modalInput: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
  },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtnGhost: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  modalBtnGhostText: { color: '#111827', fontWeight: '900' },
  modalBtnPrimary: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '900' },
});