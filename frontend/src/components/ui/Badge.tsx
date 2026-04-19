import { statusLabel } from '../../lib/format';

export function Badge({ value }: { value: string }): JSX.Element {
  return <span className={`badge badge-${value.toLowerCase()}`}>{statusLabel(value)}</span>;
}
