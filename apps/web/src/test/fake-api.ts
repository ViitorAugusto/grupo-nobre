import { vi } from 'vitest';

type FakeResponse = { status: number; body: unknown } | 'network-error';
type Handler = (request: { url: URL; body: unknown }) => FakeResponse | Promise<FakeResponse>;

const routes = new Map<string, Handler>();

export function ok(body: unknown): FakeResponse {
  return { status: 200, body };
}

export function apiError(status: number, error: string, message: string): FakeResponse {
  return { status, body: { statusCode: status, error, message } };
}

export function onRequest(method: string, path: string, handler: Handler) {
  routes.set(`${method} ${path}`, handler);
}

export function installFakeApi() {
  routes.clear();
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const method = init?.method ?? 'GET';
    const handler = routes.get(`${method} ${path}`);
    if (!handler) throw new Error(`Rota não simulada no teste: ${method} ${path}`);
    const result = await handler({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (result === 'network-error') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
