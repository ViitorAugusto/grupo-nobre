---
name: testes
description: Estratégia e padrão de testes do CRM da Nobre Brindes — pirâmide (domínio puro → caso de uso → e2e HTTP com PostgreSQL de teste → componente React), Vitest, Supertest e Testing Library, data de referência fixa, nomes em português, cobertura obrigatória das regras do funil (matriz ADR-001, A1–A4, seed, fila T1–T12). Use SEMPRE que for criar, alterar, rodar ou revisar testes, ou ao implementar regra de negócio no backend ou componente com estado no frontend.
---

# Testes

Objetivo: provar as **regras críticas do case** de forma que a banca leia o teste e entenda a regra. Ferramentas: **Vitest** (rápido, ESM nativo, mesma ferramenta no back e no front), **Supertest** (HTTP real do Nest), **Testing Library** (componente pelo que o usuário vê).

## Pirâmide

| Nível | Onde | O que prova | Banco | Comando |
| --- | --- | --- | --- | --- |
| Domínio (maioria) | `apps/api/src/**/domain/*.spec.ts` | Matriz de transições, A1–A4 e bordas, prioridade da fila | Não | `npm test -w api` |
| Caso de uso | `apps/api/src/**/application/*.spec.ts` | Orquestração: recusa não grava, histórico junto da etapa, idempotência | Repositório em memória | `npm test -w api` |
| e2e HTTP | `apps/api/test/*.e2e-spec.ts` | Contrato (status, formato de erro), seed, atomicidade real, filtros | PostgreSQL `crm_nobre_test` | `npm run test:e2e` |
| Componente | `apps/web/src/**/*.test.tsx` | Estados da H4.7, card volta na recusa, diálogo de perda | Não (API simulada) | `npm test -w web` |

## Regras

1. **Data fixa sempre.** Nunca `new Date()` em teste nem no código testado. Domínio recebe `today`; caso de uso recebe um `ReferenceDateProvider` fixo; e2e usa `REFERENCE_DATE=2026-10-15`.
2. **Dados do case como fixture.** Prefira OPP-2001…2007 (com os valores de `docs/referencias/dados-do-case.md`) para que o teste fale a língua do ADR. Para bordas, monte a oportunidade mínima com uma factory (`buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-10' })`).
3. **Nome = regra, em português.** `it('não dispara A2 com exatamente 5 dias sem contato')`. Agrupe por regra com `describe('A2 — sem contato')`.
4. **Tabela para matrizes.** A matriz do ADR-001 tem 36 células: use `it.each` com a tabela inteira (✅ e ❌), não 36 testes copiados.
5. **Um comportamento por teste**, padrão Arrange / Act / Assert. Sem lógica (if/loop) dentro do teste.
6. **e2e isolado:** banco de teste próprio (nunca o da demonstração), dados recriados no `beforeEach` (truncate + seed), arquivos em sequência (`fileParallelism: false`). A API do teste é montada com o mesmo `configureApp()` do `main.ts`.
7. **Front:** teste o que o vendedor vê (`getByRole`, `getByText`), não detalhe de implementação. Simule a API no nível do `fetch`/cliente HTTP.
8. **Teste que falha é reportado como falha.** Nunca use `.skip`, `.only` ou asserção enfraquecida para "passar". `.only` quebra a CI.

## Cobertura obrigatória (critério de pronto)

| Regra | Nível | Origem |
| --- | --- | --- |
| Cada célula ✅/❌ da matriz de transições | Domínio | Fase 1 |
| Requisitos de Apres. Orçamento (sem valor, sem item, sem os dois), inclusive nos retornos | Domínio + e2e | ADR-001 ¹ |
| Perdida sem motivo, "Outro" sem texto, `NAO_REGISTRADO` na entrada | Domínio + e2e | ADR-001 ² |
| Mesma etapa = sem histórico; estado final não muda | Caso de uso | ADR-001 |
| Etapa e histórico atômicos (falha no histórico não muda a etapa) | Caso de uso + e2e | H1.1 |
| A1–A4 e todas as bordas do ADR-002 (5/6 dias, 7/8 dias, evento passado, validade = hoje, campos em branco) | Domínio | ADR-002 |
| Os 7 casos do seed batem com a tabela do contrato | e2e | ADR-002 |
| Filtros combinados (Carla + atenção = só OPP-2004), busca sem resultado = lista vazia | e2e | H2.1 |
| Formato único de erro (400, 404, 422) | e2e | H3.3 |
| T1–T12 da fila | Domínio + e2e | Fase 3 |

Cobertura de linhas não é meta; a tabela acima é. `npm run test:cov -w api` mostra a cobertura de `domain/` e `application/`.

## Exemplo (domínio)

```ts
describe('A2 — sem contato', () => {
  const today = parseCalendarDate('2026-10-15');

  it('não dispara com exatamente 5 dias sem contato', () => {
    const opp = buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-10' });
    expect(attentionFor(opp, today, PARAMS).reasons).toEqual([]);
  });

  it('dispara com 6 dias sem contato', () => {
    const opp = buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-09' });
    expect(attentionFor(opp, today, PARAMS).reasons).toEqual([
      { rule: 'A2', code: 'SEM_CONTATO', message: '6 dias sem contato', days: 6 },
    ]);
  });
});
```

## Quando rodar

- Hook do Claude Code ao encerrar a tarefa: typecheck + testes unitários do app alterado.
- `git push`: typecheck + testes unitários dos dois apps (hook `pre-push`).
- CI: lint, typecheck, unitários e **e2e com PostgreSQL** a cada push e PR.
