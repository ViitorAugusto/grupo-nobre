---
name: design-system
description: Design system do CRM da Nobre Brindes — tokens semânticos com a identidade da marca (verde forest, Archivo/Poppins/Montserrat), temas claro e escuro, tons de status com contraste AA (warning, success, info, destructive) e padrões de componente (coluna e card do Kanban, selo de atenção, diálogo de motivo de perda, fila de retorno, estados vazio/carregando/erro). Use SEMPRE que for criar, alterar ou revisar qualquer interface do apps/web, cor, fonte, tema, badge, card, formulário ou estado de tela.
---

# Design system — CRM Nobre Brindes

Método: só tokens semânticos, dois temas e padrões de componente reaproveitáveis. **Identidade: Nobre Brindes**. Fonte das cores: [docs/referencias/identidade-visual-nobre.md](../../../docs/referencias/identidade-visual-nobre.md). Fonte da verdade dos tokens: `apps/web/src/app/globals.css` (cópia em [references/tokens.css](references/tokens.css)).

## 1. Regra de ouro: só tokens semânticos

- Em componentes, use **apenas utilitários de token**: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-accent`, `text-warning`, `bg-warning/10`, `text-success`, `text-info`, `text-destructive`.
- **Proibido**: hex, paleta fixa do Tailwind (`bg-amber-100`, `text-green-700`), cor arbitrária (`bg-[#247042]`, `text-[var(--x)]`), `bg-white`/`text-black`, `style={{ color }}`.
- **Garantido por automação**: `npm run lint -w web` roda `scripts/check-design-tokens.mjs` e falha com cor fora de token.
- Precisa de cor nova? Crie o token **nos dois temas** + `@theme inline` em `globals.css`, atualize `references/tokens.css` e verifique contraste AA.
- **Dois temas obrigatórios** (`next-themes`, `attribute="class"`, `enableSystem`). Se precisou de `dark:`, falta um token.

## 2. Cores e papéis

| Papel | Token | Claro | Escuro | Origem |
| --- | --- | --- | --- | --- |
| Fundo / cartão | `background` / `card` | `#f8fdfa` / `#ffffff` | `#0a0a0a` / `#202920` | Marca |
| Texto / secundário | `foreground` / `muted-foreground` | `#174f2d` / `#4c7660` | `#fafafa` / `#a1a1a1` | Marca |
| Ação principal | `primary` | `#247042` (forest) | `#75d19a` | Marca |
| Destaque suave (hover, item ativo, filtro ligado) | `accent` | `#ddf8e8` (moss) | `#254632` | Marca |
| Decoração (logo, faixas) | `sprout`, `crown` | `#62e590`, `#d5c27f` | iguais | Marca — **nunca como cor de texto** |
| Atenção | `warning` | `#7d5c00` | `#d5c27f` | **Adaptação nossa** (dourado da marca escurecido no claro) |
| Sucesso | `success` | `#1e6b3c` | `#75d19a` | **Adaptação nossa** (derivado do forest) |
| Informação | `info` | `#1f6391` | `#7cc0e8` | **Adaptação nossa** |
| Erro / perigo | `destructive` | `#c20012` | `#ff6568` | Marca no escuro; no claro o `#e40014` da marca foi escurecido (4,09:1 → 5,30:1) |

**Contraste AA verificado** (≥ 4,5:1) para o texto do tom sobre `bg-{tom}/10` no card e para `*-foreground` sobre o tom sólido, nos dois temas. Valores no comentário de cada token.

**Tom de status** (selo, faixa de alerta, tile de ícone) usa sempre a mesma receita: `border-{tom}/30 bg-{tom}/10 text-{tom}`.

### Mapeamento do domínio (mesmo significado = mesma cor em toda tela)

| Significado | Tom |
| --- | --- |
| Precisa de atenção (A1–A4) | `warning` + ícone `AlertTriangle` + texto do motivo |
| Movimento recusado pela API, erro de carga | `destructive` |
| Movimento aceito, contato registrado | toast `success` |
| Data de referência ("Hoje: 15/10/2026 (demonstração)") | `info` |
| Fechamento (final) | coluna atenuada + selo `success` "Fechada" |
| Perdida (final) | coluna atenuada + selo neutro (`muted`) com o motivo |
| Etapas não finais | neutro; a etapa é dada pela coluna, não por cor |

## 3. Tipografia

- **Archivo** em títulos (`font-heading`, aplicado a `h1–h3`), **Poppins** no texto (`font-sans`, padrão), **Montserrat** em dados técnicos e números (`font-data`: código OPP, valores, datas). Carregadas com `next/font/google` no `layout.tsx`.
- Escala:

| Elemento | Classe |
| --- | --- |
| Título da tela | `text-2xl font-bold` |
| Título de coluna / seção | `text-sm font-semibold` |
| Texto do card | `text-sm` |
| Rótulo / auxiliar | `text-xs text-muted-foreground` |
| Código OPP | `font-data text-xs font-medium` |
| Dinheiro | `font-data tabular-nums` (formato `R$ 9.800,00`) |

- Moeda e datas sempre em pt-BR (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, `dd/MM/yyyy`). Interface em português com acentos.

## 4. Espaço, forma e elevação

- Raio da marca: `--radius: 0.375rem`. `rounded-md` em controles, `rounded-lg` em cards, `rounded-xl` em colunas e diálogos. Pílula só em selo.
- Cards: `border bg-card shadow-sm`. Sem gradientes nem sombras coloridas.
- Ícones: `lucide-react`, `size-4` inline.
- Alvos de toque ≥ 44px nas ações do celular (H4.8 / H4.10).

## 5. Padrões de componente

Use [references/componentes.md](references/componentes.md): coluna do Kanban, card de oportunidade, selo de atenção, diálogo de motivo de perda, "Mover para…", barra de filtros, fila de retorno, estados vazio/carregando/erro, toast. **Reaproveite antes de criar.**

## 6. Checklist antes de concluir uma tela

- [ ] `npm run lint -w web` passa (inclui a checagem de tokens).
- [ ] Conferida em **tema claro e escuro**.
- [ ] Atenção com ícone + texto + motivo; nunca só cor.
- [ ] Estados da H4.7 presentes (carregando, erro, vazio, filtro sem resultado).
- [ ] Moeda e datas pt-BR; `tabular-nums` em valores.
- [ ] Nada calculado no front que a API já entrega (atenção, ordem, destinos).
