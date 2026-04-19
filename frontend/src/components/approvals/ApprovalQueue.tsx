import { Link } from 'react-router-dom';
import type { DocumentResponse } from '../../types/api';
import { Badge } from '../ui/Badge';

export function ApprovalQueue({ items }: { items: DocumentResponse[] }): JSX.Element {
  return (
    <div className="list-stack">
      {items.map((item) => (
        <article key={item.id} className="line-card line-card-column">
          <div className="line-card-head">
            <div>
              <div className="line-card-title">{item.title}</div>
              <div className="line-card-meta">
                {item.registrationNumber} · {item.author || item.authorUsername}
              </div>
            </div>
            <Badge value={item.status} />
          </div>
          <div className="line-card-copy">{item.description || 'Описание не заполнено.'}</div>
          <div className="table-actions">
            <Link className="inline-link" to={`/документы/${item.id}`}>
              Открыть карточку
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
