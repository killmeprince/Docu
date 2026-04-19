import type {
  DocumentCreateRequest,
  DocumentDetailsResponse,
  DocumentResponse,
  DocumentsFilter,
  DocumentUpdateRequest,
  ApprovalStepResponse,
} from '../types/api';
import { buildMultipartPayload, requestJson, requestVoid, toQuery } from './client';

export function getDocuments(token: string, filters: DocumentsFilter = {}): Promise<DocumentResponse[]> {
  return requestJson<DocumentResponse[]>(`/documents${toQuery(filters)}`, { token });
}

export function getDocument(token: string, documentId: number): Promise<DocumentDetailsResponse> {
  return requestJson<DocumentDetailsResponse>(`/documents/${documentId}`, { token });
}

export function createDocument(token: string, payload: DocumentCreateRequest, file: File | null): Promise<DocumentResponse> {
  return requestJson<DocumentResponse>('/documents', {
    method: 'POST',
    token,
    body: buildMultipartPayload(payload, file),
    isFormData: true,
  });
}

export function updateDocument(token: string, documentId: number, payload: DocumentUpdateRequest, file: File | null): Promise<DocumentResponse> {
  return requestJson<DocumentResponse>(`/documents/${documentId}`, {
    method: 'PUT',
    token,
    body: buildMultipartPayload(payload, file),
    isFormData: true,
  });
}

export function sendDocumentToApproval(token: string, documentId: number): Promise<void> {
  return requestVoid(`/documents/${documentId}/send-to-approval`, {
    method: 'POST',
    token,
  });
}

export function getApprovalSteps(token: string, documentId: number): Promise<ApprovalStepResponse[]> {
  return requestJson<ApprovalStepResponse[]>(`/documents/${documentId}/approval-steps`, { token });
}
