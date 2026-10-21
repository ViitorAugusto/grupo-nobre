# Clean Architecture — quem pode falar com quem

Aplicada a este monorepo: **API NestJS separada** (`apps/api`) + **Next.js** (`apps/web`) + PostgreSQL via Prisma. Regra central: **as dependências apontam para dentro**, em direção ao domínio. O domínio não conhece Nest, Prisma, HTTP nem React.

## Backend (`apps/api/src`)

| Camada | Pasta | Papel | Pode importar |
| --- | --- | --- | --- |
| Domínio | `modules/<feature>/domain/`, `shared/domain/` | Entidades, enums, regras puras (matriz de transições, atenção A1–A4, prioridade da fila), erros de domínio | Só outros arquivos de `domain/` e `shared/domain/`. **Nada** de `@nestjs/*`, Prisma, `class-validator`, `new Date()` |
| Aplicação | `modules/<feature>/application/` | Casos de uso (um por arquivo: `move-stage.use-case.ts`), portas (`abstract class OpportunityRepository`), tipos de saída | Domínio + `@Injectable()` do Nest. Nada de Prisma ou Express |
| Infra | `modules/<feature>/infra/`, `shared/infra/` | Repositórios Prisma que implementam as portas, mappers Prisma ↔ domínio, agendador (cron) | Aplicação, domínio, Prisma |
| HTTP | `modules/<feature>/http/` | Controllers, DTOs de entrada (`class-validator`), presenters (domínio → JSON do contrato) | Aplicação (casos de uso) e tipos do domínio. Nunca Prisma nem repositório |
| Composição | `modules/<feature>/<feature>.module.ts`, `app.module.ts` | Liga porta → implementação (`{ provide: OpportunityRepository, useClass: PrismaOpportunityRepository }`) | Tudo |

- `config/` valida o ambiente e fornece a **data de referência** (`ReferenceDateProvider`). Regras e casos de uso recebem "hoje" desse provedor, nunca de `new Date()`.
- O cliente Prisma gerado (`src/generated/prisma`) só é importado em `infra/`.
- Módulos de feature: `opportunities` (Fase 1) e `follow-up-queue` (Fase 3). A fila **reusa** o cálculo de atenção de `opportunities/domain`, não cria outro.

### Onde vive cada regra do case

| Regra | Lugar único |
| --- | --- |
| Matriz de transições (ADR-001), requisitos de orçamento e motivo de perda | `opportunities/domain` (função pura) |
| Atenção A1–A4 (ADR-002) | `opportunities/domain` (função pura que recebe a oportunidade, "hoje" e os parâmetros) |
| Etapa + histórico gravados juntos | Porta do repositório com um método só (ex.: `saveStageChange`) implementado com `prisma.$transaction` |
| Prioridade e desempate da fila (ADR-003) | `follow-up-queue/domain` |

## Frontend (`apps/web/src`)

| Camada | Pasta | Papel |
| --- | --- | --- |
| Rotas | `app/` | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`. Finas: só compõem features |
| Features | `features/<feature>/` (`kanban`, `opportunity-detail`, `follow-up-queue`) | `components/`, `hooks/` (React Query), `api/` (chamadas da feature) |
| Compartilhado | `shared/api/` (cliente HTTP + tipos do contrato), `shared/ui/` (peças base shadcn), `shared/components/` (peças do produto), `shared/lib/` (formatação pt-BR, `cn`) | Usado por várias features |
| Providers | `providers/` | React Query, tema, toaster |

- O front fala com o backend **só pelo cliente HTTP** de `shared/api/`, com os tipos de `docs/api/contrato-api.md`.
- O front **não decide regra**: atenção, motivos, destinos válidos (`allowedTransitions`) e ordem dos cards e da fila vêm da API. Pode usar `allowedTransitions` para destacar destinos durante o arraste, mas quem aceita ou recusa é a API.

## A linguagem comum

Dados atravessam fronteiras como **tipos do domínio** (Opportunity, Stage, AttentionReason). Linha crua do Prisma nunca sai de `infra/`; JSON da API é montado pelo presenter. Datas de negócio são `CalendarDate` (`AAAA-MM-DD`, `shared/domain/calendar-date.ts`).

## Sinais de violação (rejeitar em review)

- `import ... from '@nestjs/...'` ou do Prisma dentro de `domain/`.
- Controller chamando `PrismaService` ou com `if` de regra de negócio.
- `new Date()` decidindo regra (deve usar `ReferenceDateProvider`).
- Componente React calculando atenção, dias, prioridade ou validando transição.
- Resposta da API com nome de coluna do banco ou objeto Prisma cru.
