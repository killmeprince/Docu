import type { ReportResponse } from '../types/api';
import { requestJson } from './client';

export function getReportSummary(token: string): Promise<ReportResponse> {
  return requestJson<ReportResponse>('/reports/summary', { token });
}
