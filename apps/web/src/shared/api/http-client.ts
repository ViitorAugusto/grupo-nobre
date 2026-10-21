import { ApiError, NETWORK_ERROR_MESSAGE } from './api-error';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

type Query = Record<string, string | number | boolean | undefined>;
type RequestOptions = { query?: Query; body?: unknown; signal?: AbortSignal };

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.error === 'string' && typeof body.message === 'string') {
    return new ApiError(response.status, body.error, body.message, body.details);
  }
  return new ApiError(response.status, 'ERRO_INTERNO', 'Algo deu errado. Tente novamente.');
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      signal: options.signal,
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'SEM_CONEXAO', NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
};
