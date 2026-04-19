import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDocuments, getDocument, getApprovalSteps } from '../api/documents';
import { decideApprovalStep } from '../api/approvals';
import { ApprovalQueue } from '../components/approvals/ApprovalQueue';
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
      <WindowCard title="Входящие на согласование" subtitle="Рабочий inbox согласующего. Решение принимается без лишних переходов.">
        {!items.length ? (
          <EmptyState title="На согласовании ничего нет" description="Когда инициатор отправит документ, он появится в этом списке." />
        ) : (
          <div className="list-stack">
            {items.map((item) => (
              <button key={item.id} type="button" className="line-card line-card-button" onClick={() => void openDocument(item.id)}>
                <div className="line-card-head">
                  <div>
                    <div className="line-card-title">{item.title}</div>
                    <div className="line-card-meta">{item.registrationNumber} · {item.author || item.authorUsername}</div>
                  </div>
                  <Badge value={item.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </WindowCard>

      <WindowCard title="Область рассмотрения" subtitle="Карточка, статус и решение по текущему шагу — на одном экране.">
        {!selected ? (
          <EmptyState title="Документ не выбран" description="Выбери объект из inbox, чтобы принять решение." />
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

      <WindowCard title="Почему этот экран сильный" subtitle="Где именно здесь можно выигрывать у тяжёлых ECM-интерфейсов.">
        <ul className="ordered-list compact-list">
          <li>Согласующий видит контекст и принимает решение в одном рабочем окне.</li>
          <li>Возврат на доработку сопровождается осмысленным комментарием, а не хаотичной перепиской.</li>
          <li>Статус документа и состояние конкретного шага не смешиваются.</li>
          <li>Сценарий review-first быстрее и понятнее, чем прыжки по нескольким формам.</li>
        </ul>
      </WindowCard>
    </div>
  );
}
