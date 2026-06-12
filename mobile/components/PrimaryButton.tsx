import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radii } from '@/utils/theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export default function PrimaryButton({ label, onPress, loading = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
