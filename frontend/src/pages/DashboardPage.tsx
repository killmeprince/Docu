import {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {getDocuments} from '../api/documents';
import {getReportSummary} from '../api/reports';
import {WindowCard} from '../components/layout/WindowCard';
import {StatCard} from '../components/ui/StatCard';
import {EmptyState} from '../components/ui/EmptyState';
import {useAuth} from '../contexts/AuthContext';
import type {DocumentResponse, ReportResponse} from '../types/api';
import {formatDateTime} from '../lib/format';

type StatTone = 'accent' | 'neutral' | 'success' | 'danger';

type InteractiveStatItem = {
    title: string;
    value: number;
    tone: StatTone;
    className: string;
};

export function DashboardPage(): JSX.Element {
    const {session} = useAuth();

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(false);

    const overviewRef = useRef<HTMLDivElement | null>(null);
    const reportRef = useRef<HTMLDivElement | null>(null);

    const canViewReport =
        session?.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_APPROVER') ?? false;

    useEffect(() => {
        if (!session) {
            setDocuments([]);
            setReport(null);
            setReportLoading(false);
            setReportError(false);
            return;
        }

        let cancelled = false;

        void getDocuments(session.token)
            .then((data) => {
                if (!cancelled) {
                    setDocuments(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDocuments([]);
                }
            });

        if (!canViewReport) {
            setReport(null);
            setReportLoading(false);
            setReportError(false);

            return () => {
                cancelled = true;
            };
        }

        setReportLoading(true);
        setReportError(false);

        void getReportSummary(session.token)
            .then((data) => {
                if (cancelled) {
                    return;
                }

                setReport(data);
                setReportLoading(false);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setReport(null);
                setReportLoading(false);
                setReportError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [canViewReport, session]);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const attachInteractiveGrid = (container: HTMLDivElement | null): (() => void) | undefined => {
            if (!container) {
                return;
            }

            const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-interactive-stat-card]'));
            if (!cards.length) {
                return;
            }

            let frameId: number | null = null;

            const resetCards = () => {
                cards.forEach((card) => {
                    card.style.setProperty('--interactive-rotate-x', '0deg');
                    card.style.setProperty('--interactive-rotate-y', '0deg');
                    card.style.setProperty('--interactive-shift-x', '0px');
                    card.style.setProperty('--interactive-shift-y', '0px');
                });
            };

            const handlePointerMove = (event: PointerEvent) => {
                if (frameId !== null) {
                    cancelAnimationFrame(frameId);
                }

                frameId = requestAnimationFrame(() => {
                    cards.forEach((card) => {
                        const rect = card.getBoundingClientRect();
                        const px = (event.clientX - rect.left) / rect.width;
                        const py = (event.clientY - rect.top) / rect.height;
                        const cx = (px - 0.5) * 2;
                        const cy = (py - 0.5) * 2;
                        const inside = px >= 0 && px <= 1 && py >= 0 && py <= 1;
                        const influence = inside ? 1 : Math.max(0, 1 - Math.hypot(cx, cy));

                        const rotateX = -cy * 7 * influence;
                        const rotateY = cx * 10 * influence;
                        const shiftX = cx * 8 * influence;
                        const shiftY = cy * 5 * influence;

                        card.style.setProperty('--interactive-rotate-x', `${rotateX.toFixed(2)}deg`);
                        card.style.setProperty('--interactive-rotate-y', `${rotateY.toFixed(2)}deg`);
                        card.style.setProperty('--interactive-shift-x', `${shiftX.toFixed(2)}px`);
                        card.style.setProperty('--interactive-shift-y', `${shiftY.toFixed(2)}px`);
                    });
                });
            };

            container.addEventListener('pointermove', handlePointerMove);
            container.addEventListener('pointerleave', resetCards);

            resetCards();

            return () => {
                container.removeEventListener('pointermove', handlePointerMove);
                container.removeEventListener('pointerleave', resetCards);

                if (frameId !== null) {
                    cancelAnimationFrame(frameId);
                }

                resetCards();
            };
        };

        const cleanupOverview = attachInteractiveGrid(overviewRef.current);
        const cleanupReport = attachInteractiveGrid(reportRef.current);

        return () => {
            cleanupOverview?.();
            cleanupReport?.();
        };
    }, [report]);

    const drafts = documents.filter((item) => item.status === 'DRAFT' || item.status === 'REWORK').length;
    const inApproval = documents.filter((item) => item.status === 'IN_APPROVAL').length;
    const approved = documents.filter((item) => item.status === 'APPROVED').length;
    const recent = documents.slice(0, 5);

    const overviewItems = useMemo<InteractiveStatItem[]>(
        () => [
            {title: 'Черновики', value: drafts, tone: 'accent', className: 'overview-card-draft'},
            {title: 'Согласование', value: inApproval, tone: 'neutral', className: 'overview-card-approval'},
            {title: 'Согласовано', value: approved, tone: 'success', className: 'overview-card-approved'},
            {title: 'Всего', value: documents.length, tone: 'neutral', className: 'overview-card-total'}
        ],
        [approved, documents.length, drafts, inApproval]
    );

    const reportItems = useMemo<InteractiveStatItem[]>(
        () =>
            report
                ? [
                    {title: 'Доработка', value: report.reworkCount, tone: 'accent', className: 'report-card-rework'},
                    {title: 'Шаги', value: report.pendingStepCount, tone: 'neutral', className: 'report-card-pending'},
                    {title: 'Отклонено', value: report.rejectedCount, tone: 'danger', className: 'report-card-rejected'},
                    {title: 'Документы', value: report.totalDocuments, tone: 'neutral', className: 'report-card-total'}
                ]
                : [],
        [report]
    );

    return (
        <div className="page-grid">
            <WindowCard title="Обзор">
                <div ref={overviewRef} className="stats-grid interactive-stats-grid">
                    {overviewItems.map((item) => (
                        <div
                            key={item.title}
                            data-interactive-stat-card
                            className={`interactive-stat-card ${item.className}`}
                        >
                            <StatCard title={item.title} value={item.value} tone={item.tone}/>
                        </div>
                    ))}
                </div>
            </WindowCard>

            {recent.length ? (
                <WindowCard title="Последние документы">
                    <div className="list-stack">
                        {recent.map((item) => (
                            <Link key={item.id} to={`/документы/${item.id}`} className="line-card line-card-link">
                                <div>
                                    <div className="line-card-title">{item.title}</div>
                                    <div className="line-card-meta">{item.registrationNumber}</div>
                                </div>
                                <div className="line-card-meta">{formatDateTime(item.updatedAt)}</div>
                            </Link>
                        ))}
                    </div>
                </WindowCard>
            ) : null}

            {canViewReport ? (
                <WindowCard title="Сводка">
                    {report ? (
                        <div ref={reportRef} className="stats-grid narrow interactive-stats-grid">
                            {reportItems.map((item) => (
                                <div
                                    key={item.title}
                                    data-interactive-stat-card
                                    className={`interactive-stat-card ${item.className}`}
                                >
                                    <StatCard title={item.title} value={item.value} tone={item.tone}/>
                                </div>
                            ))}
                        </div>
                    ) : reportLoading ? (
                        <EmptyState title="Загрузка" description="Сводка формируется."/>
                    ) : reportError ? (
                        <EmptyState title="Ошибка" description="Не удалось загрузить сводку."/>
                    ) : null}
                </WindowCard>
            ) : null}
        </div>
    );
}