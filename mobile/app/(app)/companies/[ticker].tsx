import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { companiesApi } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialMetrics {
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  totalAssets: number | null;
}

interface Filing {
  accessionNumber: string;
  type: string;
  date: string;
}

interface HistoricalEntry {
  date: string;
  value: number;
}

interface HistoricalData {
  revenue?: HistoricalEntry[];
  netIncome?: HistoricalEntry[];
  eps?: HistoricalEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return 'N/A';
  const neg = val < 0;
  const abs = Math.abs(val);
  const sign = neg ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

// ─── LineChart (pure RN — no external lib) ────────────────────────────────────

const CHART_WIDTH = Dimensions.get('window').width - spacing.lg * 2 - 32;
const CHART_HEIGHT = 160;
const PADDING_LEFT = 48;
const PADDING_BOTTOM = 28;
const PLOT_W = CHART_WIDTH - PADDING_LEFT;
const PLOT_H = CHART_HEIGHT - PADDING_BOTTOM;

type SeriesConfig = {
  key: 'revenue' | 'netIncome' | 'eps';
  label: string;
  color: string;
  yRight?: boolean;
};

const SERIES: SeriesConfig[] = [
  { key: 'revenue',   label: 'Revenue',    color: '#3b82f6' },
  { key: 'netIncome', label: 'Net Income', color: '#10b981' },
];
const EPS_SERIES: SeriesConfig = { key: 'eps', label: 'EPS', color: '#f59e0b', yRight: true };

function buildMergedDates(history: HistoricalData): string[] {
  const set = new Set<string>();
  history.revenue?.forEach((d) => set.add(d.date));
  history.netIncome?.forEach((d) => set.add(d.date));
  history.eps?.forEach((d) => set.add(d.date));
  return Array.from(set).sort();
}

function getSeriesValues(history: HistoricalData, dates: string[], key: 'revenue' | 'netIncome' | 'eps'): (number | null)[] {
  const map = new Map((history[key] ?? []).map((d) => [d.date, d.value]));
  return dates.map((d) => map.get(d) ?? null);
}

function minMax(values: (number | null)[]): { min: number; max: number } {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? { min: min - 1, max: max + 1 } : { min, max };
}

function toX(i: number, total: number): number {
  if (total <= 1) return PADDING_LEFT + PLOT_W / 2;
  return PADDING_LEFT + (i / (total - 1)) * PLOT_W;
}

function toY(val: number, min: number, max: number): number {
  return PLOT_H - ((val - min) / (max - min)) * PLOT_H;
}

type Segment = { x1: number; y1: number; x2: number; y2: number; color: string };

function buildSegments(
  values: (number | null)[],
  min: number,
  max: number,
  color: string,
): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const v1 = values[i];
    const v2 = values[i + 1];
    if (v1 === null || v2 === null) continue;
    segs.push({
      x1: toX(i, values.length),
      y1: toY(v1, min, max),
      x2: toX(i + 1, values.length),
      y2: toY(v2, min, max),
      color,
    });
  }
  return segs;
}

function LineSegment({ x1, y1, x2, y2, color }: Segment) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1,
        width: length,
        height: 2.5,
        backgroundColor: color,
        transformOrigin: '0 50%',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function Dot({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        borderWidth: 1.5,
        borderColor: colors.bg,
      }}
    />
  );
}

