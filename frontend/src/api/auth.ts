import type { AuthResponse, LoginRequest } from '../types/api';
import { requestJson } from './client';

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}
