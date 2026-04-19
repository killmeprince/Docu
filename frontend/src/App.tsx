import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const API_ROOT = API_BASE.replace(/\/api$/, '');

type Role = 'ROLE_EMPLOYEE' | 'ROLE_APPROVER' | 'ROLE_ADMIN';

type Session = {
    token: string;
    username: string;
    fullName: string;
    roles: string[];
};

type LoginRequest = {
    username: string;
    password: string;
};

type AuthResponse = {
    token: string;
    username: string;
    fullName: string;
    roles: string[];
};

type DocumentCreateRequest = {
    documentTypeId: number;
    registrationNumber: string;
    title: string;
    description: string;
    changeComment: string;
};

type DocumentUpdateRequest = {
    documentTypeId: number;
    title: string;
    description: string;
    changeComment: string;
};

type DocumentResponse = {
    id: number;
    documentTypeId: number;
    typeCode: string;
    type: string;
    registrationNumber: string;
    registrationDate: string;
    title: string;
    description: string;
    authorUsername: string;
    author: string;
    status: string;
    updatedAt: string;
    latestVersionNumber: number | null;
    latestFileName: string | null;
    latestFileUrl: string | null;
    editable: boolean;
};

type FileAttachmentResponse = {
    id: number;
    originalName: string;
    sizeBytes: number;
    downloadUrl: string;
};

type DocumentVersionResponse = {
    id: number;
    versionNumber: number;
    changeComment: string;
    createdAt: string;
    attachments: FileAttachmentResponse[];
};

type DocumentDetailsResponse = {
    id: number;
    documentTypeId: number;
    typeCode: string;
    type: string;
    registrationNumber: string;
    registrationDate: string;
    title: string;
    description: string;
    authorUsername: string;
    author: string;
    status: string;
    updatedAt: string;
    editable: boolean;
    versions: DocumentVersionResponse[];
};

type ApprovalStepResponse = {
    id: number;
    order: number;
    approver: string;
    status: string;
    comment: string | null;
    decidedAt: string | null;
};

type AuditEventResponse = {
    actor: string;
    type: string;
    details: string;
    createdAt: string;
};

type ReportResponse = {
    totalDocuments: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    reworkCount: number;
    inApprovalCount: number;
    approvedCount: number;
    rejectedCount: number;
    pendingStepCount: number;
};

type DocumentTypeResponse = {
    id: number;
    code: string;
    name: string;
    active: boolean;
};

type DocumentTypeRequest = {
    code: string;
    name: string;
    active: boolean;
};

type UserResponse = {
    id: number;
    username: string;
    fullName: string;
    active: boolean;
    roles: string[];
};

type Decision = 'APPROVE' | 'REWORK' | 'REJECT';

type LoginPreset = {
    title: string;
    role: Role;
    username: string;
    password: string;
    note: string;
};

const LOGIN_PRESETS: LoginPreset[] = [
    {
        title: 'Сотрудник',
        role: 'ROLE_EMPLOYEE',
        username: 'employee',
        password: 'password123',
        note: 'Создание, редактирование черновика, отправка на согласование, просмотр истории.',
    },
    {
        title: 'Согласующий',
        role: 'ROLE_APPROVER',
        username: 'approver',
        password: 'password123',
        note: 'Рассмотрение шага, согласование, возврат на доработку, отклонение.',
    },
    {
        title: 'Администратор',
        role: 'ROLE_ADMIN',
        username: 'admin',
        password: 'password123',
        note: 'Справочники, пользователи, базовое администрирование и отчётность.',
    },
];

class ApiError extends Error {
    public readonly status: number;

    public constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

function readSession(): Session | null {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('user');
    const fullName = localStorage.getItem('fullName');
    const rolesRaw = localStorage.getItem('roles');

    if (!token || !username || !rolesRaw) {
        return null;
    }

    let roles: string[] = [];
    try {
        roles = JSON.parse(rolesRaw) as string[];
    } catch {
        roles = [];
    }

    return {
        token,
        username,
        fullName: fullName || username,
        roles,
    };
}

function saveSession(session: Session): void {
    localStorage.setItem('token', session.token);
    localStorage.setItem('user', session.username);
    localStorage.setItem('fullName', session.fullName);
    localStorage.setItem('roles', JSON.stringify(session.roles));
}

function clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('fullName');
    localStorage.removeItem('roles');
}

function normalizePath(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('/api/')) {
        return `${API_ROOT}${path}`;
    }

    if (path.startsWith('/')) {
        return `${API_BASE}${path}`;
    }

    return `${API_BASE}/${path}`;
}

async function parseError(response: Response): Promise<ApiError> {
    const contentType = response.headers.get('content-type') || '';
    let message = `Request failed with status ${response.status}`;

    try {
        if (contentType.includes('application/json')) {
            const payload = (await response.json()) as { error?: string; message?: string };
            message = payload.error || payload.message || message;
        } else {
            const text = await response.text();
            if (text.trim()) {
                message = text;
            }
        }
    } catch {
        // ignore parsing problems and keep fallback message
    }

    return new ApiError(response.status, message);
}

