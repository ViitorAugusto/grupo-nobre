# Design patterns — receitas a preferir neste projeto

Padrão é meio, não fim: se a solução simples resolve, não force (YAGNI).

## Repository + porta (Adapter) — isolar o banco

Casos de uso dependem de `abstract class OpportunityRepository` (em `application/`). Quem implementa é `PrismaOpportunityRepository` (em `infra/`), ligado no módulo. Nos testes de caso de uso, use uma implementação em memória.

- A **atomicidade** fica dentro do repositório: `saveStageChange(opportunity, historyEntry)` usa `prisma.$transaction`. O caso de uso não conhece transação.

## Singleton via injeção de dependência — recursos únicos

`PrismaService` (uma conexão), `ReferenceDateProvider` (um "hoje") e a configuração são providers do Nest, criados uma vez. Ninguém faz `new PrismaClient()` nem lê `process.env` fora de `config/`.

## Strategy / lista de regras — atenção A1–A4

Cada regra de atenção é uma função com o **mesmo contrato**: `(oportunidade, hoje, parâmetros) => AttentionReason | null`. O cálculo percorre a lista. Regra nova (ex.: SLA) = mais um item, sem tocar nas outras. A prioridade da fila usa o código da regra (A3 → A1 → A4 → A2).

## Tabela de decisão — matriz de transições

A matriz do ADR-001 é um dado (`Record<Stage, Stage[]>`) mais os requisitos por destino (orçamento, motivo). A mesma tabela gera `allowedTransitions` para o front. Uma fonte, dois usos.

## Presenter / Mapper — fronteiras

- `infra/*.mapper.ts`: linha do Prisma ↔ entidade do domínio (`Decimal` → `number`, `Date` → `CalendarDate`).
- `http/*.presenter.ts`: entidade + atenção → JSON do contrato. O controller nunca monta JSON à mão.

## Factory — criação padronizada

Entidades e entradas de histórico nascem por função criadora que garante os campos obrigatórios (`createStageHistoryEntry({ from, to, lossReason })`). O seed usa as mesmas funções.

## Optimistic update com rollback (front)

`useMutation` do React Query: move o card na hora, e em erro devolve à origem e mostra a mensagem da API. Em sucesso, invalida a lista e o detalhe.

## Anti-padrões (rejeitar em review)

- Interface para algo com uma única implementação e nenhuma segunda prevista (exceção: portas de repositório e de data, que têm a implementação de teste).
- `utils.ts` genérico crescendo sem tema: cada helper vai para o módulo do seu assunto.
- Regra duplicada entre API e front, ou entre Kanban e fila.
