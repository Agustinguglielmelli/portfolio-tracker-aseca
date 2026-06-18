import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { portfolioApi, companiesApi } from '@/services/api';
import { clearToken } from '@/utils/auth';
import { colors, spacing, radii } from '@/utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Position = {
  ticker: string;
  totalShares: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
};

type Transaction = {
  id: number;
  ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  priceAtOp: number;
  date: string;
};

type TradeType = 'BUY' | 'SELL';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val: number | null): string {
  if (val === null) return '—';
  const abs = Math.abs(val);
  if (abs >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── TradeModal ───────────────────────────────────────────────────────────────

type TradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function TradeModal({ visible, onClose, onSuccess }: TradeModalProps) {
  const [type, setType] = useState<TradeType>('BUY');
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ ticker: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(todayString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reset() {
    setType('BUY');
    setTicker('');
    setCompanyName('');
    setQuery('');
    setSuggestions([]);
    setQuantity('');
    setDate(todayString());
    setError('');
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  const handleSearch = (text: string) => {
    setQuery(text);
    setTicker('');
    setCompanyName('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await companiesApi.search(text.trim());
        setSuggestions(results.filter((r) => !!r.ticker).slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectCompany = (item: { ticker: string; name: string }) => {
    setTicker(item.ticker);
    setCompanyName(item.name);
    setQuery(item.ticker);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    setError('');
    const qty = parseFloat(quantity);
    if (!ticker) return setError('Seleccioná una empresa.');
    if (isNaN(qty) || qty <= 0) return setError('La cantidad debe ser mayor a cero.');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Fecha inválida (YYYY-MM-DD).');

    setLoading(true);
    try {
      const dto = { ticker, quantity: qty, date };
      if (type === 'BUY') {
        await portfolioApi.buy(dto);
      } else {
        await portfolioApi.sell(dto);
      }
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={handleClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar operación</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* BUY / SELL toggle */}
          <View style={styles.tradeToggle}>
            {(['BUY', 'SELL'] as TradeType[]).map((t) => (
              <TouchableOpacity
                key={t}
                testID={`trade-type-${t.toLowerCase()}`}
                style={[
                  styles.tradeToggleBtn,
                  type === t && (t === 'BUY' ? styles.tradeToggleBuy : styles.tradeToggleSell),
                ]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.tradeToggleText, type === t && styles.tradeToggleTextActive]}>
                  {t === 'BUY' ? 'Compra' : 'Venta'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text testID="trade-error" style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Company search */}
          <Text style={styles.fieldLabel}>Empresa</Text>
          <View style={styles.searchBox}>
            <TextInput
              testID="ticker-search"
              style={styles.searchInput}
              placeholder="Buscar empresa o ticker…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator color={colors.primary} style={{ marginLeft: 8 }} />}
            {!!ticker && (
              <TouchableOpacity
                onPress={() => { setTicker(''); setCompanyName(''); setQuery(''); setSuggestions([]); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={s.ticker ?? `suggestion-${i}`}
                  testID={`ticker-option-${s.ticker}`}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectCompany(s)}
                >
                  <Text style={styles.suggestionTicker}>{s.ticker}</Text>
                  <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!companyName && (
            <Text style={styles.selectedCompany}>{companyName}</Text>
          )}

          {/* Quantity */}
          <Text style={styles.fieldLabel}>Cantidad</Text>
          <TextInput
            testID="quantity-input"
            style={styles.fieldInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />

          {/* Date */}
          <Text style={styles.fieldLabel}>Fecha (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder={todayString()}
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
          />

          <TouchableOpacity
            testID="trade-submit"
            style={[
              styles.submitBtn,
              type === 'BUY' ? styles.submitBuy : styles.submitSell,
              loading && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {type === 'BUY' ? 'Registrar compra' : 'Registrar venta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── TransactionHistory ───────────────────────────────────────────────────────

function TransactionHistory({ refreshKey }: { refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    portfolioApi
      .getTransactions()
      .then((data) => setTransactions(data as Transaction[]))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  return (
    <View style={styles.historyContainer}>
      <TouchableOpacity testID="history-toggle" style={styles.historyToggle} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.historyToggleText}>Historial de transacciones</Text>
        <Text style={styles.historyChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <>
          {loading && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          )}
          {!loading && transactions.length === 0 && (
            <Text style={styles.historyEmpty}>No hay transacciones registradas.</Text>
          )}
          {!loading && transactions.map((tx) => (
            <View key={tx.id} testID="transaction-row" style={styles.txRow}>
              <View style={[styles.txBadge, tx.type === 'BUY' ? styles.txBadgeBuy : styles.txBadgeSell]}>
                <Text style={[styles.txBadgeText, tx.type === 'BUY' ? styles.txBadgeTextBuy : styles.txBadgeTextSell]}>
                  {tx.type === 'BUY' ? 'Compra' : 'Venta'}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text testID="transaction-ticker" style={styles.txTicker}>{tx.ticker}</Text>
                <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txQty}>{tx.quantity} acc.</Text>
                <Text style={styles.txPrice}>{formatCurrency(tx.priceAtOp)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ─── PositionRow ──────────────────────────────────────────────────────────────

function PositionRow({ pos }: { pos: Position }) {
  const pnlPositive = pos.pnl !== null && pos.pnl >= 0;
  return (
    <View testID={`position-row-${pos.ticker}`} style={styles.posRow}>
      <View style={styles.posLeft}>
        <View style={styles.tickerBadge}>
          <Text style={styles.tickerBadgeText} numberOfLines={1}>{pos.ticker}</Text>
        </View>
        <View>
          <Text style={styles.posTicker}>{pos.ticker}</Text>
          <Text testID={`position-shares-${pos.ticker}`} style={styles.posDetail}>
            {pos.totalShares} acc · costo {formatCurrency(pos.avgCost)}
          </Text>
        </View>
      </View>
      <View style={styles.posRight}>
        <Text style={styles.posValue}>{formatCurrency(pos.currentValue)}</Text>
        {pos.pnl !== null && pos.pnlPct !== null ? (
          <Text style={[styles.posPnl, pnlPositive ? styles.posPnlPos : styles.posPnlNeg]}>
            {pnlPositive ? '+' : ''}{formatCurrency(pos.pnl)} ({pnlPositive ? '+' : ''}{pos.pnlPct.toFixed(2)}%)
          </Text>
        ) : (
          <Text style={styles.posNoPrice}>Sin precio</Text>
        )}
      </View>
    </View>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPortfolio = useCallback(() => {
    setLoading(true);
    setError('');
    portfolioApi
      .getPortfolio()
      .then((data) => setPositions(data as Position[]))
      .catch(() => setError('No se pudo cargar el portfolio.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(fetchPortfolio);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const totalValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalPnl = totalCost > 0 ? totalValue - totalCost : null;
  const totalPnlPct = totalCost > 0 && totalPnl !== null ? (totalPnl / totalCost) * 100 : null;
  const pnlPositive = totalPnl !== null && totalPnl >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <Text style={styles.headerSubtitle}>Resumen de tus posiciones</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="trade-button" style={styles.operateBtn} onPress={() => { console.log('[E2E] trade-button pressed, opening modal'); setShowModal(true); }}>
            <Text style={styles.operateBtnText}>+ Operar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.watchlistBtn} onPress={() => router.push('/(app)/watchlist')}>
            <Text style={styles.watchlistBtnText}>Watchlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.watchlistBtn} onPress={() => router.push('/(app)/companies')}>
            <Text style={styles.watchlistBtnText}>Empresas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary cards */}
      {!loading && positions.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Valor actual</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Invertido</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardPnl]}>
            <Text style={styles.summaryLabel}>P&L total</Text>
            <Text style={[styles.summaryValue, pnlPositive ? styles.pnlPos : styles.pnlNeg]}>
              {totalPnl !== null ? `${pnlPositive ? '+' : ''}${formatCurrency(totalPnl)}` : '—'}
            </Text>
            {totalPnlPct !== null && (
              <Text style={[styles.summaryPct, pnlPositive ? styles.pnlPos : styles.pnlNeg]}>
                {pnlPositive ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando portfolio...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && !!error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPortfolio}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty */}
      {!loading && !error && positions.length === 0 && (
        <View testID="portfolio-empty" style={{ flex: 1 }}>
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No tenés posiciones abiertas</Text>
            <Text style={styles.emptySubtitle}>Presioná "+ Operar" para registrar tu primera compra.</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
            <TransactionHistory refreshKey={refreshKey} />
          </ScrollView>
        </View>
      )}

      {/* Positions + history */}
      {!loading && !error && positions.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {positions.map((item) => <PositionRow key={item.ticker} pos={item} />)}
          <TransactionHistory refreshKey={refreshKey} />
        </ScrollView>
      )}

      <TradeModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          fetchPortfolio();
          setRefreshKey((k) => k + 1);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 210,
  },
  operateBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  operateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  watchlistBtn: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
  },
  watchlistBtnText: {
    color: colors.textLink,
    fontSize: 13,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutBtnText: {
    color: colors.errorText,
    fontSize: 13,
    fontWeight: '500',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  summaryCardPnl: {
    flex: 1.2,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryPct: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pnlPos: { color: '#34d399' },
  pnlNeg: { color: '#f87171' },

  // Center states
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
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
  emptyIcon: { fontSize: 40 },
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

  // Positions list
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  posRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  posLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tickerBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerBadgeText: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  posTicker: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  posDetail: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  posRight: {
    alignItems: 'flex-end',
  },
  posValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  posPnl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  posPnlPos: { color: '#34d399' },
  posPnlNeg: { color: '#f87171' },
  posNoPrice: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Transaction history
  historyContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  historyToggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyChevron: {
    color: colors.textMuted,
    fontSize: 12,
  },
  historyEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 10,
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  txBadgeBuy: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderColor: 'rgba(52,211,153,0.3)',
  },
  txBadgeSell: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  txBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  txBadgeTextBuy: { color: '#34d399' },
  txBadgeTextSell: { color: '#f87171' },
  txInfo: { flex: 1 },
  txTicker: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  txDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  txRight: { alignItems: 'flex-end' },
  txQty: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  txPrice: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },

  // Trade Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(148,163,184,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tradeToggle: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tradeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.8)',
  },
  tradeToggleBuy: { backgroundColor: '#059669' },
  tradeToggleSell: { backgroundColor: '#dc2626' },
  tradeToggleText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  tradeToggleTextActive: { color: '#fff' },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  errorBoxText: {
    color: colors.errorText,
    fontSize: 13,
  },
  fieldLabel: {
    color: colors.textLabel,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textInput,
    fontSize: 14,
  },
  clearBtn: {
    color: colors.textMuted,
    fontSize: 14,
    paddingLeft: 8,
  },
  suggestions: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginTop: 4,
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
  selectedCompany: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontStyle: 'italic',
  },
  fieldInput: {
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textInput,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  submitBuy: { backgroundColor: '#059669' },
  submitSell: { backgroundColor: '#dc2626' },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
