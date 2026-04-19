import type { ApprovalDecisionRequest } from '../types/api';
import { requestVoid } from './client';

export function decideApprovalStep(token: string, stepId: number, payload: ApprovalDecisionRequest): Promise<void> {
  return requestVoid(`/approvals/steps/${stepId}/decision`, {
    method: 'POST',
    token,
    body: payload,
  });
}
