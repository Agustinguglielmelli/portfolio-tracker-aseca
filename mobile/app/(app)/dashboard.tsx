import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import LastUpdateBanner from '@/components/LastUpdateBanner';
import { pricesApi, LastUpdateData } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

export default function DashboardScreen() {
  const [lastUpdate, setLastUpdate] = useState<LastUpdateData | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(true);
  const [updateError, setUpdateError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoadingUpdate(true);
      setUpdateError(false);
      pricesApi
        .getLastUpdate()
        .then(setLastUpdate)
        .catch(() => setUpdateError(true))
        .finally(() => setLoadingUpdate(false));
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>↗</Text>
          </View>
          <Text style={styles.title}>Portfolio Tracker</Text>
          <Text style={styles.subtitle}>Resumen de tu cartera</Text>
        </View>

        <LastUpdateBanner data={lastUpdate} loading={loadingUpdate} error={updateError} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio</Text>
          <Text style={styles.cardPlaceholder}>Tus posiciones aparecerán aquí</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Watchlist</Text>
          <Text style={styles.cardPlaceholder}>Tus tickers seguidos aparecerán aquí</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardPlaceholder: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
