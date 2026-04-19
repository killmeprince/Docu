import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
};

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps): JSX.Element {
  return (
    <button {...props} className={`btn btn-${variant} ${className || ''}`.trim()}>
      {children}
    </button>
  );
}
