import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, className, ...props }: InputProps): JSX.Element {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <input {...props} className={`input ${className || ''}`.trim()} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
