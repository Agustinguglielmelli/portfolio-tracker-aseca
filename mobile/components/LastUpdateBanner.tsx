import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/utils/theme';
import { LastUpdateData } from '@/services/api';

type Props = {
  data: LastUpdateData | null;
  loading: boolean;
  error: boolean;
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LastUpdateBanner({ data, loading, error }: Props) {
  if (loading) {
    return (
      <View style={[styles.banner, styles.loadingBanner]}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={styles.loadingText}>Verificando actualización...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <Text style={styles.errorText}>⚠ No se pudo obtener la fecha de actualización</Text>
      </View>
    );
  }

  if (!data || !data.lastUpdate) {
    return (
      <View style={[styles.banner, styles.warningBanner]}>
        <Text style={styles.warningText}>⚠ Sin datos de precios cargados</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.successBanner]}>
      <Text style={styles.successText}>
        🕐 Actualizado:{' '}
        <Text style={styles.successDate}>{formatDate(data.lastUpdate)}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: 8,
  },
  loadingBanner: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: colors.errorText,
    fontSize: 12,
  },
  warningBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  successDate: {
    color: colors.textLabel,
    fontWeight: '600',
  },
});
