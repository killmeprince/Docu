import type {DocumentsFilter} from '../../types/api';
import {statusLabel} from '../../lib/format';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';

const statusOptions = ['DRAFT', 'IN_APPROVAL', 'REWORK', 'APPROVED', 'REJECTED'] as const;

export function DocumentFilters({
                                    value,
                                    onChange,
                                    open,
                                    onToggle,
                                }: {
    value: DocumentsFilter;
    onChange: (next: DocumentsFilter) => void;
    open: boolean;
    onToggle: () => void;
}): JSX.Element {
    const selectedStatus = value.status || '';

    return (
        <div className="documents-search">
            <div className="documents-search-bar">
                <Input
                    value={value.registrationNumber || ''}
                    onChange={(event) => onChange({...value, registrationNumber: event.target.value})}
                    placeholder="Поиск документов по регистрационному номеру"
                    aria-label="Поиск документов"
                />

                <button
                    type="button"
                    className={`search-toggle-btn ${open ? 'search-toggle-btn-open' : ''}`}
                    onClick={onToggle}
                    aria-label={open ? 'Скрыть расширенный поиск' : 'Показать расширенный поиск'}
                    title="Поиск"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="search-toggle-icon">
                        <path
                            d="M10.5 4a6.5 6.5 0 1 0 4.06 11.58l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9Z"/>
                    </svg>
                </button>
            </div>

            {open ? (
                <div className="search-panel">
                    <div className="status-picker-head">
                        <span className="status-picker-label">Статус документа</span>
                    </div>

                    <div className="status-picker" role="group" aria-label="Фильтр по статусу">
                        {statusOptions.map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`status-pill status-pill-${status.toLowerCase()} ${selectedStatus === status ? 'status-pill-active' : ''}`}
                                onClick={() => onChange({
                                    ...value,
                                    status: selectedStatus === status ? undefined : status,
                                })}
                            >
                                {statusLabel(status)}
                            </button>
                        ))}
                    </div>

                    <div className="search-panel-grid">
                        <Input
                            value={value.typeId || ''}
                            onChange={(event) => onChange({...value, typeId: event.target.value})}
                            placeholder="Тип документа"
                            aria-label="Тип документа"
                        />

                        <Input
                            value={value.author || ''}
                            onChange={(event) => onChange({...value, author: event.target.value})}
                            placeholder="Автор"
                            aria-label="Автор"
                        />
                    </div>

                    <div className="search-panel-actions">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => onChange({})}
                        >
                            Очистить фильтры
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}