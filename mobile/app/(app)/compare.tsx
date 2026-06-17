import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { watchlistApi, CompareItem } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

const METRIC_LABELS: Record<string, string> = {
  pe: 'P/E',
  eps: 'EPS',
  marketCap: 'Market Cap',
  dividendYield: 'Div. Yield',
  revenue: 'Revenue',
  netIncome: 'Net Income',
  currentPrice: 'Precio actual',
};

function formatValue(key: string, value: unknown): string {
  if (value == null) return '—';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (key === 'marketCap' || key === 'revenue' || key === 'netIncome') {
    if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  }
  if (key === 'dividendYield') return `${(num * 100).toFixed(2)}%`;
  if (key === 'currentPrice') return `$${num.toFixed(2)}`;
  return num.toFixed(2);
}

export default function CompareScreen() {
  const router = useRouter();
  const { tickers } = useLocalSearchParams<{ tickers: string }>();
  const [data, setData] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tickerList = tickers ? tickers.split(',') : [];

  useEffect(() => {
    if (tickerList.length === 0) return;
    setLoading(true);
    watchlistApi
      .compare(tickerList)
      .then(setData)
      .catch(() => setError('No se pudo cargar la comparación'))
      .finally(() => setLoading(false));
  }, [tickers]);

  const metricKeys = Object.keys(METRIC_LABELS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Comparar</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando métricas…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tableWrapper}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.colLabel}>
                <View style={styles.headerCell}>
                  <Text style={styles.headerCellText}>Métrica</Text>
                </View>
                {metricKeys.map((key) => (
                  <View key={key} style={styles.metricCell}>
                    <Text style={styles.metricLabel}>{METRIC_LABELS[key]}</Text>
                  </View>
                ))}
              </View>

              {data.map((item) => (
                <View key={item.ticker} style={styles.col}>
                  <View style={styles.headerCell}>
                    <View style={styles.tickerBadge}>
                      <Text style={styles.tickerBadgeText}>{item.ticker}</Text>
                    </View>
                  </View>
                  {metricKeys.map((key) => (
                    <View key={key} style={styles.valueCell}>
                      <Text style={styles.valueText}>{formatValue(key, item[key])}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const CELL_HEIGHT = 48;

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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  tableWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  table: {
    flexDirection: 'row',
    gap: 1,
  },
  colLabel: {
    minWidth: 110,
  },
  col: {
    minWidth: 100,
  },
  headerCell: {
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: radii.sm,
    marginBottom: 1,
    paddingHorizontal: spacing.sm,
  },
  headerCellText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tickerBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tickerBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  metricCell: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  valueCell: {
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
});
