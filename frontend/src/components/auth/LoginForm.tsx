import { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { LoginRequest } from '../../types/api';

export function LoginForm({
                            onSubmit,
                            loading,
                            initial,
                          }: {
  onSubmit: (payload: LoginRequest) => Promise<void>;
  loading: boolean;
  initial: LoginRequest;
}): JSX.Element {
  const [form, setForm] = useState<LoginRequest>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  return (
      <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(form);
          }}
      >
        <Input
            label="Логин"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            autoComplete="username"
        />
        <Input
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            autoComplete="current-password"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </Button>
      </form>
  );
}