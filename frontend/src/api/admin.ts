import type { DocumentTypeRequest, DocumentTypeResponse, UserResponse } from '../types/api';
import { requestJson } from './client';

export function getUsers(token: string): Promise<UserResponse[]> {
  return requestJson<UserResponse[]>('/admin/users', { token });
}

export function getDocumentTypes(token: string): Promise<DocumentTypeResponse[]> {
  return requestJson<DocumentTypeResponse[]>('/admin/document-types', { token });
}

export function createDocumentType(token: string, payload: DocumentTypeRequest): Promise<DocumentTypeResponse> {
  return requestJson<DocumentTypeResponse>('/admin/document-types', {
    method: 'POST',
    token,
    body: payload,
  });
}
