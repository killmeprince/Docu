import {statusLabel} from '../../lib/format';

export function Badge({value}: { value: string }): JSX.Element {
  return (
      <span className={`badge badge-${value.toLowerCase()}`}>
            <span className="badge-dot" aria-hidden="true"/>
            <span className="badge-label">{statusLabel(value)}</span>
        </span>
  );
}