import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getDocumentTypes} from '../api/admin';
import {createDocument, getDocument, updateDocument} from '../api/documents';
import {WindowCard} from '../components/layout/WindowCard';
import {Input} from '../components/ui/Input';
import {Textarea} from '../components/ui/Textarea';
import {Button} from '../components/ui/Button';
import {useAuth} from '../contexts/AuthContext';
import type {DocumentCreateRequest, DocumentTypeResponse, DocumentUpdateRequest} from '../types/api';

const previewableExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt'];
const fallbackDocumentTypes = [
    {id: 1, name: 'Служебная записка', code: 'MEMO'},
    {id: 2, name: 'Приказ', code: 'ORDER'},
    {id: 3, name: 'Договор', code: 'CONTRACT'},
];

export function DocumentEditorPage({mode}: { mode: 'create' | 'edit' }): JSX.Element {
    const {session} = useAuth();
    const navigate = useNavigate();
    const params = useParams();
    const documentId = Number(params.documentId || 0);
    const [file, setFile] = useState<File | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([]);
    const [showTypeHint, setShowTypeHint] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [form, setForm] = useState<DocumentCreateRequest>({
        documentTypeId: 1,
        registrationNumber: '',
        title: '',
        description: '',
        changeComment: 'Первичная редакция',
    });

    useEffect(() => {
        if (!session) return;
        void getDocumentTypes(session.token)
            .then((types) => {
                const activeTypes = types.filter((item) => item.active);
                setDocumentTypes(activeTypes);
                if (mode === 'create' && activeTypes.length > 0) {
                    setForm((current) => ({...current, documentTypeId: activeTypes[0].id}));
                }
            })
            .catch(() => {
                setDocumentTypes([]);
            });
    }, [mode, session]);

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

    const previewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const fileExtension = file?.name.split('.').pop()?.toLowerCase() || '';
    const isPreviewSupported = previewUrl && previewableExtensions.includes(fileExtension);

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
        <div className="page-grid editor-clean-grid">
            <WindowCard title="Предпросмотр документа" subtitle="">
                <div className="doc-preview-shell">
                    {isPreviewSupported ? (
                        fileExtension === 'pdf' ? (
                            <iframe title="Предпросмотр PDF" src={previewUrl || ''} className="doc-preview-frame"/>
                        ) : (
                            <img src={previewUrl || ''} alt="Предпросмотр файла" className="doc-preview-image"/>
                        )
                    ) : (
                        <div className="doc-preview-placeholder" aria-hidden="true">
                            <div className="doc-preview-window">
                                <div className="doc-preview-toolbar"/>
                                <div className="doc-preview-page"/>
                                <div className="doc-preview-lines"/>
                            </div>
                            <p className="doc-preview-copy">Загрузите файл, чтобы увидеть предварительный просмотр.</p>
                        </div>
                    )}
                </div>
            </WindowCard>

            <WindowCard title={mode === 'create' ? 'Создание документа' : `Новая версия документа #${documentId}`}
                        subtitle="">
                <div className="form-grid">
                    <div className="field type-field">
                        <div className="type-field-head">
                            <span className="field-label">Тип документа</span>
                            <button
                                type="button"
                                className="type-hint-toggle"
                                onClick={() => setShowTypeHint((current) => !current)}
                                aria-label="Пояснение по типу документа"
                            >
                                ?
                            </button>
                        </div>
                        {documentTypes.length > 0 ? (
                            <select
                                className="input"
                                value={form.documentTypeId}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        documentTypeId: Number(event.target.value || current.documentTypeId),
                                    }))
                                }
                            >
                                {documentTypes.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                type="number"
                                value={String(form.documentTypeId)}
                                onChange={(event) => setForm((current) => ({
                                    ...current,
                                    documentTypeId: Number(event.target.value || 1)
                                }))}
                            />
                        )}
                        {showTypeHint ? (
                            <div className="type-hint-popover">
                                <ul className="compact-list">
                                    {(documentTypes.length > 0 ? documentTypes : fallbackDocumentTypes).map((item) => (
                                        <li key={item.id}>
                                            {item.id} — <strong>{item.name}</strong> · {item.code}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                    <Input
                        label="Регистрационный номер"
                        value={form.registrationNumber}
                        onChange={(event) => setForm((current) => ({
                            ...current,
                            registrationNumber: event.target.value
                        }))}
                        disabled={mode === 'edit'}
                    />
                    <Input
                        label="Название"
                        value={form.title}
                        onChange={(event) => setForm((current) => ({...current, title: event.target.value}))}
                    />
                    <button type="button" className="editor-advanced-toggle"
                            onClick={() => setShowAdvanced((current) => !current)}>
                        {showAdvanced ? 'Скрыть дополнительные поля' : 'Показать дополнительные поля'}
                    </button>

                    {showAdvanced ? (
                        <>
                            <Input
                                label="Комментарий к изменению"
                                value={form.changeComment}
                                onChange={(event) => setForm((current) => ({
                                    ...current,
                                    changeComment: event.target.value
                                }))}
                            />
                            <div className="form-grid-span-2">
                                <Textarea
                                    label="Описание"
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({
                                        ...current,
                                        description: event.target.value
                                    }))}
                                />
                            </div>
                        </>
                    ) : null}

                    <label className="field form-grid-span-2">
                        <span className="field-label">Файл версии</span>
                        <input className="input" type="file"
                               onChange={(event) => setFile(event.target.files?.[0] || null)}/>
                        <span className="field-hint">Текущий файл: {file?.name || 'не выбран'}</span>
                    </label>
                </div>
                <div className="toolbar-row">
                    <Button
                        onClick={() => void handleSubmit()}>{mode === 'create' ? 'Сохранить' : 'Сохранить версию'}</Button>
                    <Button variant="ghost" onClick={() => navigate('/документы')}>
                        Отмена
                    </Button>
                </div>
            </WindowCard>
        </div>
    );
}
