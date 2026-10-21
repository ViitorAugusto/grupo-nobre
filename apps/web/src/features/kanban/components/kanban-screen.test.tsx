import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError, installFakeApi, ok, onRequest } from '@/test/fake-api';
import type { Opportunity, Stage } from '@/shared/api/types';
import { meta, movedTo, seedOpportunities, sellers } from '@/test/fixtures';
import { setTestUrl } from '@/test/next-navigation-mock';
import { renderWithProviders } from '@/test/render';
import { KanbanScreen } from './kanban-screen';

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-navigation-mock')).navigationMock,
);

let board: Opportunity[];

function acceptMove(id: string, toStage: Stage, extra: Partial<Opportunity> = {}) {
  onRequest('POST', `/opportunities/${id}/stage-changes`, () => {
    const detail = {
      ...movedTo(
        board.find((item) => item.id === id)!,
        toStage,
      ),
      ...extra,
    };
    board = board.map((item) => (item.id === id ? detail : item));
    return ok(detail);
  });
}

function columns() {
  return within(screen.getByLabelText('Quadro de oportunidades')).getAllByRole('region');
}

function column(name: string, { hidden = false } = {}) {
  return screen.getByRole('region', { name: new RegExp(`^${name}`), hidden });
}

async function renderBoard() {
  const view = renderWithProviders(<KanbanScreen />);
  await screen.findByRole('region', { name: /^Primeiro Contato/ });
  return view;
}

beforeEach(() => {
  setTestUrl('/');
  board = seedOpportunities();
  installFakeApi();
  onRequest('GET', '/meta', () => ok(meta));
  onRequest('GET', '/sellers', () => ok({ data: Object.values(sellers) }));
  onRequest('GET', '/opportunities', () => ok({ data: board }));
});

describe('H4.1 — ver o Kanban', () => {
  it('mostra as 6 colunas com quantidade e valor total, cada card na sua etapa', async () => {
    await renderBoard();

    expect(columns()).toHaveLength(6);
    const followUp = column('Follow-up');
    expect(within(followUp).getByText('OPP-2003')).toBeInTheDocument();
    expect(within(followUp).getByText('OPP-2004')).toBeInTheDocument();
    expect(within(followUp).getByLabelText('2 oportunidades')).toBeInTheDocument();
    expect(within(followUp).getByText('R$ 11.100,00')).toBeInTheDocument();
  });

  it('mantém a ordem da API dentro da coluna', async () => {
    await renderBoard();

    const codes = within(column('Follow-up'))
      .getAllByRole('article')
      .map((card) => within(card).getByText(/^OPP-/).textContent);
    expect(codes).toEqual(['OPP-2003', 'OPP-2004']);
  });
});

describe('card — dias sem contato (valor da API)', () => {
  it('mostra "X dias sem contato" em etapa não final', async () => {
    await renderBoard();

    const card = screen.getByRole('article', { name: /OPP-2002/ });
    expect(within(card).getByText(/9 dias sem contato/)).toBeInTheDocument();
  });

  it('mostra "Contato hoje" quando daysWithoutContact é 0 (OPP-2005)', async () => {
    await renderBoard();

    const card = screen.getByRole('article', { name: /OPP-2005/ });
    expect(within(card).getByText(/Contato hoje/)).toBeInTheDocument();
    expect(within(card).queryByText(/0 dias sem contato/)).not.toBeInTheDocument();
  });

  it.each(['OPP-2006', 'OPP-2007'])(
    'esconde os dias sem contato no card final %s',
    async (code) => {
      await renderBoard();

      const card = screen.getByRole('article', { name: new RegExp(code) });
      expect(within(card).queryByText(/sem contato|Contato hoje/)).not.toBeInTheDocument();
    },
  );
});

