import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, radii, spacing } from '@/utils/theme';

type Props = {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  error?: string;
};

export default function AuthLayout({ title, children, footer, error }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>↗</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Portfolio Tracker</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}
          {children}
        </View>

        <Text style={styles.footer}>{footer}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
    gap: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 20,
  },
});
