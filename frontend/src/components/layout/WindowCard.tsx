import type { PropsWithChildren, ReactNode } from 'react';

type WindowCardProps = PropsWithChildren<{
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}>;

export function WindowCard({
                               title,
                               subtitle,
                               actions,
                               className,
                               children,
                           }: WindowCardProps): JSX.Element {
    return (
        <section className={`window-card ${className || ''}`.trim()}>
            {(title || actions) ? (
                <header className="window-card-header">
                    <div className="window-card-headings">
                        {title ? <div className="window-card-title">{title}</div> : null}
                        {subtitle ? <div className="window-card-subtitle">{subtitle}</div> : null}
                    </div>
                    {actions ? <div className="window-card-actions">{actions}</div> : null}
                </header>
            ) : null}
            <div className="window-card-body">{children}</div>
        </section>
    );
}