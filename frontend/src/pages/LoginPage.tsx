import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { QuickAccounts } from '../components/auth/QuickAccounts';
import { LoginForm } from '../components/auth/LoginForm';
import { WindowCard } from '../components/layout/WindowCard';
import type { LoginRequest } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage(): JSX.Element {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [selected, setSelected] = useState<LoginRequest>({
        username: 'автор_документов',
        password: 'password123',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(payload: LoginRequest): Promise<void> {
        setLoading(true);
        setError(null);
        try {
            await login(payload);
            navigate('/рабочий-стол');
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Не удалось выполнить вход');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-frame">
                <div className="login-brand">docu</div>

                <WindowCard className="login-card">
                    <LoginForm onSubmit={submit} loading={loading} initial={selected} />
                    {error ? <div className="form-error">{error}</div> : null}
                </WindowCard>

                <div className="login-bottom">
                    <QuickAccounts onPick={setSelected} />
                </div>
            </div>
        </div>
    );
}