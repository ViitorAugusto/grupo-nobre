import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpportunityDetail } from '@/shared/api/types';
import { installFakeApi, ok, onRequest } from '@/test/fake-api';
import { meta, seedOpportunities, toDetail } from '@/test/fixtures';
import { setTestUrl } from '@/test/next-navigation-mock';
import { renderWithProviders } from '@/test/render';
import { OpportunityDetailDialog } from './opportunity-detail-dialog';

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-navigation-mock')).navigationMock,
);

const opp2002 = (): OpportunityDetail => toDetail(seedOpportunities()[1]);

beforeEach(() => {
  installFakeApi();
  onRequest('GET', '/meta', () => ok(meta));
  onRequest('GET', '/opportunities/opp-2002', () => ok(opp2002()));
  setTestUrl('/', 'oportunidade=opp-2002');
});

describe('H4.6 — detalhe da oportunidade', () => {
  it('mostra dados comerciais, itens, todos os alertas e o histórico', async () => {
    renderWithProviders(<OpportunityDetailDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Construtora Horizonte' });
    expect(within(dialog).getByText('R$ 9.800,00')).toBeInTheDocument();
    expect(within(dialog).getByText('13/10/2026')).toBeInTheDocument();
    expect(within(dialog).getByText('Kit escritório')).toBeInTheDocument();
    const alerts = within(dialog).getByRole('list', { name: 'Motivos de atenção' });
    expect(within(alerts).getByText('Proposta vencida há 2 dias')).toBeInTheDocument();
    expect(within(alerts).getByText('9 dias sem contato')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Nenhuma mudança de etapa registrada ainda.'),
    ).toBeInTheDocument();
  });

  it('ao registrar contato na OPP-2002, "9 dias sem contato" some e "proposta vencida" continua', async () => {
    onRequest('POST', '/opportunities/opp-2002/contacts', () => {
      const updated = opp2002();
      updated.lastContactDate = '2026-10-15';
      updated.daysWithoutContact = 0;
      updated.attention.reasons = updated.attention.reasons.filter((r) => r.rule !== 'A2');
      onRequest('GET', '/opportunities/opp-2002', () => ok(updated));
      return ok(updated);
    });
    const { user } = renderWithProviders(<OpportunityDetailDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Construtora Horizonte' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar contato' }));

    expect(await screen.findByText('Contato registrado em OPP-2002')).toBeInTheDocument();
    const alerts = within(dialog).getByRole('list', { name: 'Motivos de atenção' });
    expect(within(alerts).queryByText('9 dias sem contato')).not.toBeInTheDocument();
    expect(within(alerts).getByText('Proposta vencida há 2 dias')).toBeInTheDocument();
  });

  it('oferece "Mover para…" e "Marcar como perdida" conforme allowedTransitions', async () => {
    renderWithProviders(<OpportunityDetailDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Construtora Horizonte' });
    expect(
      within(dialog).getByRole('button', { name: 'Mover OPP-2002 para…' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Marcar como perdida' })).toBeInTheDocument();
  });

  it('em estado final não oferece ações e mostra o motivo legado da perda', async () => {
    onRequest('GET', '/opportunities/opp-2007', () => ok(toDetail(seedOpportunities()[6])));
    setTestUrl('/', 'oportunidade=opp-2007');
    renderWithProviders(<OpportunityDetailDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Padaria do Bairro' });
    expect(within(dialog).getByText('Perdida: Não registrado (dado legado)')).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Registrar contato' }),
    ).not.toBeInTheDocument();
  });
});
