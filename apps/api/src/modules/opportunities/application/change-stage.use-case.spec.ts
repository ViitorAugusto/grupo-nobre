import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import { buildOpportunity, PARAMS, TODAY } from '../testing/build-opportunity.js';
import { InMemoryOpportunityRepository } from '../testing/in-memory-opportunity.repository.js';
import type { AttentionParametersProvider } from './attention-parameters.provider.js';
import { ChangeStageUseCase } from './change-stage.use-case.js';
import { GetOpportunityUseCase } from './get-opportunity.use-case.js';
import { OpportunityViews } from './opportunity-views.js';
import { RegisterContactUseCase } from './register-contact.use-case.js';
import { UpdateOpportunityUseCase } from './update-opportunity.use-case.js';

const fixedDate: ReferenceDateProvider = { today: () => TODAY };
const fixedParams: AttentionParametersProvider = { get: () => PARAMS };

function setup(...opportunities: ReturnType<typeof buildOpportunity>[]) {
  const repository = new InMemoryOpportunityRepository(opportunities);
  const get = new GetOpportunityUseCase(repository, new OpportunityViews(fixedDate, fixedParams));
  return {
    repository,
    changeStage: new ChangeStageUseCase(repository, get),
    registerContact: new RegisterContactUseCase(repository, fixedDate, get),
    update: new UpdateOpportunityUseCase(repository, get),
  };
}

const ID = '00000000-0000-4000-8000-000000000001';

describe('Mudar etapa (caso de uso)', () => {
  it('grava a etapa e o histórico juntos', async () => {
    const { changeStage } = setup(buildOpportunity({ stage: 'FOLLOW_UP' }));
    const detail = await changeStage.execute(ID, { toStage: 'FORECAST' });
    expect(detail.opportunity.stage).toBe('FORECAST');
    expect(detail.history).toMatchObject([{ fromStage: 'FOLLOW_UP', toStage: 'FORECAST' }]);
  });

  it('recusa não grava nada', async () => {
    const { changeStage, repository } = setup(buildOpportunity({ stage: 'FOLLOW_UP' }));
    await expect(changeStage.execute(ID, { toStage: 'FECHAMENTO' })).rejects.toMatchObject({
      code: 'TRANSICAO_INVALIDA',
    });
    expect(repository.writes).toBe(0);
    expect((await repository.findById(ID))?.stage).toBe('FOLLOW_UP');
    expect(await repository.findHistory(ID)).toEqual([]);
  });

  it('mesma etapa responde sem mudança e sem histórico', async () => {
    const { changeStage, repository } = setup(buildOpportunity({ stage: 'FOLLOW_UP' }));
    const detail = await changeStage.execute(ID, { toStage: 'FOLLOW_UP' });
    expect(detail.history).toEqual([]);
    expect(repository.writes).toBe(0);
  });

  it('falha ao gravar o histórico não muda a etapa', async () => {
    const { changeStage, repository } = setup(buildOpportunity({ stage: 'FOLLOW_UP' }));
    repository.failOnHistory = true;
    await expect(changeStage.execute(ID, { toStage: 'FORECAST' })).rejects.toThrow(
      'falha ao gravar histórico',
    );
    expect((await repository.findById(ID))?.stage).toBe('FOLLOW_UP');
    expect(await repository.findHistory(ID)).toEqual([]);
  });

  it('corrida: etapa mudou após a leitura → ETAPA_ALTERADA e nada é gravado', async () => {
    const { changeStage, repository } = setup(buildOpportunity({ stage: 'FORECAST' }));
    repository.simulateConcurrentChange('PERDIDA');

    await expect(changeStage.execute(ID, { toStage: 'FECHAMENTO' })).rejects.toMatchObject({
      code: 'ETAPA_ALTERADA',
      message: 'Esta oportunidade foi alterada enquanto você a movia. Recarregue e tente de novo.',
      details: { expected: 'FORECAST', current: 'PERDIDA' },
    });
    expect((await repository.findById(ID))?.stage).toBe('PERDIDA');
    expect(await repository.findHistory(ID)).toEqual([]);
    expect(repository.writes).toBe(0);
  });

  it('oportunidade inexistente responde NAO_ENCONTRADO', async () => {
    const { changeStage } = setup();
    await expect(changeStage.execute(ID, { toStage: 'FORECAST' })).rejects.toMatchObject({
      code: 'NAO_ENCONTRADO',
    });
  });
});

describe('Registrar contato (caso de uso)', () => {
  it('remove o A2 e mantém os outros alertas', async () => {
    const { registerContact } = setup(
      buildOpportunity({
        stage: 'APRESENTACAO_ORCAMENTO',
        lastContactDate: '2026-10-06',
        proposalValidUntil: '2026-10-13',
      }),
    );
    const detail = await registerContact.execute(ID);
    expect(detail.opportunity.lastContactDate).toBe('2026-10-15');
    expect(detail.attention.reasons.map((reason) => reason.rule)).toEqual(['A1']);
  });

  it('repetir no mesmo dia não grava de novo', async () => {
    const { registerContact, repository } = setup(
      buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-15' }),
    );
    await registerContact.execute(ID);
    expect(repository.writes).toBe(0);
  });
});

describe('Editar dados comerciais (caso de uso)', () => {
  it('recusa não grava nada', async () => {
    const { update, repository } = setup(buildOpportunity({ stage: 'FOLLOW_UP' }));
    await expect(update.execute(ID, { items: [] })).rejects.toMatchObject({
      code: 'REQUISITOS_ORCAMENTO',
    });
    expect(repository.writes).toBe(0);
  });

  it('sem items no PATCH, mantém os itens existentes (mesmos ids)', async () => {
    const opportunity = buildOpportunity({ stage: 'FOLLOW_UP' });
    const { update } = setup(opportunity);
    const detail = await update.execute(ID, { estimatedValue: 2000 });
    expect(detail.opportunity.items).toEqual(opportunity.items);
  });
});
