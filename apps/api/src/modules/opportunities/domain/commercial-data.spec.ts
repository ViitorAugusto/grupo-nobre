import { parseCalendarDate } from '../../../shared/domain/calendar-date.js';
import { buildOpportunity } from '../testing/build-opportunity.js';
import { applyCommercialData } from './commercial-data.js';
import type { Stage } from './stage.js';

const KEEP_MESSAGE =
  'A partir de Apresentação de Orçamento a oportunidade precisa de valor estimado e pelo menos 1 item.';

describe('Editar dados comerciais (H2.4)', () => {
  it('só muda os campos enviados; null limpa', () => {
    const opportunity = buildOpportunity({
      stage: 'FOLLOW_UP',
      proposalValidUntil: '2026-10-20',
      eventDate: '2026-10-25',
    });
    const updated = applyCommercialData(opportunity, {
      estimatedValue: 10500,
      eventDate: null,
    });
    expect(updated).toMatchObject({
      estimatedValue: 10500,
      proposalValidUntil: '2026-10-20',
      eventDate: null,
      items: opportunity.items,
    });
  });

  it('items substitui a lista inteira', () => {
    const updated = applyCommercialData(buildOpportunity({ stage: 'FOLLOW_UP' }), {
      items: [
        { product: 'Kit escritório', quantity: 150 },
        { product: 'Caneta', quantity: 300 },
      ],
    });
    expect(updated.items).toEqual([
      { product: 'Kit escritório', quantity: 150 },
      { product: 'Caneta', quantity: 300 },
    ]);
  });

  it('datas incoerentes não bloqueiam (viram alerta A4)', () => {
    const updated = applyCommercialData(buildOpportunity({ stage: 'FOLLOW_UP' }), {
      proposalValidUntil: parseCalendarDate('2026-11-30'),
      eventDate: parseCalendarDate('2026-11-01'),
    });
    expect(updated.proposalValidUntil).toBe('2026-11-30');
  });

  it('em Primeiro Contato permite limpar valor e itens', () => {
    const updated = applyCommercialData(buildOpportunity({ stage: 'PRIMEIRO_CONTATO' }), {
      estimatedValue: null,
      items: [],
    });
    expect(updated).toMatchObject({ estimatedValue: null, items: [] });
  });

  describe.each(['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FORECAST'] as Stage[])(
    'em %s precisa manter valor e itens',
    (stage) => {
      it.each([
        ['sem valor', { estimatedValue: null }, ['estimatedValue']],
        ['sem itens', { items: [] }, ['items']],
        ['sem os dois', { estimatedValue: null, items: [] }, ['estimatedValue', 'items']],
      ])('recusa deixar %s', (_, changes, missing) => {
        expect(() => applyCommercialData(buildOpportunity({ stage }), changes)).toThrow(
          expect.objectContaining({
            code: 'REQUISITOS_ORCAMENTO',
            message: KEEP_MESSAGE,
            details: { missing },
          }),
        );
      });
    },
  );

  it.each(['FECHAMENTO', 'PERDIDA'] as Stage[])('recusa edição em %s (estado final)', (stage) => {
    expect(() => applyCommercialData(buildOpportunity({ stage }), { estimatedValue: 1 })).toThrow(
      expect.objectContaining({ code: 'ESTADO_FINAL' }),
    );
  });
});