function HistoricalChart({ history }: { history: HistoricalData }) {
  const dates = buildMergedDates(history);
  if (dates.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.placeholderText}>No hay datos históricos suficientes para graficar.</Text>
      </View>
    );
  }

  const revValues = getSeriesValues(history, dates, 'revenue');
  const niValues = getSeriesValues(history, dates, 'netIncome');
  const epsValues = getSeriesValues(history, dates, 'eps');

  // Left axis: revenue + netIncome combined range
  const leftMM = minMax([...revValues, ...niValues]);
  // Right axis: eps
  const epsMM = minMax(epsValues);

  const revSegs = buildSegments(revValues, leftMM.min, leftMM.max, '#3b82f6');
  const niSegs = buildSegments(niValues, leftMM.min, leftMM.max, '#10b981');
  const epsSegs = buildSegments(epsValues, epsMM.min, epsMM.max, '#f59e0b');

  // Y-axis labels (3 ticks)
  const leftTicks = [leftMM.min, (leftMM.min + leftMM.max) / 2, leftMM.max];
  const formatTick = (v: number) => {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    return `$${v.toFixed(0)}`;
  };

  // X-axis: show first, middle, last year only
  const xLabels = [
    { i: 0, label: dates[0].slice(0, 4) },
    { i: Math.floor((dates.length - 1) / 2), label: dates[Math.floor((dates.length - 1) / 2)].slice(0, 4) },
    { i: dates.length - 1, label: dates[dates.length - 1].slice(0, 4) },
  ];

  return (
    <View style={styles.chartCard}>
      {/* Legend */}
      <View style={styles.legendRow}>
        {[...SERIES, EPS_SERIES].map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Chart area */}
      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        {/* Y-axis labels */}
        {leftTicks.map((tick, i) => (
          <Text
            key={i}
            style={[styles.yLabel, { top: toY(tick, leftMM.min, leftMM.max) - 8 }]}
          >
            {formatTick(tick)}
          </Text>
        ))}

        {/* Grid lines */}
        {leftTicks.map((tick, i) => (
          <View
            key={i}
            style={[styles.gridLine, { top: toY(tick, leftMM.min, leftMM.max) }]}
          />
        ))}

        {/* Revenue segments */}
        {revSegs.map((seg, i) => <LineSegment key={`rev-${i}`} {...seg} />)}
        {/* NetIncome segments */}
        {niSegs.map((seg, i) => <LineSegment key={`ni-${i}`} {...seg} />)}
        {/* EPS segments */}
        {epsSegs.map((seg, i) => <LineSegment key={`eps-${i}`} {...seg} />)}

        {/* Dots — revenue */}
        {revValues.map((v, i) =>
          v !== null ? <Dot key={`rev-dot-${i}`} x={toX(i, dates.length)} y={toY(v, leftMM.min, leftMM.max)} color="#3b82f6" /> : null
        )}
        {/* Dots — netIncome */}
        {niValues.map((v, i) =>
          v !== null ? <Dot key={`ni-dot-${i}`} x={toX(i, dates.length)} y={toY(v, leftMM.min, leftMM.max)} color="#10b981" /> : null
        )}
        {/* Dots — EPS */}
        {epsValues.map((v, i) =>
          v !== null ? <Dot key={`eps-dot-${i}`} x={toX(i, dates.length)} y={toY(v, epsMM.min, epsMM.max)} color="#f59e0b" /> : null
        )}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <Text
            key={i}
            style={[styles.xLabel, { left: toX(i, dates.length) - 16 }]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

// ─── CompanyDetailScreen ──────────────────────────────────────────────────────

export default function CompanyDetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [history, setHistory] = useState<HistoricalData | null>(null);

  useEffect(() => {
    if (!ticker || ticker === 'null') {
      setError('Ticker inválido.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [metricsData, filingsData, historyData] = await Promise.all([
          companiesApi.getMetrics(ticker),
          companiesApi.getFilings(ticker),
          companiesApi.getHistorical(ticker),
        ]);
        setMetrics(metricsData as FinancialMetrics);
        setFilings(filingsData as Filing[]);
        setHistory(historyData as HistoricalData);
      } catch {
        setError('No se pudo cargar la información financiera de esta empresa.');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando datos de {ticker}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.errorBox}>
          <Text testID="error-message" style={styles.errorText}>{error}</Text>
        </View>
        <TouchableOpacity style={styles.backFromError} onPress={() => router.back()}>
          <Text style={styles.backFromErrorText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text testID="company-title" style={styles.headerTicker}>{ticker}</Text>
          <Text style={styles.headerSubtitle}>Datos financieros</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Métricas actuales */}
        <Text style={styles.sectionTitle}>MÉTRICAS ACTUALES</Text>
        <View testID="metrics-section" style={styles.metricsGrid}>
          <MetricCard title="Revenue" value={formatCurrency(metrics?.revenue)} />
          <MetricCard title="Net Income" value={formatCurrency(metrics?.netIncome)} />
          <MetricCard title="EPS" value={
            metrics?.eps != null
              ? `$${metrics.eps.toFixed(2)}`
              : 'N/A'
          } />
          <MetricCard title="Total Assets" value={formatCurrency(metrics?.totalAssets)} />
        </View>

        {/* Evolución histórica */}
        <Text style={styles.sectionTitle}>EVOLUCIÓN HISTÓRICA</Text>
        {history ? (
          <HistoricalChart history={history} />
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>Sin datos históricos.</Text>
          </View>
        )}

        {/* Filings */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>FILINGS RECIENTES (10-K / 10-Q)</Text>
        <View testID="filings-section" style={styles.filingsContainer}>
          {filings.length > 0 ? (
            filings.map((filing, index) => (
              <View
                key={filing.accessionNumber}
                style={[styles.filingRow, index !== filings.length - 1 && styles.filingBorder]}
              >
                <View style={styles.filingLeft}>
                  <View style={[styles.typeBadge, filing.type === '10-K' ? styles.badge10K : styles.badge10Q]}>
                    <Text style={[styles.typeText, filing.type === '10-K' ? styles.text10K : styles.text10Q]}>
                      {filing.type}
                    </Text>
                  </View>
                  <Text style={styles.accessionText} numberOfLines={1} ellipsizeMode="middle">
                    {filing.accessionNumber}
                  </Text>
                </View>
                <View style={styles.filingRight}>
                  <Text style={styles.dateText}>{filing.date}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&accession=${filing.accessionNumber}`
                      )
                    }
                  >
                    <Text style={styles.secLink}>Ver →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No hay filings recientes disponibles.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.errorText,
    textAlign: 'center',
    fontSize: 14,
  },
  backFromError: {
    marginTop: spacing.md,
  },
  backFromErrorText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    gap: spacing.md,
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
  headerInfo: {
    flex: 1,
  },
  headerTicker: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  metricTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  gridLine: {
    position: 'absolute',
    left: PADDING_LEFT,
    width: PLOT_W,
    height: 1,
    backgroundColor: 'rgba(71,85,105,0.3)',
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: PADDING_LEFT - 4,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    top: PLOT_H + 6,
    width: 32,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chartPlaceholder: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    padding: spacing.md,
  },

  // Filings
  filingsContainer: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  filingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  filingBorder: {
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
  },
  filingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
    gap: 8,
  },
  filingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  badge10K: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  badge10Q: {
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderColor: 'rgba(6,182,212,0.3)',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  text10K: { color: '#93c5fd' },
  text10Q: { color: '#67e8f9' },
  accessionText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  secLink: {
    color: colors.textLink,
    fontSize: 12,
    fontWeight: '600',
  },
});
