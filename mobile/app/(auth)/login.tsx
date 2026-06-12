import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import PrimaryButton from '@/components/PrimaryButton';
import { authApi } from '@/services/api';
import { saveToken } from '@/utils/auth';
import { colors } from '@/utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (email.length > 256 || password.length > 256) {
      setError('El email y la contraseña no pueden superar los 256 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      await saveToken(data.token || data.access_token);
      router.replace('/(app)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      error={error}
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link href="/(auth)/register" style={{ color: colors.textLink, fontWeight: '500' }}>
            Registrate
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
      />
      <PrimaryButton label="Ingresar" onPress={handleLogin} loading={loading} />
    </AuthLayout>
  );
}
