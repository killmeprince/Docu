import { Button } from '../ui/Button';
import type { LoginRequest } from '../../types/api';

const ACCOUNTS: Array<{ title: string; payload: LoginRequest }> = [
  {
    title: 'Автор документов',
    payload: { username: 'автор_документов', password: 'password123' },
  },
  {
    title: 'Руководитель отдела',
    payload: { username: 'руководитель_отдела', password: 'password123' },
  },
  {
    title: 'Администратор системы',
    payload: { username: 'администратор_системы', password: 'password123' },
  },
];

export function QuickAccounts({ onPick }: { onPick: (payload: LoginRequest) => void }): JSX.Element {
  return (
      <div className="quick-accounts">
        {ACCOUNTS.map((item) => (
            <div key={item.title} className="quick-account-card">
              <div className="quick-account-title">{item.title}</div>
              <Button variant="ghost" onClick={() => onPick(item.payload)}>
                Выбрать
              </Button>
            </div>
        ))}
      </div>
  );
}
