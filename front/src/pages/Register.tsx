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

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (email.length > 256 || password.length > 256) {
            setError('El email y la contraseña no pueden superar los 256 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no son iguales, por favor, vuelva a ingresarlas.');
            return;
        }

        try {
            await authApi.register({ email, password, confirmPassword });
            const loginData = await authApi.login({ email, password });
            localStorage.setItem('token', loginData.token || loginData.access_token);
            navigate('/dashboard');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocurrió un error inesperado');
            }
        }
    };

    return (
        <AuthContainer>
            <Title text="Registro" />
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
                <Input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    value={confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    required
                />
                <Button type="submit" variant="primary">
                    Registrarse
                </Button>
            </Form>
            <AuthFooter
                text="¿Ya tenés cuenta?"
                linkText="Iniciá sesión"
                to="/login"
            />
        </AuthContainer>
    );
}