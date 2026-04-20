import { Button } from '../ui/Button';
import type { LoginRequest } from '../../types/api';

const ACCOUNTS: Array<{ title: string; payload: LoginRequest }> = [
  {
    title: 'Сотрудник',
    payload: { username: 'employee', password: 'password123' },
  },
  {
    title: 'Согласующий',
    payload: { username: 'approver', password: 'password123' },
  },
  {
    title: 'Админ',
    payload: { username: 'admin', password: 'password123' },
  },
];

export function DemoAccounts({ onPick }: { onPick: (payload: LoginRequest) => void }): JSX.Element {
  return (
      <div className="demo-accounts">
        {ACCOUNTS.map((item) => (
            <div key={item.title} className="demo-account-card">
              <div className="demo-account-title">{item.title}</div>
              <Button variant="ghost" onClick={() => onPick(item.payload)}>
                Выбрать
              </Button>
            </div>
        ))}
      </div>
  );
}