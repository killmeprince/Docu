import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDocument, getApprovalSteps, sendDocumentToApproval } from '../api/documents';
import { getDocumentAudit } from '../api/audit';
import { requestBlob } from '../api/client';
import { WindowCard } from '../components/layout/WindowCard';
import { Badge } from '../components/ui/Badge';
import { DocumentVersions } from '../components/documents/DocumentVersions';
import { DocumentFlowMap } from '../components/documents/DocumentFlowMap';
import { EmptyState } from '../components/ui/EmptyState';
import type {
    ApprovalStepResponse,
    AuditEventResponse,
    DocumentDetailsResponse,
    FileAttachmentResponse,
} from '../types/api';
import { formatDateTime } from '../lib/format';
import { Button } from '../components/ui/Button';

type DetailsPanelKey = 'versions' | 'actions' | 'card';

const PANEL_META: Array<{ key: DetailsPanelKey; label: string }> = [
    { key: 'versions', label: 'История версий' },
    { key: 'actions', label: 'Действия' },
    { key: 'card', label: 'Карточка документа' },
];

export function DocumentDetailsPage(): JSX.Element {
    const { session } = useAuth();
    const params = useParams();

    const documentId = Number(params.documentId || 0);

    const [details, setDetails] = useState<DocumentDetailsResponse | null>(null);
    const [steps, setSteps] = useState<ApprovalStepResponse[]>([]);
    const [audit, setAudit] = useState<AuditEventResponse[]>([]);
    const [activePanel, setActivePanel] = useState<DetailsPanelKey>('versions');
    const [actionFilter, setActionFilter] = useState<string>('ALL');

    async function load(): Promise<void> {
        if (!session || !documentId) {
            return;
        }

        const [documentDetails, documentAudit] = await Promise.all([
            getDocument(session.token, documentId),
            getDocumentAudit(session.token, documentId),
        ]);

        setDetails(documentDetails);
        setAudit(documentAudit);

        if (documentDetails.status === 'IN_APPROVAL') {
            setSteps(await getApprovalSteps(session.token, documentId));
            return;
        }

        setSteps([]);
    }

    async function downloadAttachment(attachment: FileAttachmentResponse): Promise<void> {
        if (!session) {
            return;
        }

        const blob = await requestBlob(attachment.downloadUrl, session.token);
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.originalName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, documentId]);

    const availableActionTypes = useMemo(
        () => ['ALL', ...Array.from(new Set(audit.map((item) => item.type)))],
        [audit],
    );

    const filteredAudit = useMemo(() => {
        if (actionFilter === 'ALL') {
            return audit;
        }

        return audit.filter((item) => item.type === actionFilter);
    }, [audit, actionFilter]);

    useEffect(() => {
        if (actionFilter === 'ALL') {
            return;
        }

        if (!availableActionTypes.includes(actionFilter)) {
            setActionFilter('ALL');
        }
    }, [actionFilter, availableActionTypes]);

    if (!details) {
        return (
            <EmptyState
                title="Карточка загружается"
                description="Через секунду здесь появятся реквизиты, версии и маршрут документа."
            />
        );
    }

    const documentDetails = details;

    const currentPanelMeta = PANEL_META.find((panel) => panel.key === activePanel) ?? PANEL_META[0];
    const activeTabId = `document-details-tab-${activePanel}`;
    const activePanelId = `document-details-panel-${activePanel}`;

    function renderVersionsPanel(): JSX.Element {
        return (
            <DocumentVersions
                versions={documentDetails.versions}
                onDownload={downloadAttachment}
            />
        );
    }

    function renderActionsPanel(): JSX.Element {
        if (!audit.length) {
            return (
                <EmptyState
                    title="Действий пока нет"
                    description="После операций с документом здесь появится журнал событий."
                />
            );
        }

        return (
            <>
                <div className="action-filter-row" aria-label="Фильтр действий">
                    {availableActionTypes.map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={`action-filter-chip ${actionFilter === type ? 'action-filter-chip-active' : ''}`}
                            onClick={() => setActionFilter(type)}
                        >
                            {type === 'ALL' ? 'Все действия' : type}
                        </button>
                    ))}
                </div>

                {!filteredAudit.length ? (
                    <EmptyState
                        title="По текущему фильтру действий нет"
                        description="Выберите другой тип события или переключитесь на «Все действия»."
                    />
                ) : (
                    <div className="list-stack">
                        {filteredAudit.map((item, index) => (
                            <article
                                key={`${item.createdAt}-${item.type}-${index}`}
                                className="line-card line-card-column"
                            >
                                <div className="line-card-head">
                                    <div className="line-card-title">{item.type}</div>
                                    <div className="line-card-meta">{formatDateTime(item.createdAt)}</div>
                                </div>
                                <div className="line-card-meta">Инициатор: {item.actor || 'system'}</div>
                                <div className="line-card-copy">{item.details || 'Без деталей.'}</div>
                            </article>
                        ))}
                    </div>
                )}
            </>
        );
    }

    function renderCardPanel(): JSX.Element {
        return (
            <>
                <div className="meta-grid">
                    <div className="meta-row">
                        <span>Регистрационный номер</span>
                        <strong className="mono">{documentDetails.registrationNumber}</strong>
                    </div>
                    <div className="meta-row">
                        <span>Тип</span>
                        <strong>{documentDetails.type}</strong>
                    </div>
                    <div className="meta-row">
                        <span>Автор</span>
                        <strong>{documentDetails.author || documentDetails.authorUsername}</strong>
                    </div>
                    <div className="meta-row">
                        <span>Статус</span>
                        <Badge value={documentDetails.status} />
                    </div>
                    <div className="meta-row">
                        <span>Дата регистрации</span>
                        <strong>{formatDateTime(documentDetails.registrationDate)}</strong>
                    </div>
                    <div className="meta-row">
                        <span>Последнее обновление</span>
                        <strong>{formatDateTime(documentDetails.updatedAt)}</strong>
                    </div>
                </div>

                <div className="document-description">
                    {documentDetails.description || 'Описание документа не заполнено.'}
                </div>

                <div className="toolbar-row">
                    {documentDetails.editable ? (
                        <Link className="inline-link" to={`/документы/${documentDetails.id}/редактировать`}>
                            Редактировать
                        </Link>
                    ) : null}

                    {(documentDetails.status === 'DRAFT' || documentDetails.status === 'REWORK') ? (
                        <Button
                            onClick={() => (
                                session
                                    ? void sendDocumentToApproval(session.token, documentDetails.id).then(load)
                                    : undefined
                            )}
                        >
                            Отправить на согласование
                        </Button>
                    ) : null}
                </div>
            </>
        );
    }

    function renderActivePanel(): JSX.Element {
        if (activePanel === 'versions') {
            return renderVersionsPanel();
        }

        if (activePanel === 'actions') {
            return renderActionsPanel();
        }

        return renderCardPanel();
    }

    return (
        <div className="page-grid details-grid details-layout">
            <WindowCard>
                <DocumentFlowMap details={documentDetails} steps={steps} audit={audit} />
            </WindowCard>

            <WindowCard>
                <div className="details-tabs" role="tablist" aria-label="Разделы документа">
                    {PANEL_META.map((panel) => {
                        const isActive = panel.key === activePanel;
                        const tabId = `document-details-tab-${panel.key}`;
                        const panelId = `document-details-panel-${panel.key}`;

                        const label = panel.key === 'card'
                            ? `${panel.label} #${documentDetails.id}`
                            : panel.label;

                        return (
                            <button
                                key={panel.key}
                                id={tabId}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={panelId}
                                className={`details-tab ${isActive ? 'details-tab-active' : ''}`}
                                onClick={() => setActivePanel(panel.key)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <section
                    key={activePanel}
                    id={activePanelId}
                    role="tabpanel"
                    aria-labelledby={activeTabId}
                    className="details-active-panel"
                    aria-label={currentPanelMeta.label}
                >
                    {renderActivePanel()}
                </section>
            </WindowCard>
        </div>
    );
}