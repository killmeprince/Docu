import type { ReportResponse } from '../../types/api';
import { formatNumber, statusLabel } from '../../lib/format';
import { StatCard } from '../ui/StatCard';

export function ReportSummary({ report }: { report: ReportResponse }): JSX.Element {
  return (
    <div className="report-grid">
      <div className="stats-grid">
        <StatCard title="Всего документов" value={report.totalDocuments} tone="accent" />
        <StatCard title="На согласовании" value={report.inApprovalCount} />
        <StatCard title="Согласовано" value={report.approvedCount} tone="success" />
        <StatCard title="Отклонено" value={report.rejectedCount} tone="danger" />
        <StatCard title="Возвраты на доработку" value={report.reworkCount} />
        <StatCard title="Ожидающих шагов" value={report.pendingStepCount} />
      </div>

      <div className="window-card-body split-panels">
        <div className="subpanel">
          <div className="subpanel-title">Распределение по статусам</div>
          <div className="list-stack compact">
            {Object.entries(report.byStatus).map(([key, value]) => (
              <div key={key} className="line-card">
                <span>{statusLabel(key)}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="subpanel">
          <div className="subpanel-title">Распределение по типам</div>
          <div className="list-stack compact">
            {Object.entries(report.byType).map(([key, value]) => (
              <div key={key} className="line-card">
                <span>{key}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
