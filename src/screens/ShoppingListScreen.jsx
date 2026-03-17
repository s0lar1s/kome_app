import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { shoppingListApi } from '../Api';
import { useAuth } from '../contexts/auth/useAuth.js';
import TopBrandBar from '../components/TopBrandBar';

function norm(v) {
  return String(v ?? '').trim();
}

const LS_KEY = 'shopping_list_local_v1';
const ACCESS_TOKEN_KEY = 'accessToken';

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

function makeLocalId() {
  return `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export default function ShoppingListScreen() {
  const auth = useAuth?.() ?? {};
  const accessTokenFromContext = auth?.accessToken;
  const user = auth?.user;

  const [tokenFallback, setTokenFallback] = useState(null);
  const token = accessTokenFromContext || tokenFallback;

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const [useLocal, setUseLocal] = useState(false);

  const didInit = useRef(false);

  const loadTokenFallback = async () => {
    try {
      const t = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      setTokenFallback(t || null);
    } catch {
      setTokenFallback(null);
    }
  };

  const sortedItems = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((a, b) => {
      const ad = Number(a?.is_done) || 0;
      const bd = Number(b?.is_done) || 0;
      if (ad !== bd) return ad - bd;

      const aso = Number(a?.sort_order) || 0;
      const bso = Number(b?.sort_order) || 0;
      if (aso !== bso) return aso - bso;

      const at = Number(a?.created_at_ts) || 0;
      const bt = Number(b?.created_at_ts) || 0;
      if (at !== bt) return bt - at;

      const aid = Number(a?.id) || 0;
      const bid = Number(b?.id) || 0;
      return bid - aid;
    });
    return arr;
  }, [items]);

  const activeCount = useMemo(
    () => sortedItems.filter((x) => Number(x?.is_done) !== 1).length,
    [sortedItems]
  );

  const doneCount = useMemo(
    () => sortedItems.filter((x) => Number(x?.is_done) === 1).length,
    [sortedItems]
  );

  const setItemsAndPersistLocal = (updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocalList(next);
      return next;
    });
  };

  const load = async () => {
    setRefreshing(true);

    if (token) {
      try {
        const res = await shoppingListApi.getAll();
        setItems(Array.isArray(res?.data) ? res.data : []);
        setUseLocal(false);
        return;
      } catch (e) {
        if (isUnauthorized(e)) {
          const local = await readLocalList();
          setItems(local);
          setUseLocal(true);
          return;
        }

        Alert.alert('Грешка', 'Проблем със зареждането на списъка.');
        return;
      } finally {
        setRefreshing(false);
      }
    }

    const local = await readLocalList();
    setItems(local);
    setUseLocal(true);
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      if (didInit.current) return;
      didInit.current = true;

      await loadTokenFallback();
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (accessTokenFromContext) setTokenFallback(null);

    (async () => {
      await loadTokenFallback();
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessTokenFromContext, user?.id]);

  const onAdd = async () => {
    const title = norm(newTitle);
    if (!title) return;

    Keyboard.dismiss();
    setAdding(true);

    if (!token) {
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

    try {
      const res = await shoppingListApi.create({ title });
      const created = res?.data;

      if (created?.id) {
        setItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setUseLocal(false);
      } else {
        await load();
      }

      setNewTitle('');
    } catch (e) {
      if (isUnauthorized(e)) {
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

    if (!token) {
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
      setUseLocal(false);
    } catch (e) {
      if (isUnauthorized(e)) {
        setUseLocal(true);
        await writeLocalList(items);
        return;
      }

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

    if (!token) {
      setItemsAndPersistLocal((prev) =>
        Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : prev
      );
      return;
    }

    const snapshot = items;
    setItems((prev) => (Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : prev));

    try {
      await shoppingListApi.remove(id);
      setUseLocal(false);
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

    if (!token) {
      setItemsAndPersistLocal((p) =>
        (Array.isArray(p) ? p : []).map((x) => (x?.id === id ? { ...x, title } : x))
      );
      setEditOpen(false);
      setEditItem(null);
      setEditTitle('');
      return;
    }

    const prev = items;

    setItems((p) =>
      (Array.isArray(p) ? p : []).map((x) => (x?.id === id ? { ...x, title } : x))
    );

    setEditOpen(false);

    try {
      await shoppingListApi.update({ id, title });
      setUseLocal(false);
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

  const showLocal = useLocal || !token;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* <TopBrandBar /> */}

      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.pageTitle}>Списък за пазаруване</Text>
          {/* <Text style={styles.pageSubtitle}>
            Добавяй продукти, отбелязвай купените и поддържай списъка си подреден.
          </Text> */}

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>{activeCount} активни</Text>
            </View>
            <View style={[styles.statPill, styles.statPillSoft]}>
              <Text style={styles.statPillTextSoft}>{doneCount} купени</Text>
            </View>
          </View>

          <View style={styles.addCard}>
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

          {showLocal ? (
            <View style={styles.localBanner}>
              <Text style={styles.localBannerTitle}>Локален режим</Text>
              <Text style={styles.localBannerText}>
                Списъкът в момента се пази само на устройството. При логин ще се използва базата.
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Натисни квадратчето, за да отбележиш продукт като купен.
            </Text>
          )}
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
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Редакция на запис</Text>
            <Text style={styles.modalSubtitle}>
              Промени името на продукта в списъка.
            </Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },

  statPill: {
    borderRadius: 999,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statPillSoft: {
    backgroundColor: '#eef2f7',
  },

  statPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  statPillTextSoft: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },

  addCard: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },

  input: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    fontSize: 15,
    color: '#111827',
  },

  addBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  addBtnDisabled: {
    opacity: 0.45,
  },

  addBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },

  hint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '700',
  },

  localBanner: {
    marginTop: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 16,
    padding: 12,
  },

  localBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9a3412',
    marginBottom: 4,
  },

  localBannerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#9a3412',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  rowDone: {
    opacity: 0.72,
    backgroundColor: '#f8fafc',
  },

  check: {
    padding: 2,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  checkboxOn: {
    borderColor: '#22c55e',
    backgroundColor: '#ecfdf5',
  },

  checkMark: {
    fontWeight: '900',
    color: '#16a34a',
    marginTop: -1,
  },

  rowBody: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '800',
    lineHeight: 20,
  },

  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },

  editText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 15,
  },

  delBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },

  delText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 15,
  },

  empty: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    padding: 18,
    justifyContent: 'center',
  },

  modalCard: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  modalSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    marginBottom: 12,
  },

  modalInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    fontSize: 15,
    color: '#111827',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 14,
  },

  modalBtnGhost: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },

  modalBtnGhostText: {
    color: '#111827',
    fontWeight: '900',
  },

  modalBtnPrimary: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  modalBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '900',
  },
});