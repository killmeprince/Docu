import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createDocumentType, getDocumentTypes, getUsers } from '../api/admin';
import type { DocumentTypeRequest, DocumentTypeResponse, UserResponse } from '../types/api';
import { WindowCard } from '../components/layout/WindowCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export function AdminPage(): JSX.Element {
  const { session } = useAuth();
  const [types, setTypes] = useState<DocumentTypeResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [form, setForm] = useState<DocumentTypeRequest>({ code: '', name: '', active: true });

  async function load(): Promise<void> {
    if (!session) return;
    const [loadedTypes, loadedUsers] = await Promise.all([
      getDocumentTypes(session.token),
      getUsers(session.token),
    ]);
    setTypes(loadedTypes);
    setUsers(loadedUsers);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function submit(): Promise<void> {
    if (!session) return;
    await createDocumentType(session.token, form);
    setForm({ code: '', name: '', active: true });
    await load();
  }

  return (
    <div className="page-grid admin-grid">
      <WindowCard title="Справочник типов документов" subtitle="Базовая административная настройка контуров документооборота.">
        <div className="form-grid three-columns">
          <Input label="Код" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <Input label="Наименование" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Select
            label="Активность"
            value={String(form.active)}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}
          >
            <option value="true">Активен</option>
            <option value="false">Выключен</option>
          </Select>
        </div>
        <div className="toolbar-row">
          <Button onClick={() => void submit()}>Создать тип</Button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Код</th>
                <th>Наименование</th>
                <th>Активен</th>
              </tr>
            </thead>
            <tbody>
              {types.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="mono">{item.code}</td>
                  <td>{item.name}</td>
                  <td>{String(item.active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WindowCard>

      <WindowCard title="Пользователи и роли" subtitle="Минимально достаточный административный контур MVP.">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Логин</th>
                <th>ФИО</th>
                <th>Активен</th>
                <th>Роли</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="mono">{item.username}</td>
                  <td>{item.fullName}</td>
                  <td>{String(item.active)}</td>
                  <td>{item.roles.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WindowCard>

      <WindowCard title="Продуктовый roadmap" subtitle="Функции, которые можно капитализировать дальше, не размывая MVP.">
        <ul className="ordered-list compact-list">
          <li>Модуль печати и приёма документов с привязкой к реестру оборудования.</li>
          <li>AI-анализ документов и авто-классификация по типам после загрузки.</li>
          <li>Рекомендации по полочному хранению и маркировке бумажного архива.</li>
          <li>Пакетная обработка и ассистент для разборки входящего потока документов.</li>
        </ul>
      </WindowCard>
    </div>
  );
}
