# ADR-005 — Comportamento do Kanban

**Status:** Aceito

## Contexto

O case pede um Kanban com uma coluna por etapa e cards arrastáveis, com estados claros de carregamento, erro, vazio e "precisa de atenção". Não define ordem, conteúdo do card nem o que acontece quando um movimento é recusado.

## Decisão

| Tema | Decisão | Por quê |
| --- | --- | --- |
| Colunas | 6 colunas: as 5 etapas e **Perdida** por último. Fechamento e Perdida ficam visualmente atenuadas | Uma coluna por etapa. Perdida precisa de um lugar para soltar o card |
| Cards finais | Fechamento e Perdida **não são arrastáveis** | Coerente com o ADR-001 (sem reabertura) |
| Ordem na coluna | Primeiro os que precisam de atenção, depois o evento mais próximo | Responde à pergunta-chave do case |
| Cabeçalho da coluna | Quantidade de cards e soma dos valores estimados | Noção do funil sem criar dashboard |
| Conteúdo do card | Código, empresa, valor, vendedor, brinde principal ("+N itens"), dias sem contato, selo de atenção com o motivo principal ("+1" se houver mais) | O vendedor decide sem abrir o card |
| Movimento recusado | O card volta para a origem e aparece a mensagem da API | O vendedor nunca vê um estado falso |
| Soltar em Perdida | Abre a escolha do motivo. Cancelar devolve o card | A regra exige motivo |
| Data de referência | Topo da tela: "Hoje: 15/10/2026 (demonstração)" | Evita estranhamento com os alertas |
| Alternativa ao arraste | Botão "Mover para…" no card e no detalhe | Acessibilidade e uso no celular |
| Selo de atenção | Ícone e texto, não só cor | Acessibilidade |

## Consequências

- O front pode mostrar os destinos válidos durante o arraste, mas a API decide. É necessário que o front conheça os destinos válidos **sem duplicar a regra** (o como é decisão do Tech Lead).
- O front exibe a atenção calculada pelo backend e não a recalcula.
