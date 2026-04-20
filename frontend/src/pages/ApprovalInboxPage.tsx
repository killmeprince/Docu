import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDocuments, getDocument, getApprovalSteps } from '../api/documents';
import { decideApprovalStep } from '../api/approvals';

import { ApprovalActionPanel } from '../components/approvals/ApprovalActionPanel';
import { WindowCard } from '../components/layout/WindowCard';
import { EmptyState } from '../components/ui/EmptyState';
import type { ApprovalStepResponse, DocumentDetailsResponse, DocumentResponse } from '../types/api';
import { Badge } from '../components/ui/Badge';

export function ApprovalInboxPage(): JSX.Element {
  const { session } = useAuth();
  const [items, setItems] = useState<DocumentResponse[]>([]);
  const [selected, setSelected] = useState<DocumentDetailsResponse | null>(null);
  const [steps, setSteps] = useState<ApprovalStepResponse[]>([]);
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    if (!session) return;
    const data = await getDocuments(session.token, { status: 'IN_APPROVAL' });
    setItems(data);
    if (data[0]) {
      const details = await getDocument(session.token, data[0].id);
      setSelected(details);
      setSteps(await getApprovalSteps(session.token, data[0].id));
    } else {
      setSelected(null);
      setSteps([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function openDocument(documentId: number): Promise<void> {
    if (!session) return;
    const details = await getDocument(session.token, documentId);
    setSelected(details);
    setSteps(await getApprovalSteps(session.token, documentId));
  }

  async function handleDecision(stepId: number, decision: 'APPROVE' | 'REWORK' | 'REJECT', comment: string): Promise<void> {
    if (!session) return;
    setBusy(true);
    try {
      await decideApprovalStep(session.token, stepId, { decision, comment });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-grid approvals-grid">
      <WindowCard title="Согласование" className="approval-inbox-card">
        {!items.length ? (
            <EmptyState title="Пусто" description="Документов на согласовании нет." />
        ) : (
          <div className="list-stack">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`line-card line-card-button ${selected?.id === item.id ? 'line-card-selected' : ''}`.trim()}
                    onClick={() => void openDocument(item.id)}
                >
                  <div className="line-card-head">
                    <div>
                      <div className="line-card-title">{item.title}</div>
                      <div
                          className="line-card-meta">{item.registrationNumber} · {item.author || item.authorUsername}</div>
                    </div>
                    <Badge value={item.status}/>
                  </div>
                </button>
            ))}
          </div>
        )}
      </WindowCard>

      <WindowCard title="Рассмотрение" className="approval-review-card">
        {!selected ? (
            <EmptyState title="Не выбрано" description="Выберите документ слева." />
        ) : (
          <>
            <div className="meta-grid slim">
              <div className="meta-row"><span>Название</span><strong>{selected.title}</strong></div>
              <div className="meta-row"><span>Рег. номер</span><strong className="mono">{selected.registrationNumber}</strong></div>
              <div className="meta-row"><span>Автор</span><strong>{selected.author || selected.authorUsername}</strong></div>
              <div className="meta-row"><span>Статус</span><Badge value={selected.status} /></div>
            </div>
            <div className="document-description">{selected.description || 'Описание не заполнено.'}</div>
            <ApprovalActionPanel steps={steps} onDecide={handleDecision} busy={busy} />
          </>
        )}
      </WindowCard>
    </div>
  );
}
