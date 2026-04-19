import { Link } from 'react-router-dom';
import type { DocumentResponse } from '../../types/api';
import { formatDateTime } from '../../lib/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function DocumentTable({
  documents,
  onSend,
}: {
  documents: DocumentResponse[];
  onSend: (documentId: number) => void;
}): JSX.Element {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Рег. номер</th>
            <th>Тип</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Автор</th>
            <th>Обновлён</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {documents.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td className="mono">{item.registrationNumber}</td>
              <td>{item.type || item.typeCode}</td>
              <td>{item.title}</td>
              <td><Badge value={item.status} /></td>
              <td>{item.author || item.authorUsername}</td>
              <td>{formatDateTime(item.updatedAt)}</td>
              <td>
                <div className="table-actions">
                  <Link className="inline-link" to={`/документы/${item.id}`}>
                    Открыть
                  </Link>
                  {item.editable ? <Link className="inline-link" to={`/документы/${item.id}/редактировать`}>Редактировать</Link> : null}
                  {(item.status === 'DRAFT' || item.status === 'REWORK') ? (
                    <Button variant="secondary" onClick={() => onSend(item.id)}>
                      На согласование
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
