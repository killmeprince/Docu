import { useEffect, useState } from 'react';
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
import type { ApprovalStepResponse, AuditEventResponse, DocumentDetailsResponse, FileAttachmentResponse } from '../types/api';
import { formatDateTime } from '../lib/format';
import { Button } from '../components/ui/Button';

export function DocumentDetailsPage(): JSX.Element {
  const { session } = useAuth();
  const params = useParams();
  const documentId = Number(params.documentId || 0);
  const [details, setDetails] = useState<DocumentDetailsResponse | null>(null);
  const [steps, setSteps] = useState<ApprovalStepResponse[]>([]);
  const [audit, setAudit] = useState<AuditEventResponse[]>([]);

  async function load(): Promise<void> {
    if (!session || !documentId) return;
    const [documentDetails, documentAudit] = await Promise.all([
      getDocument(session.token, documentId),
      getDocumentAudit(session.token, documentId),
    ]);
    setDetails(documentDetails);
    setAudit(documentAudit);
    if (documentDetails.status === 'IN_APPROVAL') {
      setSteps(await getApprovalSteps(session.token, documentId));
    } else {
      setSteps([]);
    }
  }

  async function downloadAttachment(attachment: FileAttachmentResponse): Promise<void> {
    if (!session) return;
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

  if (!details) {
    return <EmptyState title="Карточка загружается" description="Через секунду здесь появятся реквизиты, версии и маршрут документа." />;
  }

  return (
    <div className="page-grid details-grid">
      <WindowCard title={`Карточка документа #${details.id}`} subtitle="Единое окно судьбы документа: реквизиты, версии, маршрут и аудит.">
        <div className="meta-grid">
          <div className="meta-row"><span>Регистрационный номер</span><strong className="mono">{details.registrationNumber}</strong></div>
          <div className="meta-row"><span>Тип</span><strong>{details.type}</strong></div>
          <div className="meta-row"><span>Автор</span><strong>{details.author || details.authorUsername}</strong></div>
          <div className="meta-row"><span>Статус</span><Badge value={details.status} /></div>
          <div className="meta-row"><span>Дата регистрации</span><strong>{formatDateTime(details.registrationDate)}</strong></div>
          <div className="meta-row"><span>Последнее обновление</span><strong>{formatDateTime(details.updatedAt)}</strong></div>
        </div>
        <div className="document-description">{details.description || 'Описание документа не заполнено.'}</div>
        <div className="toolbar-row">
          {details.editable ? <Link className="inline-link" to={`/документы/${details.id}/редактировать`}>Редактировать</Link> : null}
          {(details.status === 'DRAFT' || details.status === 'REWORK') ? (
            <Button onClick={() => session ? void sendDocumentToApproval(session.token, details.id).then(load) : undefined}>
              Отправить на согласование
            </Button>
          ) : null}
        </div>
      </WindowCard>

      <WindowCard title="Интерактивная карта маршрута" subtitle="Киллер-фича: жизненный цикл документа как живая, но полезная карта процесса.">
        <DocumentFlowMap details={details} steps={steps} audit={audit} />
      </WindowCard>

      <WindowCard title="История версий" subtitle="Версии показывают, что именно менялось и какие вложения были актуальны.">
        <DocumentVersions versions={details.versions} onDownload={downloadAttachment} />
      </WindowCard>

      <WindowCard title="Аудит и прослеживаемость" subtitle="Кто, что и когда сделал с документом.">
        {!audit.length ? (
          <EmptyState title="Аудит пока пуст" description="После действий над документом здесь появятся события жизненного цикла." />
        ) : (
          <div className="list-stack">
            {audit.map((item, index) => (
              <article key={`${item.createdAt}-${item.type}-${index}`} className="line-card line-card-column">
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
      </WindowCard>
    </div>
  );
}
