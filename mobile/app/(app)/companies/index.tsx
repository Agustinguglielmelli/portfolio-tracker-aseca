import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { companiesApi } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

interface CompanySearchResult {
  cik: string;
  name: string;
  ticker: string;
}

export default function CompanySearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await companiesApi.search(q.trim());
      setResults(data.filter((c) => !!c.ticker) as any);
      setHasSearched(true);
    } catch {
      setError('No se pudo realizar la búsqueda.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 350);
  };

  const renderItem = ({ item }: { item: CompanySearchResult }) => (
    <TouchableOpacity
      testID={`ticker-option-${item.ticker}`}
      accessibilityLabel={`ticker-option-${item.ticker}`}
      style={styles.resultItem}
      onPress={() => router.push(`/(app)/companies/${item.ticker}`)}
      activeOpacity={0.75}
    >
      <View style={styles.resultInfo}>
        <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.companyCik}>CIK: {item.cik}</Text>
      </View>
      <View style={styles.tickerBadge}>
        <Text style={styles.tickerText}>{item.ticker}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Buscar empresa</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search input */}
      <View style={styles.searchRow}>
        <TextInput
          testID="ticker-search"
          accessibilityLabel="ticker-search"
          style={styles.input}
          placeholder="Nombre o ticker (ej. AAPL, Apple)"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={() => doSearch(query)}
          returnKeyType="search"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator color={colors.primary} style={styles.inputSpinner} />
        )}
      </View>

      {/* Error */}
      {error ? (
        <Text testID="error-message" style={styles.errorText}>{error}</Text>
      ) : null}

      {/* Empty state */}
      {hasSearched && results.length === 0 && !loading && (
        <Text style={styles.emptyText}>
          No se encontraron resultados para "{query}".
        </Text>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.cik ?? item.ticker}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
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
  headerSpacer: {
    width: 36,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.textInput,
    fontSize: 14,
  },
  inputSpinner: {
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  resultItem: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  companyName: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  companyCik: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  tickerBadge: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderColor: 'rgba(37,99,235,0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.xl,
  },
  tickerText: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 13,
  },
});
