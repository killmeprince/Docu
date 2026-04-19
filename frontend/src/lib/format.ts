export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ROLE_EMPLOYEE':
      return 'Сотрудник';
    case 'ROLE_APPROVER':
      return 'Согласующий';
    case 'ROLE_ADMIN':
      return 'Администратор';
    default:
      return role;
  }
}

export function fileSizeLabel(sizeBytes: number): string {
  if (!sizeBytes) return '0 Б';
  if (sizeBytes < 1024) return `${sizeBytes} Б`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} КБ`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Черновик',
    IN_APPROVAL: 'На согласовании',
    REWORK: 'На доработке',
    APPROVED: 'Согласован',
    REJECTED: 'Отклонён',
    ARCHIVED: 'Архивный',
    PENDING: 'Ожидает решения',
    REWORKED: 'Возвращён на доработку',
  };
  return map[status] || status;
}
