import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { watchlistApi, companiesApi, WatchlistItem } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

export default function WatchlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ ticker: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError('');
    watchlistApi
      .getList()
      .then(setItems)
      .catch(() => setError('No se pudo cargar la watchlist'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadList);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await companiesApi.search(text.trim());
      setSuggestions(results.slice(0, 5));
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (ticker: string) => {
    setSuggestions([]);
    setQuery('');
    setAdding(true);
    try {
      await watchlistApi.add(ticker);
      loadList();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (ticker: string) => {
    Alert.alert('Eliminar', `¿Eliminar ${ticker} de tu watchlist?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await watchlistApi.remove(ticker);
            setItems((prev) => prev.filter((i) => i.ticker !== ticker));
            setSelected((prev) => prev.filter((t) => t !== ticker));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const toggleSelect = (ticker: string) => {
    setSelected((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker],
    );
  };

  const handleCompare = () => {
    if (selected.length < 2) {
      Alert.alert('Seleccioná al menos 2 empresas para comparar');
      return;
    }
    router.push({ pathname: '/(app)/compare', params: { tickers: selected.join(',') } });
  };

  const renderItem = ({ item }: { item: WatchlistItem }) => {
    const isSelected = selected.includes(item.ticker);
    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => toggleSelect(item.ticker)}
        activeOpacity={0.75}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.tickerBadge, isSelected && styles.tickerBadgeSelected]}>
            <Text style={styles.tickerText}>{item.ticker}</Text>
          </View>
          <View>
            <Text style={styles.rowTicker}>{item.ticker}</Text>
            <Text style={styles.rowPrice}>
              {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : '—'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.ticker)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Watchlist</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Buscar empresa o ticker…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {adding && <ActivityIndicator color={colors.primary} style={styles.inputSpinner} />}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {searching && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xs }} />
          )}
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s.ticker}
              style={styles.suggestionRow}
              onPress={() => handleAdd(s.ticker)}
            >
              <Text style={styles.suggestionTicker}>{s.ticker}</Text>
              <Text style={styles.suggestionName} numberOfLines={1}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selected.length > 0 && (
        <TouchableOpacity style={styles.compareBar} onPress={handleCompare}>
          <Text style={styles.compareText}>
            Comparar {selected.length} empresa{selected.length !== 1 ? 's' : ''} →
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadList} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Tu watchlist está vacía</Text>
          <Text style={styles.emptySubtitle}>Buscá una empresa para comenzar a seguirla</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.ticker}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 46,
    color: colors.textInput,
    fontSize: 14,
  },
  inputSpinner: {
    marginLeft: spacing.xs,
  },
  suggestions: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  suggestionTicker: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    width: 56,
  },
  suggestionName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  compareBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  compareText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tickerBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerBadgeSelected: {
    backgroundColor: colors.primary,
  },
  tickerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  rowTicker: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  rowPrice: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: colors.errorText,
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
