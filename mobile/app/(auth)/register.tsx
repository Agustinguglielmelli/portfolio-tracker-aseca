import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import PrimaryButton from '@/components/PrimaryButton';
import { authApi } from '@/services/api';
import { saveToken } from '@/utils/auth';
import { colors } from '@/utils/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    if (email.length > 256 || password.length > 256) {
      setError('El email y la contraseña no pueden superar los 256 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no son iguales, por favor, volvé a ingresarlas.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ email, password, confirmPassword });
      const loginData = await authApi.login({ email, password });
      await saveToken(loginData.token || loginData.access_token);
      router.replace('/(app)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      error={error}
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link href="/(auth)/login" style={{ color: colors.textLink, fontWeight: '500' }}>
            Iniciá sesión
          </Link>
        </>
      }
    >
      <FormInput
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FormInput
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="oneTimeCode"
      />
      <FormInput
        label="Confirmar contraseña"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="oneTimeCode"
      />
      <PrimaryButton label="Crear cuenta" onPress={handleRegister} loading={loading} testID="register-submit" />
    </AuthLayout>
  );
}