async function requestJson<T>(
    path: string,
    options: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        token?: string;
        body?: unknown;
        isFormData?: boolean;
    } = {},
): Promise<T> {
    const { method = 'GET', token, body, isFormData = false } = options;
    const headers = new Headers();

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!isFormData) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(normalizePath(path), {
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? (body as BodyInit) : JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response);
    }

    if (response.status === 204) {
        return null as T;
    }

    const text = await response.text();
    if (!text) {
        return null as T;
    }

    return JSON.parse(text) as T;
}

async function requestVoid(
    path: string,
    options: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        token?: string;
        body?: unknown;
        isFormData?: boolean;
    } = {},
): Promise<void> {
    await requestJson<null>(path, options);
}

async function requestBlob(path: string, token: string): Promise<Blob> {
    const response = await fetch(normalizePath(path), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw await parseError(response);
    }

    return response.blob();
}

function buildMultipartPayload(payload: object, file: File | null): FormData {
    const formData = new FormData();
    formData.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (file) {
        formData.append('file', file);
    }
    return formData;
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

function formatNumber(value?: number | null): string {
    if (value === undefined || value === null) {
        return '—';
    }
    return new Intl.NumberFormat('ru-RU').format(value);
}

function roleLabel(role: string): string {
    switch (role) {
        case 'ROLE_EMPLOYEE':
            return 'Сотрудник';
        case 'ROLE_APPROVER':
            return 'Согласующий';
        case 'ROLE_ADMIN':
            return 'Администратор';
        default:
            return role;
    }
}

function statusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
}

function qp(filters: Record<string, string | number | null | undefined>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
            params.set(key, String(value));
        }
    });

    const query = params.toString();
    return query ? `?${query}` : '';
}

function fileSizeLabel(sizeBytes: number): string {
    if (!sizeBytes) {
        return '0 B';
    }
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }
    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

type WindowProps = {
    title: string;
    span?: 'span-3' | 'span-4' | 'span-5' | 'span-6' | 'span-7' | 'span-8' | 'span-12';
    children: ReactNode;
    compact?: boolean;
};

function Window({ title, span = 'span-4', children, compact = false }: WindowProps): JSX.Element {
    return (
        <section className={`xp-window ${span}`}>
            <div className="titlebar">
                <div className="titlebar-left">
                    <span className="titlebar-icon">D</span>
                    <span className="titlebar-text">{title}</span>
                </div>
                <div className="titlebar-actions" aria-hidden="true">
                    <button type="button" className="window-btn">
                        _
                    </button>
                    <button type="button" className="window-btn">
                        □
                    </button>
                    <button type="button" className="window-btn">
                        ×
                    </button>
                </div>
            </div>
            <div className={`window-body ${compact ? 'compact' : ''}`}>{children}</div>
        </section>
    );
}

