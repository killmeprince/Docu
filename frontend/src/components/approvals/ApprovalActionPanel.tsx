import { useState } from 'react';
import type { ApprovalStepResponse } from '../../types/api';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../lib/format';

export function ApprovalActionPanel({
  steps,
  onDecide,
  busy,
}: {
  steps: ApprovalStepResponse[];
  onDecide: (stepId: number, decision: 'APPROVE' | 'REWORK' | 'REJECT', comment: string) => Promise<void>;
  busy: boolean;
}): JSX.Element {
  const [comment, setComment] = useState('');
  const current = steps.find((item) => item.status === 'PENDING') || null;

  return (
    <div className="list-stack">
      {steps.map((item) => (
        <article key={item.id} className="line-card line-card-column">
          <div className="line-card-head">
            <div>
              <div className="line-card-title">Шаг {item.order}</div>
              <div className="line-card-meta">{item.approver}</div>
            </div>
            <Badge value={item.status} />
          </div>
          <div className="line-card-copy">
            Комментарий: {item.comment || 'не указан'} · Решение: {formatDateTime(item.decidedAt)}
          </div>
        </article>
      ))}

      {current ? (
        <div className="approval-actions">
          <Textarea
            label="Комментарий к решению"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Почему согласовано, отклонено или возвращено на доработку"
          />
          <div className="table-actions">
            <Button variant="success" disabled={busy} onClick={() => void onDecide(current.id, 'APPROVE', comment)}>
              Согласовать
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void onDecide(current.id, 'REWORK', comment)}>
              Вернуть на доработку
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void onDecide(current.id, 'REJECT', comment)}>
              Отклонить
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
