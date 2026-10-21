# Padrões de componente — CRM Nobre Brindes

Exemplos em JSX + Tailwind v4 só com tokens. Cada padrão vira um componente em `shared/components/` ou na feature; as telas usam o componente em vez de repetir classes.

## Cabeçalho da tela com data de referência

```tsx
<header className="flex flex-col gap-3 border-b bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-2xl font-bold">Oportunidades</h1>
  <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs text-info">
    <CalendarDays className="size-4" aria-hidden /> Hoje: 15/10/2026 (demonstração)
  </span>
</header>
```

## Coluna do Kanban

```tsx
<section aria-label="Follow-up" className="flex w-72 shrink-0 flex-col rounded-xl bg-secondary">
  <header className="flex items-baseline justify-between px-3 py-2">
    <h2 className="text-sm font-semibold">Follow-up <span className="text-muted-foreground">· 2</span></h2>
    <span className="font-data text-xs tabular-nums text-muted-foreground">R$ 11.100,00</span>
  </header>
  <ol className="flex flex-col gap-2 p-2">{/* cards na ordem da API */}</ol>
</section>
```

- Colunas finais (Fechamento, Perdida): `opacity-80` no conteúdo e sem alça de arraste nos cards.
- Destino válido durante o arraste (de `allowedTransitions`): `ring-2 ring-primary`. Destino inválido: sem destaque (a API ainda decide).

## Card de oportunidade

```tsx
<article className="rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40">
  <div className="flex items-start justify-between gap-2">
    <span className="font-data text-xs font-medium text-muted-foreground">OPP-2002</span>
    <span className="font-data text-sm font-semibold tabular-nums">R$ 9.800,00</span>
  </div>
  <p className="mt-1 text-sm font-medium">Construtora Horizonte</p>
  <p className="text-xs text-muted-foreground">Kit escritório · Bruno · 9 dias sem contato</p>
  {/* AttentionBadge com o motivo principal + "+1" */}
</article>
```

Conteúdo mínimo (ADR-005): código, empresa, valor, vendedor, brinde principal ("+N itens"), dias sem contato, selo de atenção.

## Selo de atenção (`AttentionBadge`)

```tsx
<span className="mt-2 inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
  <AlertTriangle className="size-3.5" aria-hidden />
  Proposta vencida há 2 dias
  <span className="text-warning/80">+1</span>
</span>
```

- Texto = `attention.reasons[0].message` da API (já vem na ordem de prioridade). "+N" = demais motivos, listados no `title`/tooltip e no detalhe.
- Ícone + texto sempre. Nunca só a cor.

## Diálogo de motivo de perda

- Abre ao soltar em Perdida ou pela ação "Marcar como perdida". Lista os motivos de `GET /meta` (`RadioGroup`). "Outro" mostra `Textarea` obrigatório.
- Rodapé: "Cancelar" (`outline`, devolve o card) à esquerda e "Marcar como perdida" (`destructive`) à direita.
- Erro da API aparece dentro do diálogo em `text-destructive text-xs`.

## "Mover para…"

`DropdownMenu` com os destinos de `allowedTransitions` (rótulos de `GET /meta`). Perdida abre o diálogo de motivo. Mesmas mensagens de erro do arraste.

## Barra de filtros

```tsx
<div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
  {/* Input com ícone Search: "Buscar por código ou empresa" */}
  {/* Select de vendedor (Todos, Ana, Bruno, Carla) */}
  {/* Toggle "Só precisa de atenção": ligado = bg-accent text-accent-foreground */}
  {/* "Limpar filtros" variant="ghost", só aparece com filtro ativo */}
</div>
```

## Fila de retorno do dia (item)

```tsx
<li className="flex items-start gap-3 rounded-lg border bg-card p-3">
  <span className="font-data flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium"><span className="font-data text-muted-foreground">OPP-2002</span> · Construtora Horizonte</p>
    {/* todos os motivos como AttentionBadge */}
  </div>
  {/* Button size="sm": "Registrar contato" */}
</li>
```

A ordem vem da API (`position`). O front não reordena.

## Estados (H4.7)

```tsx
// Vazio (coluna, filtro, fila)
<div className="flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center">
  <Inbox className="mb-2 size-6 text-muted-foreground" aria-hidden />
  <p className="text-sm font-medium">Nenhuma oportunidade com esses filtros</p>
  {/* ação opcional: <Button variant="outline" size="sm">Limpar filtros</Button> */}
</div>

// Erro
<div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
  <span className="flex items-center gap-2"><AlertCircle className="size-4" aria-hidden />Não foi possível carregar as oportunidades.</span>
  <Button variant="outline" size="sm" onClick={retry}>Tentar novamente</Button>
</div>
```

- Carregando: `Skeleton` (`bg-muted animate-pulse`) com a **mesma forma** das colunas e cards, para a tela não pular. Sem spinner de tela cheia.
- Ação em andamento: `Loader2 animate-spin` + texto ("Movendo…") e botão desabilitado.

## Toast

`sonner`, um `<Toaster richColors position="top-right" />` no layout. Sucesso curto ("OPP-2005 movida para Fechamento"). Recusa da API: mensagem da API, sem jargão técnico. Falha de rede: "Sem conexão com o servidor" + ação "Tentar novamente".
