import type { DocumentsFilter } from '../../types/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function DocumentFilters({
  value,
  onChange,
  onSubmit,
}: {
  value: DocumentsFilter;
  onChange: (next: DocumentsFilter) => void;
  onSubmit: () => void;
}): JSX.Element {
  return (
    <div className="filters-grid">
      <Input
        label="Регистрационный номер"
        value={value.registrationNumber || ''}
        onChange={(event) => onChange({ ...value, registrationNumber: event.target.value })}
      />
      <Input
        label="Статус"
        value={value.status || ''}
        onChange={(event) => onChange({ ...value, status: event.target.value })}
        placeholder="DRAFT / IN_APPROVAL / REWORK"
      />
      <Input
        label="Тип документа"
        value={value.typeId || ''}
        onChange={(event) => onChange({ ...value, typeId: event.target.value })}
      />
      <Input
        label="Автор"
        value={value.author || ''}
        onChange={(event) => onChange({ ...value, author: event.target.value })}
      />
      <div className="filters-actions">
        <Button onClick={onSubmit}>Применить фильтры</Button>
      </div>
    </div>
  );
}
