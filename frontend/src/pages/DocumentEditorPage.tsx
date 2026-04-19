import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createDocument, getDocument, updateDocument } from '../api/documents';
import { WindowCard } from '../components/layout/WindowCard';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import type { DocumentCreateRequest, DocumentUpdateRequest } from '../types/api';

export function DocumentEditorPage({ mode }: { mode: 'create' | 'edit' }): JSX.Element {
  const { session } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const documentId = Number(params.documentId || 0);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<DocumentCreateRequest>({
    documentTypeId: 1,
    registrationNumber: '',
    title: '',
    description: '',
    changeComment: 'Первичная редакция',
  });

  useEffect(() => {
    if (!session || mode !== 'edit' || !documentId) return;
    void getDocument(session.token, documentId).then((details) => {
      setForm({
        documentTypeId: details.documentTypeId,
        registrationNumber: details.registrationNumber,
        title: details.title,
        description: details.description || '',
        changeComment: 'Обновлённая редакция',
      });
    });
  }, [documentId, mode, session]);

  async function handleSubmit(): Promise<void> {
    if (!session) return;
    if (mode === 'create') {
      const created = await createDocument(session.token, form, file);
      navigate(`/документы/${created.id}`);
      return;
    }

    const payload: DocumentUpdateRequest = {
      documentTypeId: form.documentTypeId,
      title: form.title,
      description: form.description,
      changeComment: form.changeComment,
    };
    const updated = await updateDocument(session.token, documentId, payload, file);
    navigate(`/документы/${updated.id}`);
  }

  return (
    <div className="page-grid editor-grid">
      <WindowCard
        title={mode === 'create' ? 'Создание документа' : `Новая версия документа #${documentId}`}
        subtitle="Карточка документа и содержательная версия должны сохраняться как управляемый объект."
      >
        <div className="form-grid two-columns">
          <Input
            label="ID типа документа"
            type="number"
            value={String(form.documentTypeId)}
            onChange={(event) => setForm((current) => ({ ...current, documentTypeId: Number(event.target.value || 1) }))}
          />
          <Input
            label="Регистрационный номер"
            value={form.registrationNumber}
            onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))}
            disabled={mode === 'edit'}
          />
          <Input
            label="Название"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <Input
            label="Комментарий к изменению"
            value={form.changeComment}
            onChange={(event) => setForm((current) => ({ ...current, changeComment: event.target.value }))}
          />
          <div className="form-grid-span-2">
            <Textarea
              label="Описание"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <label className="field form-grid-span-2">
            <span className="field-label">Файл версии</span>
            <input className="input" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <span className="field-hint">Текущий файл: {file?.name || 'не выбран'}</span>
          </label>
        </div>
        <div className="toolbar-row">
          <Button onClick={() => void handleSubmit()}>
            {mode === 'create' ? 'Сохранить черновик' : 'Сохранить новую версию'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/документы')}>Отмена</Button>
        </div>
      </WindowCard>

      <WindowCard title="Продуктовые принципы экрана" subtitle="Почему именно так стоит показывать работу с документом.">
        <ul className="ordered-list compact-list">
          <li>Документ создаётся как карточка с регистрационными атрибутами.</li>
          <li>Каждое содержательное изменение идёт новой версией, а не перезаписью прежней.</li>
          <li>Файл привязывается к версии, а не живёт отдельно от неё.</li>
          <li>Комментарий к изменению делает доработки объяснимыми для согласующего.</li>
        </ul>
      </WindowCard>
    </div>
  );
}
