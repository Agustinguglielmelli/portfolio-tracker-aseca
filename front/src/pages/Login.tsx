import { useState, type SyntheticEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthContainer } from '../components/AuthContainer';
import { Title } from '../components/Title';
import { ErrorMessage } from '../components/ErrorMessage';
import { Form } from '../components/Form';
import { AuthFooter } from '../components/AuthFooter';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (email.length > 256 || password.length > 256) {
            setError('El email y la contraseña no pueden superar los 256 caracteres.');
            return;
        }

        try {
            const data = await authApi.login({ email, password });
            localStorage.setItem('token', data.token || data.access_token);
            navigate('/dashboard');
        } catch (err) {
            if (err instanceof Error) {
                setError('Credenciales inválidas');
            } else {
                setError('Ocurrió un error inesperado');
            }
        }
    };

    return (
        <AuthContainer>
            <Title text="Iniciar Sesión" />
            <ErrorMessage error={error} />
            <Form onSubmit={handleSubmit}>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                />
                <Button type="submit" variant="success">
                    Ingresar
                </Button>
            </Form>
            <AuthFooter
                text="¿No tenés cuenta?"
                linkText="Registrate"
                to="/register"
            />
        </AuthContainer>
    );
}