export default function App(): JSX.Element {
    const [session, setSession] = useState<Session | null>(readSession());
    const [busy, setBusy] = useState(false);
    const [statusLine, setStatusLine] = useState('Готово к работе.');
    const [error, setError] = useState<string | null>(null);

    const [loginForm, setLoginForm] = useState<LoginRequest>({
        username: 'employee',
        password: 'password123',
    });

    const [filters, setFilters] = useState({
        registrationNumber: '',
        status: '',
        typeId: '',
        author: '',
    });

    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editor, setEditor] = useState<DocumentCreateRequest>({
        documentTypeId: 1,
        registrationNumber: '',
        title: '',
        description: '',
        changeComment: 'Initial draft',
    });

    const [docs, setDocs] = useState<DocumentResponse[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [details, setDetails] = useState<DocumentDetailsResponse | null>(null);
    const [audit, setAudit] = useState<AuditEventResponse[]>([]);
    const [steps, setSteps] = useState<ApprovalStepResponse[]>([]);
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([]);
    const [documentTypesError, setDocumentTypesError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [decisionComment, setDecisionComment] = useState('');
    const [typeForm, setTypeForm] = useState<DocumentTypeRequest>({
        code: '',
        name: '',
        active: true,
    });

    const isApprover = session?.roles.includes('ROLE_APPROVER') ?? false;
    const isAdmin = session?.roles.includes('ROLE_ADMIN') ?? false;

    const selectedSummary = useMemo(
        () => docs.find((item) => item.id === selectedId) || null,
        [docs, selectedId],
    );

    async function runTask(task: () => Promise<void>, startMessage: string, okMessage: string): Promise<void> {
        setBusy(true);
        setError(null);
        setStatusLine(startMessage);
        try {
            await task();
            setStatusLine(okMessage);
        } catch (taskError) {
            const message = taskError instanceof Error ? taskError.message : 'Неизвестная ошибка';
            setError(message);
            setStatusLine(`Ошибка: ${message}`);
            throw taskError;
        } finally {
            setBusy(false);
        }
    }

    async function loadDashboard(openCurrent = true): Promise<void> {
        if (!session) {
            return;
        }

        const list = await requestJson<DocumentResponse[]>(
            `/documents${qp({
                registrationNumber: filters.registrationNumber,
                status: filters.status,
                typeId: filters.typeId,
                author: filters.author,
            })}`,
            { token: session.token },
        );
        setDocs(list);

        if (openCurrent && selectedId !== null) {
            await loadDocument(selectedId);
        }

        try {
            const summary = await requestJson<ReportResponse>('/reports/summary', { token: session.token });
            setReport(summary);
            setReportError(null);
        } catch (reportLoadError) {
            if (reportLoadError instanceof ApiError && reportLoadError.status === 403) {
                setReport(null);
                setReportError('У текущей роли нет доступа к отчётности.');
            } else {
                throw reportLoadError;
            }
        }

        if (isAdmin) {
            const [types, allUsers] = await Promise.all([
                requestJson<DocumentTypeResponse[]>('/admin/document-types', { token: session.token }),
                requestJson<UserResponse[]>('/admin/users', { token: session.token }),
            ]);
            setDocumentTypes(types);
            setUsers(allUsers);
            setDocumentTypesError(null);
            setUsersError(null);
        } else {
            setDocumentTypes([]);
            setUsers([]);
            setDocumentTypesError('Справочник типов доступен администратору.');
            setUsersError('Список пользователей доступен администратору.');
        }
    }

    async function loadDocument(id: number): Promise<void> {
        if (!session) {
            return;
        }

        const detail = await requestJson<DocumentDetailsResponse>(`/documents/${id}`, {
            token: session.token,
        });
        const auditTrail = await requestJson<AuditEventResponse[]>(`/audit/documents/${id}`, {
            token: session.token,
        });

        let nextSteps: ApprovalStepResponse[] = [];
        if (detail.status === 'IN_APPROVAL') {
            nextSteps = await requestJson<ApprovalStepResponse[]>(`/documents/${id}/approval-steps`, {
                token: session.token,
            });
        }

        setSelectedId(id);
        setDetails(detail);
        setAudit(auditTrail);
        setSteps(nextSteps);
    }

    useEffect(() => {
        if (!session) {
            return;
        }

        void runTask(
            async () => {
                await loadDashboard(false);
            },
            'Загрузка данных рабочего стола...',
            'Рабочий стол загружен.',
        ).catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    function resetEditor(): void {
        setEditorMode('create');
        setSelectedFile(null);
        setEditor({
            documentTypeId: documentTypes[0]?.id ?? 1,
            registrationNumber: '',
            title: '',
            description: '',
            changeComment: 'Initial draft',
        });
    }

    function loadIntoEditor(): void {
        if (!details) {
            return;
        }

        setEditorMode('edit');
        setSelectedFile(null);
        setEditor({
            documentTypeId: details.documentTypeId,
            registrationNumber: details.registrationNumber,
            title: details.title,
            description: details.description || '',
            changeComment: 'Updated draft',
        });
        setStatusLine(`Документ #${details.id} загружен в редактор.`);
    }

    async function handleLogin(): Promise<void> {
        await runTask(
            async () => {
                const auth = await requestJson<AuthResponse>('/auth/login', {
                    method: 'POST',
                    body: loginForm,
                });

                const nextSession: Session = {
                    token: auth.token,
                    username: auth.username,
                    fullName: auth.fullName || auth.username,
                    roles: Array.isArray(auth.roles) ? auth.roles : [],
                };

                saveSession(nextSession);
                setSession(nextSession);
                setSelectedId(null);
                setDetails(null);
                setSteps([]);
                setAudit([]);
                resetEditor();
            },
            'Выполняется вход...',
            'Вход выполнен.',
        );
    }

    function applyPreset(preset: LoginPreset): void {
        setLoginForm({
            username: preset.username,
            password: preset.password,
        });
    }

    function logout(): void {
        clearSession();
        setSession(null);
        setDocs([]);
        setDetails(null);
        setSteps([]);
        setAudit([]);
        setReport(null);
        setUsers([]);
        setDocumentTypes([]);
        setSelectedId(null);
        setStatusLine('Сеанс завершён.');
        setError(null);
    }

    async function refresh(): Promise<void> {
        if (!session) {
            return;
        }

        await runTask(
            async () => {
                await loadDashboard(true);
            },
            'Обновление данных...',
            'Данные обновлены.',
        );
    }

    async function submitDocument(): Promise<void> {
        if (!session) {
            return;
        }

        await runTask(
            async () => {
                if (editorMode === 'create') {
                    const created = await requestJson<DocumentResponse>('/documents', {
                        method: 'POST',
                        token: session.token,
                        body: buildMultipartPayload(editor, selectedFile),
                        isFormData: true,
                    });
                    await loadDashboard(false);
                    await loadDocument(created.id);
                } else {
                    if (!selectedId) {
                        throw new Error('Для редактирования нужно выбрать документ.');
                    }

                    const updatePayload: DocumentUpdateRequest = {
                        documentTypeId: editor.documentTypeId,
                        title: editor.title,
                        description: editor.description,
                        changeComment: editor.changeComment,
                    };

                    const updated = await requestJson<DocumentResponse>(`/documents/${selectedId}`, {
                        method: 'PUT',
                        token: session.token,
                        body: buildMultipartPayload(updatePayload, selectedFile),
                        isFormData: true,
                    });
                    await loadDashboard(false);
                    await loadDocument(updated.id);
                }

                setSelectedFile(null);
            },
            editorMode === 'create' ? 'Создание документа...' : 'Сохранение новой версии...',
            editorMode === 'create' ? 'Документ создан.' : 'Новая версия сохранена.',
        );
    }

    async function sendToApproval(id: number): Promise<void> {
        if (!session) {
            return;
        }

        await runTask(
            async () => {
                await requestVoid(`/documents/${id}/send-to-approval`, {
                    method: 'POST',
                    token: session.token,
                });
                await loadDashboard(false);
                await loadDocument(id);
            },
            'Документ отправляется на согласование...',
            'Документ отправлен на согласование.',
        );
    }

    async function decide(stepId: number, decision: Decision): Promise<void> {
        if (!session || !selectedId) {
            return;
        }

        await runTask(
            async () => {
                await requestVoid(`/approvals/steps/${stepId}/decision`, {
                    method: 'POST',
                    token: session.token,
                    body: {
                        decision,
                        comment: decisionComment,
                    },
                });
                setDecisionComment('');
                await loadDashboard(false);
                await loadDocument(selectedId);
            },
            'Решение по шагу сохраняется...',
            'Решение по шагу сохранено.',
        );
    }

    async function createType(): Promise<void> {
        if (!session) {
            return;
        }

        await runTask(
            async () => {
                await requestJson<DocumentTypeResponse>('/admin/document-types', {
                    method: 'POST',
                    token: session.token,
                    body: typeForm,
                });
                setTypeForm({
                    code: '',
                    name: '',
                    active: true,
                });
                await loadDashboard(true);
            },
            'Создание типа документа...',
            'Тип документа создан.',
        );
    }

    async function downloadAttachment(attachment: FileAttachmentResponse): Promise<void> {
        if (!session) {
            return;
        }

        await runTask(
            async () => {
                const blob = await requestBlob(attachment.downloadUrl, session.token);
                const objectUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = attachment.originalName;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(objectUrl);
            },
            `Скачивание файла ${attachment.originalName}...`,
            `Файл ${attachment.originalName} скачан.`,
        );
    }

    const sortedVersions = useMemo(() => {
        if (!details) {
            return [];
        }
        return [...details.versions].sort((left, right) => right.versionNumber - left.versionNumber);
    }, [details]);

    if (!session) {
        return (
            <div className="xp-screen">
                <div className="taskbar">
                    <button type="button" className="start-button">
                        start
                    </button>
                    <span className="taskbar-title">Docu MVP · Windows XP Demo Shell</span>
                    <span className="taskbar-spacer" />
                    <span>{busy ? 'Signing in...' : 'Ready'}</span>
                </div>

                <main className="desktop login-desktop">
                    <Window title="Docu :: Sign in" span="span-6">
                        <div className="notice">
                            Этот экран уже заточен под ручную проверку MVP. Для демонстрации используй готовые роли
                            или введи логин вручную.
                        </div>

                        <div className="toolbar" style={{ marginTop: 10 }}>
                            <button
                                type="button"
                                className="xp-button primary"
                                onClick={() => void handleLogin()}
                                disabled={busy}
                            >
                                Sign in
                            </button>
                        </div>

                        <div className="form-grid">
                            <label className="form-field">
                                <span className="field-label">Username</span>
                                <input
                                    className="xp-input"
                                    value={loginForm.username}
                                    onChange={(event) =>
                                        setLoginForm((current) => ({
                                            ...current,
                                            username: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="form-field">
                                <span className="field-label">Password</span>
                                <input
                                    className="xp-input"
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(event) =>
                                        setLoginForm((current) => ({
                                            ...current,
                                            password: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </div>

                        <div className="panel" style={{ marginTop: 10 }}>
                            <div className="field-label" style={{ marginBottom: 8 }}>
                                Быстрые профили входа
                            </div>
                            <div className="user-presets">
                                {LOGIN_PRESETS.map((preset) => (
                                    <div className="user-preset" key={preset.username}>
                                        <strong>{preset.title}</strong>
                                        <div className="muted mono">{preset.username}</div>
                                        <div className="muted" style={{ margin: '4px 0 8px' }}>
                                            {preset.note}
                                        </div>
                                        <button
                                            type="button"
                                            className="xp-button"
                                            onClick={() => applyPreset(preset)}
                                            disabled={busy}
                                        >
                                            Use preset
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error ? (
                            <div className="notice error" style={{ marginTop: 10 }}>
                                {error}
                            </div>
                        ) : null}
                    </Window>

                    <Window title="Manual scenario :: MVP walkthrough" span="span-6">
                        <div className="desktop-note">
                            Проверь backend и demo flow так:
                            <ol>
                                <li>Войди под <strong>employee</strong> и создай документ с файлом.</li>
                                <li>Открой карточку, проверь версии, аудит и скачивание вложения.</li>
                                <li>Отправь документ на согласование.</li>
                                <li>Выйди и войди под <strong>approver</strong>.</li>
                                <li>Открой тот же документ и верни его на доработку.</li>
                                <li>Снова войди под <strong>employee</strong>, обнови документ, отправь повторно.</li>
                                <li>Войди под <strong>approver</strong> и согласуй шаг.</li>
                                <li>Войди под <strong>admin</strong>, проверь отчётность, пользователей и типы документов.</li>
                            </ol>
                        </div>

                        <div className="panel" style={{ marginTop: 12 }}>
                            <div className="field-label">Технические ожидания по MVP</div>
                            <ul className="simple-list" style={{ marginTop: 8 }}>
                                <li>Карточка документа и версия не смешиваются.</li>
                                <li>Файл привязан к версии и скачивается через защищённый endpoint.</li>
                                <li>Редактирование возможно только для DRAFT / REWORK.</li>
                                <li>Статус документа и статус шага согласования разведены.</li>
                                <li>Audit trail пополняется на ключевых переходах.</li>
                            </ul>
                        </div>
                    </Window>
                </main>

                <div className="statusbar">
                    <span className="status-pill">{busy ? 'Busy' : 'Ready'}</span>
                    <span>{statusLine}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="xp-screen">
            <div className="taskbar">
                <button type="button" className="start-button">
                    start
                </button>
                <span className="taskbar-title">Docu MVP · Dialog Workspace</span>
                <span className="taskbar-spacer" />
                <span>
          {session.fullName} · {session.roles.map(roleLabel).join(', ')}
        </span>
            </div>

            <main className="desktop">
                <Window title={`Session :: ${session.fullName}`} span="span-4">
                    <div className="kv-list">
                        <div className="kv-key">User</div>
                        <div className="kv-value mono">{session.username}</div>

                        <div className="kv-key">Full name</div>
                        <div className="kv-value">{session.fullName}</div>

                        <div className="kv-key">Roles</div>
                        <div className="kv-value">
                            <div className="inline-actions">
                                {session.roles.map((role) => (
                                    <span key={role} className={`badge ${statusClass(role)}`}>
                    {roleLabel(role)}
                  </span>
                                ))}
                            </div>
                        </div>

                        <div className="kv-key">Selected document</div>
                        <div className="kv-value">{selectedId ? `#${selectedId}` : '—'}</div>
                    </div>

                    <div className="toolbar" style={{ marginTop: 12 }}>
                        <button type="button" className="xp-button primary" onClick={() => void refresh()} disabled={busy}>
                            Refresh desktop
                        </button>
                        <button type="button" className="xp-button" onClick={resetEditor} disabled={busy}>
                            New draft
                        </button>
                        <button type="button" className="xp-button danger" onClick={logout} disabled={busy}>
                            Logout
                        </button>
                    </div>

                    {error ? <div className="notice error">{error}</div> : null}
                </Window>

                <Window
                    title={`Document editor :: ${editorMode === 'create' ? 'create draft' : 'edit selected'}`}
                    span="span-8"
                >
                    <div className="form-grid">
                        <label className="form-field">
                            <span className="field-label">Document type ID</span>
                            <input
                                className="xp-input"
                                type="number"
                                value={editor.documentTypeId}
                                onChange={(event) =>
                                    setEditor((current) => ({
                                        ...current,
                                        documentTypeId: Number(event.target.value || 1),
                                    }))
                                }
                            />
                            <span className="field-hint">
                У employee/signer нет reference endpoint типов, поэтому ID остаётся редактируемым вручную.
              </span>
                        </label>

                        <label className="form-field">
                            <span className="field-label">Registration number</span>
                            <input
                                className="xp-input"
                                value={editor.registrationNumber}
                                onChange={(event) =>
                                    setEditor((current) => ({
                                        ...current,
                                        registrationNumber: event.target.value,
                                    }))
                                }
                                disabled={editorMode === 'edit'}
                            />
                        </label>

                        <label className="form-field span-2">
                            <span className="field-label">Title</span>
                            <input
                                className="xp-input"
                                value={editor.title}
                                onChange={(event) =>
                                    setEditor((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="form-field span-2">
                            <span className="field-label">Description</span>
                            <textarea
                                className="xp-textarea"
                                value={editor.description}
                                onChange={(event) =>
                                    setEditor((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="form-field span-2">
                            <span className="field-label">Change comment</span>
                            <input
                                className="xp-input"
                                value={editor.changeComment}
                                onChange={(event) =>
                                    setEditor((current) => ({
                                        ...current,
                                        changeComment: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="form-field span-2">
                            <span className="field-label">Attachment</span>
                            <input
                                className="xp-input"
                                type="file"
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    setSelectedFile(event.target.files?.[0] ?? null)
                                }
                            />
                            <span className="field-hint">
                Текущий файл: {selectedFile ? selectedFile.name : 'не выбран'}
              </span>
                        </label>
                    </div>

                    <div className="toolbar" style={{ marginTop: 12 }}>
                        <button type="button" className="xp-button primary" onClick={() => void submitDocument()} disabled={busy}>
                            {editorMode === 'create' ? 'Save draft' : 'Save new version'}
                        </button>
                        <button type="button" className="xp-button" onClick={resetEditor} disabled={busy}>
                            Reset editor
                        </button>
                        <button
                            type="button"
                            className="xp-button"
                            onClick={loadIntoEditor}
                            disabled={busy || !details || !details.editable}
                        >
                            Load selected into editor
                        </button>
                    </div>
                </Window>

                <Window title="Registry :: documents" span="span-8">
                    <div className="form-grid">
                        <label className="form-field">
                            <span className="field-label">Registration number</span>
                            <input
                                className="xp-input"
                                value={filters.registrationNumber}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        registrationNumber: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="form-field">
                            <span className="field-label">Status</span>
                            <input
                                className="xp-input"
                                value={filters.status}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        status: event.target.value,
                                    }))
                                }
                                placeholder="DRAFT / IN_APPROVAL / REWORK..."
                            />
                        </label>

                        <label className="form-field">
                            <span className="field-label">Type ID</span>
                            <input
                                className="xp-input"
                                value={filters.typeId}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        typeId: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="form-field">
                            <span className="field-label">Author</span>
                            <input
                                className="xp-input"
                                value={filters.author}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        author: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <div className="toolbar" style={{ marginTop: 12 }}>
                        <button type="button" className="xp-button primary" onClick={() => void refresh()} disabled={busy}>
                            Search / refresh
                        </button>
                    </div>

                    <table className="doc-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Reg</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Author</th>
                            <th>Version</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {docs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="muted">
                                    Документы не найдены.
                                </td>
                            </tr>
                        ) : (
                            docs.map((doc) => (
                                <tr key={doc.id} className={selectedId === doc.id ? 'selected' : ''}>
                                    <td className="mono">{doc.id}</td>
                                    <td className="mono">{doc.registrationNumber}</td>
                                    <td>{doc.type || doc.typeCode}</td>
                                    <td>{doc.title}</td>
                                    <td>
                                        <span className={`badge ${statusClass(doc.status)}`}>{doc.status}</span>
                                    </td>
                                    <td>{doc.author || doc.authorUsername}</td>
                                    <td>{doc.latestVersionNumber ?? '—'}</td>
                                    <td>
                                        <div className="inline-actions">
                                            <button
                                                type="button"
                                                className="xp-button"
                                                onClick={() =>
                                                    void runTask(
                                                        async () => {
                                                            await loadDocument(doc.id);
                                                        },
                                                        `Открытие карточки документа #${doc.id}...`,
                                                        `Карточка документа #${doc.id} открыта.`,
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                Open
                                            </button>

                                            {doc.editable ? (
                                                <button
                                                    type="button"
                                                    className="xp-button warn"
                                                    onClick={() =>
                                                        void runTask(
                                                            async () => {
                                                                await loadDocument(doc.id);
                                                                const detail = await requestJson<DocumentDetailsResponse>(
                                                                    `/documents/${doc.id}`,
                                                                    { token: session.token },
                                                                );
                                                                setDetails(detail);
                                                                setSelectedId(detail.id);
                                                                setEditorMode('edit');
                                                                setSelectedFile(null);
                                                                setEditor({
                                                                    documentTypeId: detail.documentTypeId,
                                                                    registrationNumber: detail.registrationNumber,
                                                                    title: detail.title,
                                                                    description: detail.description || '',
                                                                    changeComment: 'Updated draft',
                                                                });
                                                            },
                                                            `Документ #${doc.id} загружается в редактор...`,
                                                            `Документ #${doc.id} готов к редактированию.`,
                                                        )
                                                    }
                                                    disabled={busy}
                                                >
                                                    Edit
                                                </button>
                                            ) : null}

                                            {doc.status === 'DRAFT' || doc.status === 'REWORK' ? (
                                                <button
                                                    type="button"
                                                    className="xp-button primary"
                                                    onClick={() => void sendToApproval(doc.id)}
                                                    disabled={busy}
                                                >
                                                    Send approval
                                                </button>
                                            ) : null}

                                            {doc.latestFileUrl ? (
                                                <button
                                                    type="button"
                                                    className="xp-button"
                                                    onClick={() =>
                                                        void downloadAttachment({
                                                            id: 0,
                                                            originalName: doc.latestFileName || `document-${doc.id}`,
                                                            sizeBytes: 0,
                                                            downloadUrl: doc.latestFileUrl!,
                                                        })
                                                    }
                                                    disabled={busy}
                                                >
                                                    Download file
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </Window>

                <Window title={`Document card :: ${details ? details.registrationNumber : 'not selected'}`} span="span-4">
                    {!details ? (
                        <div className="notice">Выбери документ в реестре, чтобы открыть карточку, версии и аудит.</div>
                    ) : (
                        <>
                            <div className="kv-list">
                                <div className="kv-key">ID</div>
                                <div className="kv-value mono">{details.id}</div>

                                <div className="kv-key">Reg number</div>
                                <div className="kv-value mono">{details.registrationNumber}</div>

                                <div className="kv-key">Type</div>
                                <div className="kv-value">
                                    {details.type} <span className="muted">({details.typeCode})</span>
                                </div>

                                <div className="kv-key">Author</div>
                                <div className="kv-value">
                                    {details.author} <span className="muted">({details.authorUsername})</span>
                                </div>

                                <div className="kv-key">Status</div>
                                <div className="kv-value">
                                    <span className={`badge ${statusClass(details.status)}`}>{details.status}</span>
                                </div>

                                <div className="kv-key">Registration date</div>
                                <div className="kv-value">{formatDateTime(details.registrationDate)}</div>

                                <div className="kv-key">Updated at</div>
                                <div className="kv-value">{formatDateTime(details.updatedAt)}</div>

                                <div className="kv-key">Description</div>
                                <div className="kv-value">{details.description || '—'}</div>
                            </div>

                            <div className="toolbar" style={{ marginTop: 12 }}>
                                {details.editable ? (
                                    <button type="button" className="xp-button warn" onClick={loadIntoEditor} disabled={busy}>
                                        Load to editor
                                    </button>
                                ) : null}

                                {(details.status === 'DRAFT' || details.status === 'REWORK') && details.editable ? (
                                    <button
                                        type="button"
                                        className="xp-button primary"
                                        onClick={() => void sendToApproval(details.id)}
                                        disabled={busy}
                                    >
                                        Send to approval
                                    </button>
                                ) : null}
                            </div>

                            <div className="panel" style={{ marginTop: 10 }}>
                                <div className="field-label" style={{ marginBottom: 8 }}>
                                    Versions
                                </div>
                                {sortedVersions.length === 0 ? (
                                    <div className="muted">Версии отсутствуют.</div>
                                ) : (
                                    <ul className="version-list">
                                        {sortedVersions.map((version) => (
                                            <li key={version.id}>
                                                <div className="version-head">
                                                    <span>Version #{version.versionNumber}</span>
                                                    <span>{formatDateTime(version.createdAt)}</span>
                                                </div>
                                                <div className="muted" style={{ marginBottom: 8 }}>
                                                    {version.changeComment || 'Без комментария'}
                                                </div>

                                                {version.attachments.length === 0 ? (
                                                    <div className="muted">Вложений нет.</div>
                                                ) : (
                                                    <div className="inline-actions">
                                                        {version.attachments.map((attachment) => (
                                                            <button
                                                                key={attachment.id}
                                                                type="button"
                                                                className="xp-button"
                                                                onClick={() => void downloadAttachment(attachment)}
                                                                disabled={busy}
                                                            >
                                                                {attachment.originalName} · {fileSizeLabel(attachment.sizeBytes)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </Window>

                <Window title="Approvals :: workflow actions" span="span-6">
                    {!isApprover ? (
                        <div className="notice">Эта панель активна только для роли согласующего.</div>
                    ) : !details ? (
                        <div className="notice">Открой документ в статусе IN_APPROVAL.</div>
                    ) : details.status !== 'IN_APPROVAL' ? (
                        <div className="notice">Выбранный документ сейчас не находится на согласовании.</div>
                    ) : (
                        <>
                            <label className="form-field">
                                <span className="field-label">Decision comment</span>
                                <textarea
                                    className="xp-textarea"
                                    value={decisionComment}
                                    onChange={(event) => setDecisionComment(event.target.value)}
                                    placeholder="Комментарий согласующего"
                                />
                            </label>

                            <div className="panel" style={{ marginTop: 10 }}>
                                {steps.length === 0 ? (
                                    <div className="muted">Шаги согласования не найдены.</div>
                                ) : (
                                    <ul className="steps-list">
                                        {steps.map((step) => (
                                            <li key={step.id}>
                                                <div className="step-head">
                          <span>
                            Step #{step.order} · {step.approver}
                          </span>
                                                    <span className={`badge ${statusClass(step.status)}`}>{step.status}</span>
                                                </div>

                                                <div className="muted">
                                                    Comment: {step.comment || '—'} · Decided at: {formatDateTime(step.decidedAt)}
                                                </div>

                                                {step.status === 'PENDING' ? (
                                                    <div className="inline-actions" style={{ marginTop: 8 }}>
                                                        <button
                                                            type="button"
                                                            className="xp-button good"
                                                            onClick={() => void decide(step.id, 'APPROVE')}
                                                            disabled={busy}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="xp-button warn"
                                                            onClick={() => void decide(step.id, 'REWORK')}
                                                            disabled={busy}
                                                        >
                                                            Return to rework
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="xp-button danger"
                                                            onClick={() => void decide(step.id, 'REJECT')}
                                                            disabled={busy}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </Window>

                <Window title={`Audit trail :: ${details ? details.registrationNumber : 'not selected'}`} span="span-6">
                    {!details ? (
                        <div className="notice">Открой документ, чтобы увидеть журнал значимых событий.</div>
                    ) : audit.length === 0 ? (
                        <div className="notice">По выбранному документу ещё нет записей аудита.</div>
                    ) : (
                        <ul className="audit-list">
                            {audit.map((item, index) => (
                                <li key={`${item.createdAt}-${item.type}-${index}`}>
                                    <div className="audit-head">
                                        <span>{item.type}</span>
                                        <span>{formatDateTime(item.createdAt)}</span>
                                    </div>
                                    <div>
                                        <strong>Actor:</strong> {item.actor || 'system'}
                                    </div>
                                    <div style={{ marginTop: 4 }}>{item.details || '—'}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Window>

                <Window title="Reports :: summary" span="span-4">
                    {reportError ? (
                        <div className="notice">{reportError}</div>
                    ) : !report ? (
                        <div className="notice">Сводка пока не загружена.</div>
                    ) : (
                        <>
                            <div className="kv-list">
                                <div className="kv-key">Total documents</div>
                                <div className="kv-value">{formatNumber(report.totalDocuments)}</div>

                                <div className="kv-key">In approval</div>
                                <div className="kv-value">{formatNumber(report.inApprovalCount)}</div>

                                <div className="kv-key">Approved</div>
                                <div className="kv-value">{formatNumber(report.approvedCount)}</div>

                                <div className="kv-key">Rejected</div>
                                <div className="kv-value">{formatNumber(report.rejectedCount)}</div>

                                <div className="kv-key">Rework count</div>
                                <div className="kv-value">{formatNumber(report.reworkCount)}</div>

                                <div className="kv-key">Pending steps</div>
                                <div className="kv-value">{formatNumber(report.pendingStepCount)}</div>
                            </div>

                            <div className="panel" style={{ marginTop: 10 }}>
                                <div className="field-label" style={{ marginBottom: 8 }}>
                                    By status
                                </div>
                                <ul className="simple-list">
                                    {Object.entries(report.byStatus).map(([key, value]) => (
                                        <li key={key}>
                                            <span className={`badge ${statusClass(key)}`}>{key}</span> — {formatNumber(value)}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="panel" style={{ marginTop: 10 }}>
                                <div className="field-label" style={{ marginBottom: 8 }}>
                                    By type
                                </div>
                                <ul className="simple-list">
                                    {Object.entries(report.byType).map(([key, value]) => (
                                        <li key={key}>
                                            {key} — {formatNumber(value)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </Window>

                <Window title="Scenario tips :: manual verification" span="span-4">
                    <div className="desktop-note">
                        <ol>
                            <li>Сотрудник создаёт документ, открывает карточку и проверяет первую версию.</li>
                            <li>Документ отправляется на согласование только из DRAFT/REWORK.</li>
                            <li>Согласующий работает через окно approvals.</li>
                            <li>Возврат на доработку возвращает документ в редактируемое состояние.</li>
                            <li>После повторной отправки согласующий завершает цикл approve/reject.</li>
                            <li>Аудит и отчётность должны отражать переходы без ручных действий.</li>
                        </ol>
                    </div>

                    <div className="panel" style={{ marginTop: 12 }}>
                        <div className="field-label">Current selection</div>
                        <div className="muted" style={{ marginTop: 6 }}>
                            {selectedSummary
                                ? `${selectedSummary.registrationNumber} · ${selectedSummary.title} · ${selectedSummary.status}`
                                : 'Документ не выбран.'}
                        </div>
                    </div>
                </Window>

                {isAdmin ? (
                    <Window title="Administrator :: document types and users" span="span-8">
                        <div className="form-grid">
                            <label className="form-field">
                                <span className="field-label">Type code</span>
                                <input
                                    className="xp-input"
                                    value={typeForm.code}
                                    onChange={(event) =>
                                        setTypeForm((current) => ({
                                            ...current,
                                            code: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="form-field">
                                <span className="field-label">Type name</span>
                                <input
                                    className="xp-input"
                                    value={typeForm.name}
                                    onChange={(event) =>
                                        setTypeForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="form-field">
                                <span className="field-label">Active</span>
                                <select
                                    className="xp-select"
                                    value={typeForm.active ? 'true' : 'false'}
                                    onChange={(event) =>
                                        setTypeForm((current) => ({
                                            ...current,
                                            active: event.target.value === 'true',
                                        }))
                                    }
                                >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            </label>
                        </div>

                        <div className="toolbar" style={{ marginTop: 12 }}>
                            <button type="button" className="xp-button primary" onClick={() => void createType()} disabled={busy}>
                                Create type
                            </button>
                        </div>

                        {documentTypesError ? <div className="notice">{documentTypesError}</div> : null}
                        {usersError ? <div className="notice">{usersError}</div> : null}

                        <div className="panel" style={{ marginTop: 10 }}>
                            <div className="field-label" style={{ marginBottom: 8 }}>
                                Document types
                            </div>
                            <table className="doc-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Active</th>
                                </tr>
                                </thead>
                                <tbody>
                                {documentTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="muted">
                                            Типы документов пока не загружены.
                                        </td>
                                    </tr>
                                ) : (
                                    documentTypes.map((item) => (
                                        <tr key={item.id}>
                                            <td className="mono">{item.id}</td>
                                            <td className="mono">{item.code}</td>
                                            <td>{item.name}</td>
                                            <td>{String(item.active)}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="panel" style={{ marginTop: 10 }}>
                            <div className="field-label" style={{ marginBottom: 8 }}>
                                Users
                            </div>
                            <table className="doc-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Full name</th>
                                    <th>Active</th>
                                    <th>Roles</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="muted">
                                            Пользователи пока не загружены.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((item) => (
                                        <tr key={item.id}>
                                            <td className="mono">{item.id}</td>
                                            <td className="mono">{item.username}</td>
                                            <td>{item.fullName}</td>
                                            <td>{String(item.active)}</td>
                                            <td>{item.roles.map(roleLabel).join(', ')}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </Window>
                ) : null}
            </main>

            <div className="statusbar">
                <span className="status-pill">{busy ? 'Busy' : 'Ready'}</span>
                <span>{statusLine}</span>
                <span className="taskbar-spacer" />
                <span className="footer-note">Docu MVP · manual backend demo shell</span>
            </div>
        </div>
    );
}