import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SellerQueue } from '@/shared/api/types';
import { installFakeApi, ok, onRequest } from '@/test/fake-api';
import { meta, seedOpportunities, sellers, toDetail } from '@/test/fixtures';
import { getTestSearchParams, setTestUrl } from '@/test/next-navigation-mock';
import { renderWithProviders } from '@/test/render';
import { FollowUpQueueScreen } from './follow-up-queue-screen';

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-navigation-mock')).navigationMock,
);

const opp2002 = seedOpportunities()[1];

function brunoQueue(overrides: Partial<SellerQueue> = {}): SellerQueue {
  return {
    date: '2026-10-15',
    seller: sellers.bruno,
    generatedAt: '2026-10-20T10:00:00.000Z',
    items: [
      {
        position: 1,
        opportunity: {
          id: opp2002.id,
          code: opp2002.code,
          company: opp2002.company,
          estimatedValue: opp2002.estimatedValue,
        },
        reasons: opp2002.attention.reasons,
      },
    ],
    ...overrides,
  };
}

let queue: SellerQueue;

beforeEach(() => {
  queue = brunoQueue();
  installFakeApi();
  onRequest('GET', '/meta', () => ok(meta));
  onRequest('GET', '/sellers', () => ok({ data: Object.values(sellers) }));
  onRequest('GET', '/follow-up-queue', () => ok(queue));
  setTestUrl('/retornos', `vendedor=${sellers.bruno.id}`);
});

describe('H5.2 — Retornos de hoje', () => {
  it('mostra posição, código, empresa, valor e todos os motivos', async () => {
    renderWithProviders(<FollowUpQueueScreen />);

    const item = (await screen.findByText('OPP-2002')).closest('li')!;
    expect(within(item).getByLabelText('Posição 1')).toBeInTheDocument();
    expect(within(item).getByText(/Construtora Horizonte/)).toBeInTheDocument();
    expect(within(item).getByText('R$ 9.800,00')).toBeInTheDocument();
    expect(within(item).getByText('Proposta vencida há 2 dias')).toBeInTheDocument();
    expect(within(item).getByText('9 dias sem contato')).toBeInTheDocument();
  });

  it('pede a fila do vendedor escolhido', async () => {
    renderWithProviders(<FollowUpQueueScreen />);
    await screen.findByText('OPP-2002');

    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes(`/follow-up-queue?sellerId=${sellers.bruno.id}`))).toBe(
      true,
    );
  });

  it('sem vendedor na URL, abre no primeiro vendedor da lista', async () => {
    setTestUrl('/retornos');
    renderWithProviders(<FollowUpQueueScreen />);
    await screen.findByText('OPP-2002');

    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes(`sellerId=${sellers.ana.id}`))).toBe(true);
  });

  it('registrar contato tira o item da fila de hoje', async () => {
    onRequest('POST', `/opportunities/${opp2002.id}/contacts`, () => {
      queue = brunoQueue({ items: [] });
      return ok(toDetail(opp2002));
    });
    const { user } = renderWithProviders(<FollowUpQueueScreen />);

    await user.click(await screen.findByRole('button', { name: 'Registrar contato' }));

    expect(await screen.findByText('Nenhum retorno pendente hoje')).toBeInTheDocument();
    expect(screen.queryByText('OPP-2002')).not.toBeInTheDocument();
  });

  it('clicar no item abre o detalhe da oportunidade', async () => {
    const { user } = renderWithProviders(<FollowUpQueueScreen />);

    await user.click(await screen.findByRole('button', { name: /OPP-2002/ }));

    expect(getTestSearchParams().get('oportunidade')).toBe(opp2002.id);
  });

  it('vendedor sem pendências vê "Nenhum retorno pendente hoje"', async () => {
    queue = brunoQueue({ items: [] });
    renderWithProviders(<FollowUpQueueScreen />);

    expect(await screen.findByText('Nenhum retorno pendente hoje')).toBeInTheDocument();
  });

  it('fila ainda não gerada mostra estado próprio e "Gerar fila de hoje"', async () => {
    queue = brunoQueue({ generatedAt: null, items: [] });
    onRequest('POST', '/follow-up-queue/runs', () => {
      queue = brunoQueue();
      return ok({ date: '2026-10-15', generatedAt: '2026-10-20T10:00:00.000Z', sellers: [] });
    });
    const { user } = renderWithProviders(<FollowUpQueueScreen />);

    expect(await screen.findByText('A fila de hoje ainda não foi gerada')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum retorno pendente hoje')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gerar fila de hoje' }));

    expect(await screen.findByText('OPP-2002')).toBeInTheDocument();
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    onRequest('GET', '/follow-up-queue', () => new Promise(() => {}));
    renderWithProviders(<FollowUpQueueScreen />);

    expect(
      await screen.findByRole('status', { name: 'Carregando fila de retornos' }),
    ).toBeInTheDocument();
  });

  it('mostra erro com "Tentar novamente" e recarrega', async () => {
    let attempts = 0;
    onRequest('GET', '/follow-up-queue', () => {
      attempts += 1;
      return attempts === 1 ? 'network-error' : ok(queue);
    });
    const { user } = renderWithProviders(<FollowUpQueueScreen />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar a fila de retornos.');
    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByText('OPP-2002')).toBeInTheDocument());
  });
});
