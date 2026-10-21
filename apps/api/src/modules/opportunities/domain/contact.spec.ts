import { buildOpportunity, TODAY } from '../testing/build-opportunity.js';
import { registerContact } from './contact.js';
import type { Stage } from './stage.js';

describe('Registrar contato (H2.3)', () => {
  it('o último contato passa a ser a data de referência', () => {
    const updated = registerContact(
      buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-02' }),
      TODAY,
    );
    expect(updated?.lastContactDate).toBe('2026-10-15');
  });

  it('repetir no mesmo dia não muda nada', () => {
    expect(
      registerContact(
        buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-15' }),
        TODAY,
      ),
    ).toBeNull();
  });

  it.each(['FECHAMENTO', 'PERDIDA'] as Stage[])('recusa em %s (estado final)', (stage) => {
    expect(() => registerContact(buildOpportunity({ stage }), TODAY)).toThrow(
      expect.objectContaining({ code: 'ESTADO_FINAL' }),
    );
  });
});
