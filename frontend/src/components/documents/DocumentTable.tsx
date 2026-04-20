import {Link} from 'react-router-dom';
import type {DocumentResponse} from '../../types/api';
import {formatDateTime} from '../../lib/format';
import {Badge} from '../ui/Badge';
import {Button} from '../ui/Button';

function valueOrDash(value?: string | null): string {
    const normalized = value?.trim();
    return normalized ? normalized : '—';
}

export function DocumentTable({
                                  documents,
                                  onSend,
                              }: {
    documents: DocumentResponse[];
    onSend: (documentId: number) => void;
}): JSX.Element {
    return (
        <div className="table-wrap documents-table-wrap">
            <table className="doc-table documents-table">
                <colgroup>
                    <col className="documents-col-registration"/>
                    <col className="documents-col-type"/>
                    <col className="documents-col-title"/>
                    <col className="documents-col-status"/>
                    <col className="documents-col-author"/>
                    <col className="documents-col-updated"/>
                    <col className="documents-col-actions"/>
                </colgroup>

                <thead>
                <tr>
                    <th>Рег. номер</th>
                    <th>Тип</th>
                    <th>Название</th>
                    <th>Статус</th>
                    <th>Автор</th>
                    <th>Обновлён</th>
                    <th>Действия</th>
                </tr>
                </thead>

                <tbody>
                {documents.map((item) => {
                    const registrationNumber = valueOrDash(item.registrationNumber);
                    const type = valueOrDash(item.type || item.typeCode);
                    const title = valueOrDash(item.title);
                    const author = valueOrDash(item.author || item.authorUsername);

                    return (
                        <tr key={item.id} className="documents-table-row">
                            <td className="documents-cell documents-cell-registration">
                                <span className="document-registration-pill" title={registrationNumber}>
                                    {registrationNumber}
                                </span>
                            </td>

                            <td className="documents-cell documents-cell-type" title={type}>
                                <div className="document-type-text">{type}</div>
                            </td>

                            <td className="documents-cell documents-cell-title" title={title}>
                                <div className="document-title">{title}</div>
                            </td>

                            <td className="documents-cell documents-cell-status">
                                <Badge value={item.status}/>
                            </td>

                            <td className="documents-cell documents-cell-author" title={author}>
                                <div className="document-author">{author}</div>
                            </td>

                            <td className="documents-cell documents-cell-updated">
                                <span className="document-updated">
                                    {formatDateTime(item.updatedAt)}
                                </span>
                            </td>

                            <td className="documents-cell documents-cell-actions">
                                <div className="document-actions">
                                    <Link
                                        className="document-action-link document-action-link-open"
                                        to={`/документы/${item.id}`}
                                    >
                                        Открыть
                                    </Link>

                                    {item.editable ? (
                                        <Link
                                            className="document-action-link document-action-link-edit"
                                            to={`/документы/${item.id}/редактировать`}
                                        >
                                            Редактировать
                                        </Link>
                                    ) : null}

                                    {(item.status === 'DRAFT' || item.status === 'REWORK') ? (
                                        <Button
                                            variant="success"
                                            className="document-action-button document-action-send"
                                            onClick={() => onSend(item.id)}
                                        >
                                            На согласование
                                        </Button>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}