describe('H4.5 — destaque de "precisa de atenção"', () => {
  it('mostra o motivo principal e "+1" vindos da API, com ícone e texto', async () => {
    await renderBoard();

    const card = screen.getByRole('article', { name: /OPP-2002/ });
    expect(within(card).getByText('Proposta vencida há 2 dias')).toBeInTheDocument();
    expect(within(card).getByText('+1')).toBeInTheDocument();
    expect(
      within(card).getByLabelText(
        'Precisa de atenção: Proposta vencida há 2 dias · 9 dias sem contato',
      ),
    ).toBeInTheDocument();
  });

  it('não mostra selo de atenção em card sem atenção', async () => {
    await renderBoard();

    const card = screen.getByRole('article', { name: /OPP-2005/ });
    expect(within(card).queryByLabelText(/Precisa de atenção/)).not.toBeInTheDocument();
  });
});

describe('H4.2 / H4.8 — mover de etapa', () => {
  it('move a OPP-2005 de Forecast para Fechamento e mostra a confirmação', async () => {
    acceptMove('opp-2005', 'FECHAMENTO');
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2005 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Fechamento' }));

    expect(await screen.findByText('OPP-2005 movida para Fechamento')).toBeInTheDocument();
    expect(within(column('Fechamento')).getByText('OPP-2005')).toBeInTheDocument();
  });

  it('devolve o card à origem e mostra a mensagem da API quando ela recusa', async () => {
    const refusal = 'Para ir para Apresentação de Orçamento, informe o valor estimado.';
    onRequest('POST', '/opportunities/opp-2003/stage-changes', () =>
      apiError(422, 'REQUISITOS_ORCAMENTO', refusal),
    );
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2003 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Apresentação de Orçamento' }));

    expect(await screen.findByText(refusal)).toBeInTheDocument();
    await waitFor(() =>
      expect(within(column('Follow-up')).getByText('OPP-2003')).toBeInTheDocument(),
    );
    expect(
      within(column('Apresentação de Orçamento')).queryByText('OPP-2003'),
    ).not.toBeInTheDocument();
  });

  it('em mudança simultânea (409) devolve o card, mostra a mensagem e recarrega o estado real', async () => {
    const conflict = 'A etapa desta oportunidade mudou. Recarregamos o quadro.';
    onRequest('POST', '/opportunities/opp-2005/stage-changes', () => {
      board = board.map((item) =>
        item.id === 'opp-2005' ? { ...item, stage: 'FOLLOW_UP' } : item,
      );
      return apiError(409, 'ETAPA_ALTERADA', conflict);
    });
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2005 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Fechamento' }));

    expect(await screen.findByText(conflict)).toBeInTheDocument();
    await waitFor(() =>
      expect(within(column('Follow-up')).getByText('OPP-2005')).toBeInTheDocument(),
    );
    expect(within(column('Fechamento')).queryByText('OPP-2005')).not.toBeInTheDocument();
  });

  it('devolve o card e oferece "Tentar novamente" quando a rede falha', async () => {
    onRequest('POST', '/opportunities/opp-2001/stage-changes', () => 'network-error');
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2001 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Apresentação de Orçamento' }));

    expect(await screen.findByText('Sem conexão com o servidor.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    await waitFor(() =>
      expect(within(column('Primeiro Contato')).getByText('OPP-2001')).toBeInTheDocument(),
    );
  });

  it('não oferece mover nem arrastar card em estado final (OPP-2006)', async () => {
    await renderBoard();

    expect(screen.queryByRole('button', { name: 'Mover OPP-2006 para…' })).not.toBeInTheDocument();
    const card = screen.getByRole('article', { name: /OPP-2006/ });
    expect(card.closest('li')).not.toHaveAttribute('aria-roledescription');
  });
});

describe('H4.3 — marcar como perdida', () => {
  it('Perdida abre a escolha do motivo e cancelar mantém o card na origem sem chamar a API', async () => {
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2002 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Perdida' }));
    const dialog = await screen.findByRole('dialog', { name: 'Marcar como perdida' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(column('Apresentação de Orçamento')).getByText('OPP-2002')).toBeInTheDocument();
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('"Outro" exige texto antes de enviar', async () => {
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2002 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Perdida' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Outro' }));
    await user.click(within(dialog).getByRole('button', { name: 'Marcar como perdida' }));

    expect(within(dialog).getByText('Descreva o motivo ao escolher "Outro".')).toBeInTheDocument();
  });

  it('confirma o motivo e o card vai para Perdida', async () => {
    acceptMove('opp-2002', 'PERDIDA', { lossReason: 'PRECO' });
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2002 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Perdida' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Preço' }));
    await user.click(within(dialog).getByRole('button', { name: 'Marcar como perdida' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [, init] = vi.mocked(fetch).mock.calls.find(([, call]) => call?.method === 'POST')!;
    expect(JSON.parse(String(init?.body))).toEqual({ toStage: 'PERDIDA', lossReason: 'PRECO' });
    expect(within(column('Perdida')).getByText('OPP-2002')).toBeInTheDocument();
  });

  it('mostra no diálogo a mensagem da API quando ela recusa a perda', async () => {
    onRequest('POST', '/opportunities/opp-2002/stage-changes', () =>
      apiError(422, 'MOTIVO_PERDA_OBRIGATORIO', 'Informe o motivo da perda.'),
    );
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'Mover OPP-2002 para…' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Perdida' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Prazo' }));
    await user.click(within(dialog).getByRole('button', { name: 'Marcar como perdida' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Informe o motivo da perda.',
    );
    expect(
      within(column('Apresentação de Orçamento', { hidden: true })).getByText('OPP-2002'),
    ).toBeInTheDocument();
  });
});

