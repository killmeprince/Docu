import { useEffect, useState } from 'react';
import { getReportSummary } from '../api/reports';
import { useAuth } from '../contexts/AuthContext';
import type { ReportResponse } from '../types/api';
import { WindowCard } from '../components/layout/WindowCard';
import { ReportSummary } from '../components/reports/ReportSummary';
import { EmptyState } from '../components/ui/EmptyState';

export function ReportsPage(): JSX.Element {
  const { session } = useAuth();
  const [report, setReport] = useState<ReportResponse | null>(null);

  useEffect(() => {
    if (!session) return;
    void getReportSummary(session.token).then(setReport);
  }, [session]);

  return (
    <div className="page-grid">
      <WindowCard title="Отчётность по документообороту" subtitle="Аналитический слой поверх операционных данных.">
        {report ? (
          <ReportSummary report={report} />
        ) : (
          <EmptyState title="Сводка загружается" description="После загрузки появятся ключевые показатели процесса и распределения по статусам." />
        )}
      </WindowCard>
    </div>
  );
}
