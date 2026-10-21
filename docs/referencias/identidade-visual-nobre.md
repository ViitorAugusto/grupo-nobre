# Identidade visual — Nobre Brindes

Fonte: CSS público do site [nobrebrindes.com.br](https://www.nobrebrindes.com.br/), consultado em 20/10/2026. As cores são da marca. As adaptações feitas por nós estão marcadas como tal.

Dono da aplicação no código: Frontend, com o método da skill de design system (só tokens semânticos, temas claro e escuro obrigatórios).

## Cores da marca

| Papel | Tema claro | Tema escuro | Nome no site |
| --- | --- | --- | --- |
| Fundo | `#f8fdfa` | `#0a0a0a` | paper |
| Cartão / superfície | `#ffffff` | `#202920` | surface / paper-shade |
| Superfície secundária | `#f3f8f5` | `#202920` | paper-shade |
| Texto principal | `#174f2d` | `#fafafa` | ink |
| Texto secundário | `#4c7660` | `#a1a1a1` | ink-soft |
| Ação principal (primary) | `#247042` | `#75d19a` | forest |
| Texto sobre a ação principal | `#ffffff` | `#0a0a0a` | primary-foreground |
| Destaque suave (accent) | `#ddf8e8` | `#254632` | moss |
| Verde da marca | `#62e590` | `#62e590` | sprout (também a theme-color do site) |
| Dourado (detalhe) | `#d5c27f` | `#d5c27f` | crown |
| Erro (destructive) | `#e40014` | `#ff6568` | destructive |
| Borda | `#e5e5e5` | branco a 10% | border |
| Input | `#d4d4d4` | branco a 15% | input |
| Gráficos | `#247042`, `#318151`, `#569f73`, `#4c7660`, `#174f2d` | — | chart-1…5 |

## Tipografia e forma

- Títulos: **Archivo**
- Texto: **Poppins**
- Especificações e dados técnicos: **Montserrat**
- Raio base: `0.375rem` (cantos levemente arredondados)

## Lacunas da marca (adaptação nossa)

O site não define tokens de **atenção (warning)**, **sucesso (success)** e **informação (info)**. O CRM precisa deles, principalmente do warning para o selo "precisa de atenção".

- Criar esses tokens nos dois temas, harmonizados com a paleta.
- O dourado `#d5c27f` é candidato para o warning, mas tem pouco contraste sobre fundo claro. Precisa de um tom mais escuro para texto (contraste mínimo AA).
- Registrar no README que esses tokens são adaptação nossa, não da marca.
