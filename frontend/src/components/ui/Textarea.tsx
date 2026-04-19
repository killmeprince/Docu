import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export function Textarea({ label, hint, className, ...props }: TextareaProps): JSX.Element {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <textarea {...props} className={`input textarea ${className || ''}`.trim()} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
