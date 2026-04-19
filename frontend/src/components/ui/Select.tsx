import type { PropsWithChildren, SelectHTMLAttributes } from 'react';

type SelectProps = PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>> & {
  label?: string;
  hint?: string;
};

export function Select({ label, hint, children, className, ...props }: SelectProps): JSX.Element {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <select {...props} className={`input ${className || ''}`.trim()}>
        {children}
      </select>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
