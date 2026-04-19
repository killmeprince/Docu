import type { ApprovalStepResponse, AuditEventResponse, DocumentDetailsResponse } from '../types/api';
import { formatDateTime, statusLabel } from './format';

export type FlowNodeState = 'completed' | 'current' | 'pending' | 'branch';

export type FlowNode = {
  id: string;
  title: string;
  subtitle?: string;
  state: FlowNodeState;
  actor?: string;
  timestamp?: string;
  x: number;
  y: number;
};

export type FlowEdge = {
  from: string;
  to: string;
  kind: 'main' | 'rework' | 'reject';
  active: boolean;
};

export type FlowMapData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

function findAudit(audit: AuditEventResponse[], typeLike: string): AuditEventResponse | undefined {
  return audit.find((item) => item.type.toUpperCase().includes(typeLike));
}

export function buildFlowMap(details: DocumentDetailsResponse, steps: ApprovalStepResponse[], audit: AuditEventResponse[]): FlowMapData {
  const status = details.status;
  const createdAt = details.versions[0]?.createdAt || details.registrationDate;
  const created = findAudit(audit, 'CREATE');
  const sent = findAudit(audit, 'SEND');
  const rework = findAudit(audit, 'REWORK');
  const reject = findAudit(audit, 'REJECT');
  const approve = findAudit(audit, 'APPROVE');
  const currentStep = steps.find((item) => item.status === 'PENDING') || steps[steps.length - 1];

  const nodes: FlowNode[] = [
    {
      id: 'draft',
      title: 'Черновик',
      subtitle: status === 'DRAFT' ? 'Документ редактируется' : 'Черновик сформирован',
      actor: details.author,
      timestamp: formatDateTime(created?.createdAt || createdAt),
      state: status === 'DRAFT' ? 'current' : 'completed',
      x: 60,
      y: 130,
    },
    {
      id: 'sent',
      title: 'Отправлен',
      subtitle: sent ? 'Маршрут запущен' : 'Маршрут ещё не запускался',
      actor: details.author,
      timestamp: formatDateTime(sent?.createdAt || null),
      state: ['IN_APPROVAL', 'REWORK', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(status) ? 'completed' : 'pending',
      x: 270,
      y: 80,
    },
    {
      id: 'approval',
      title: 'На согласовании',
      subtitle: currentStep ? `Шаг ${currentStep.order}: ${currentStep.approver}` : 'Ожидание шага',
      actor: currentStep?.approver,
      timestamp: currentStep?.decidedAt ? formatDateTime(currentStep.decidedAt) : undefined,
      state: status === 'IN_APPROVAL' ? 'current' : ['REWORK', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(status) ? 'completed' : 'pending',
      x: 500,
      y: 120,
    },
    {
      id: 'rework',
      title: 'Доработка',
      subtitle: rework ? 'Документ вернули на доработку' : 'Ветка возврата не активировалась',
      actor: rework?.actor,
      timestamp: formatDateTime(rework?.createdAt || null),
      state: status === 'REWORK' ? 'branch' : rework ? 'completed' : 'pending',
      x: 500,
      y: 270,
    },
    {
      id: 'approved',
      title: 'Согласован',
      subtitle: approve ? 'Активный цикл завершён' : 'Согласование ещё не завершено',
      actor: approve?.actor,
      timestamp: formatDateTime(approve?.createdAt || null),
      state: status === 'APPROVED' || status === 'ARCHIVED' ? 'current' : approve ? 'completed' : 'pending',
      x: 735,
      y: 95,
    },
    {
      id: 'rejected',
      title: 'Отклонён',
      subtitle: reject ? 'Маршрут завершён отклонением' : 'Ветка отклонения не активировалась',
      actor: reject?.actor,
      timestamp: formatDateTime(reject?.createdAt || null),
      state: status === 'REJECTED' ? 'branch' : reject ? 'completed' : 'pending',
      x: 735,
      y: 255,
    },
  ];

  const edges: FlowEdge[] = [
    { from: 'draft', to: 'sent', kind: 'main', active: status !== 'DRAFT' },
    { from: 'sent', to: 'approval', kind: 'main', active: ['IN_APPROVAL', 'REWORK', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(status) },
    { from: 'approval', to: 'approved', kind: 'main', active: ['APPROVED', 'ARCHIVED'].includes(status) || Boolean(approve) },
    { from: 'approval', to: 'rework', kind: 'rework', active: status === 'REWORK' || Boolean(rework) },
    { from: 'approval', to: 'rejected', kind: 'reject', active: status === 'REJECTED' || Boolean(reject) },
    { from: 'rework', to: 'sent', kind: 'rework', active: Boolean(rework) && status !== 'REWORK' },
  ];

  return { nodes, edges };
}

export function nodeStatusText(state: FlowNodeState): string {
  switch (state) {
    case 'completed':
      return 'Пройдено';
    case 'current':
      return 'Текущий этап';
    case 'branch':
      return 'Активная ветка';
    default:
      return 'Ожидает';
  }
}

export function nodeCssState(state: FlowNodeState): string {
  return `flow-node-${state}`;
}
