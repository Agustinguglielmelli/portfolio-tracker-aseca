import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radii, spacing } from '@/utils/theme';

type Props = TextInputProps & {
  label: string;
};

export default function FormInput({ label, ...props }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textLabel,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textInput,
  },
});