describe('H4.4 — buscar e filtrar', () => {
  it('envia vendedor e "só atenção" para a API e mostra o que ela devolve (Carla → OPP-2004)', async () => {
    let query = '';
    onRequest('GET', '/opportunities', ({ url }) => {
      query = url.search;
      return ok({ data: seedOpportunities().filter((item) => item.code === 'OPP-2004') });
    });
    setTestUrl('/', `vendedor=${sellers.carla.id}&atencao=1`);
    await renderBoard();

    expect(query).toContain(`sellerId=${sellers.carla.id}`);
    expect(query).toContain('needsAttention=true');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('OPP-2004')).toBeInTheDocument();
    expect(screen.getByText(/Filtros ativos/)).toHaveTextContent('vendedor Carla');
  });
});

describe('H4.7 — estados', () => {
  it('mostra o esqueleto enquanto carrega', () => {
    onRequest('GET', '/opportunities', () => new Promise(() => {}));
    renderWithProviders(<KanbanScreen />);

    expect(screen.getByRole('status', { name: 'Carregando oportunidades' })).toBeInTheDocument();
  });

  it('mostra erro com "Tentar novamente" e recarrega', async () => {
    let attempts = 0;
    onRequest('GET', '/opportunities', () => {
      attempts += 1;
      return attempts === 1 ? 'network-error' : ok({ data: seedOpportunities() });
    });
    const { user } = renderWithProviders(<KanbanScreen />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar as oportunidades.');
    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('OPP-2001')).toBeInTheDocument();
  });

  it('coluna vazia diz "Nenhuma oportunidade nesta etapa"', async () => {
    onRequest('GET', '/opportunities', () =>
      ok({ data: seedOpportunities().filter((item) => item.stage !== 'FORECAST') }),
    );
    await renderBoard();

    expect(
      within(column('Forecast')).getByText('Nenhuma oportunidade nesta etapa'),
    ).toBeInTheDocument();
  });

  it('filtro sem resultado oferece "Limpar filtros"', async () => {
    onRequest('GET', '/opportunities', ({ url }) =>
      ok({ data: url.searchParams.has('search') ? [] : seedOpportunities() }),
    );
    setTestUrl('/', 'busca=inexistente');
    const { user } = await renderBoard();

    expect(screen.getByText('Nenhuma oportunidade com esses filtros')).toBeInTheDocument();
    const clearButtons = screen.getAllByRole('button', { name: 'Limpar filtros' });
    await user.click(clearButtons[clearButtons.length - 1]);

    expect(await screen.findByText('OPP-2001')).toBeInTheDocument();
  });

  it('sem oportunidades mostra o quadro vazio com mensagem, mantendo as colunas', async () => {
    onRequest('GET', '/opportunities', () => ok({ data: [] }));
    await renderBoard();

    expect(screen.getByText('Nenhuma oportunidade no funil ainda')).toBeInTheDocument();
    expect(columns()).toHaveLength(6);
  });
});
