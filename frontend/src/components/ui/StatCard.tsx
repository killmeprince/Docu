import { formatNumber } from '../../lib/format';

export function StatCard({ title, value, tone = 'neutral' }: { title: string; value: number; tone?: 'neutral' | 'accent' | 'success' | 'danger' }): JSX.Element {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{formatNumber(value)}</div>
    </article>
  );
}
