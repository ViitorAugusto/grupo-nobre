# Componentização — telas montadas com peças pequenas

Regras para o Next.js deste projeto (`apps/web`). Visual: skill `design-system`.

## Hierarquia das peças

1. **`shared/ui/`** — peças base (shadcn sobre Radix: Button, Dialog, Select, Badge, Skeleton…). **Não editar a lógica**; variação visual se faz compondo por cima ou por `variant` com `cva`.
2. **`shared/components/`** — peças do produto usadas por 2+ features: `PageHeader`, `EmptyState`, `ErrorState`, `AttentionBadge`, `StageBadge`, `Money`, `ReferenceDateBanner`.
3. **`features/<feature>/components/`** — peças de uma feature: `KanbanBoard`, `KanbanColumn`, `OpportunityCard`, `LossReasonDialog`, `MoveToMenu`, `FollowUpQueueList`.
4. **`features/<feature>/hooks/`** — lógica de UI sem JSX: `useOpportunities(filters)`, `useMoveStage()`, `useRegisterContact()` (React Query).

## Quando extrair um componente

- O mesmo JSX em **2+ lugares** → componente com props (ex.: selo de atenção no card, no detalhe e na fila).
- Trecho com estado e comportamento próprios (diálogo de motivo de perda, menu "Mover para…") → componente, mesmo usado uma vez.
- Arquivo passando de ~250 linhas → procure blocos extraíveis.
- Lógica repetida sem JSX (debounce da busca, filtros na URL) → hook.

## Props e estado

- Props mínimas e nomeadas pelo domínio; callbacks `onAlgo` (`onMove`, `onConfirm`, `onCancel`).
- **Dados do servidor** só pelo React Query (cache, carregando, erro, nova tentativa). Não copie dados do servidor para `useState`.
- **Estado de UI** local (`useState`). Filtros que devem sobreviver ao recarregar ficam na URL (`searchParams`).
- Movimento no Kanban: atualização otimista com **rollback** quando a API recusa, exibindo a `message` do erro (ADR-005).
- Server Components por padrão; `'use client'` só onde há interação (quadro, diálogos, filtros).

## Nomenclatura

- Arquivos em kebab-case (`opportunity-card.tsx`); componentes em PascalCase; hooks `useAlgo`.
- Código em inglês alinhado ao contrato da API (`stage`, `attention`); **texto da tela em português** com acentuação correta.

## Acessibilidade (mínimo)

- Atenção sempre com **ícone + texto**, nunca só cor.
- Todo arraste tem alternativa por botão ("Mover para…"). Botões de ícone com `aria-label`.

## Sinais de violação

- Componente calculando atenção, dias sem contato, prioridade ou validando transição → isso vem da API.
- `fetch` direto em componente → usar hook da feature + cliente de `shared/api/`.
- Componente com 10+ props → dividir ou agrupar.
- JSX copiado entre features com pequenas diferenças → peça compartilhada.
