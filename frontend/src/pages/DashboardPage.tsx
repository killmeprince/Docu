import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {getDocuments} from '../api/documents';
import {getReportSummary} from '../api/reports';
import {WindowCard} from '../components/layout/WindowCard';
import {StatCard} from '../components/ui/StatCard';
import {EmptyState} from '../components/ui/EmptyState';
import {useAuth} from '../contexts/AuthContext';
import type {DocumentResponse, ReportResponse} from '../types/api';
import {formatDateTime} from '../lib/format';

export function DashboardPage(): JSX.Element {
    const {session} = useAuth();
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [reportLocked, setReportLocked] = useState(false);

    useEffect(() => {
        if (!session) return;

        void getDocuments(session.token).then(setDocuments);
        void getReportSummary(session.token)
            .then((data) => {
                setReport(data);
                setReportLocked(false);
            })
            .catch(() => {
                setReport(null);
                setReportLocked(true);
            });
    }, [session]);

    const drafts = documents.filter((item) => item.status === 'DRAFT' || item.status === 'REWORK').length;
    const inApproval = documents.filter((item) => item.status === 'IN_APPROVAL').length;
    const approved = documents.filter((item) => item.status === 'APPROVED').length;
    const recent = documents.slice(0, 5);
    const canApprove = session?.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_APPROVER') ?? false;

    return (
        <div className="page-grid">
            <WindowCard title="Обзор">
                <div className="stats-grid">
                    <StatCard title="Черновики" value={drafts} tone="accent"/>
                    <StatCard title="Согласование" value={inApproval}/>
                    <StatCard title="Согласовано" value={approved} tone="success"/>
                    <StatCard title="Всего" value={documents.length}/>
                </div>
            </WindowCard>

            <WindowCard title="Быстрые действия">
                <div className="quick-links">
                    <Link className="quick-link" to="/документы/новый">
                        Новый документ
                    </Link>
                    <Link className="quick-link" to="/документы">
                        Документы
                    </Link>
                    {canApprove ? (
                        <Link className="quick-link" to="/согласование">
                            Согласование
                        </Link>
                    ) : null}
                    {!reportLocked ? (
                        <Link className="quick-link" to="/отчётность">
                            Отчётность
                        </Link>
                    ) : null}
                </div>
            </WindowCard>

            <WindowCard title="Последние документы">
                {!recent.length ? (
                    <EmptyState title="Пусто" description="Документы пока не созданы."/>
                ) : (
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
                )}
            </WindowCard>

            <WindowCard title="Сводка">
                {reportLocked ? (
                    <EmptyState title="Недоступно" description="Для этой роли сводка закрыта."/>
                ) : report ? (
                    <div className="stats-grid narrow">
                        <StatCard title="Доработка" value={report.reworkCount}/>
                        <StatCard title="Шаги" value={report.pendingStepCount}/>
                        <StatCard title="Отклонено" value={report.rejectedCount} tone="danger"/>
                        <StatCard title="Документы" value={report.totalDocuments}/>
                    </div>
                ) : (
                    <EmptyState title="Загрузка" description="Сводка формируется."/>
                )}
            </WindowCard>
        </div>
    );
}