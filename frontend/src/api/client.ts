const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api').replace(/\/$/, '');
const API_ROOT = API_BASE.replace(/\/api$/, '');

export class ApiError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function normalizePath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return `${API_ROOT}${path}`;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

async function parseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') || '';
  let message = `Запрос завершился со статусом ${response.status}`;

  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.error || payload.message || message;
    } else {
      const text = await response.text();
      if (text.trim()) message = text;
    }
  } catch {
    // noop
  }

  return new ApiError(response.status, message);
}

export function toQuery(filters: Record<string, string | number | null | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function requestJson<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  isFormData?: boolean;
} = {}): Promise<T> {
  const { method = 'GET', token, body, isFormData = false } = options;
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!isFormData) headers.set('Content-Type', 'application/json');

  const response = await fetch(normalizePath(path), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as BodyInit) : JSON.stringify(body),
  });

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null as T;

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

export async function requestVoid(path: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  isFormData?: boolean;
} = {}): Promise<void> {
  await requestJson<null>(path, options);
}

export async function requestBlob(path: string, token: string): Promise<Blob> {
  const response = await fetch(normalizePath(path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export function buildMultipartPayload(payload: object, file: File | null): FormData {
  const formData = new FormData();
  formData.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (file) formData.append('file', file);
  return formData;
}
