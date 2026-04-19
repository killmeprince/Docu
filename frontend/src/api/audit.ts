import type { AuditEventResponse } from '../types/api';
import { requestJson } from './client';

export function getDocumentAudit(token: string, documentId: number): Promise<AuditEventResponse[]> {
  return requestJson<AuditEventResponse[]>(`/audit/documents/${documentId}`, { token });
}
