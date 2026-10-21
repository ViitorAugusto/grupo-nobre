# Fase 2 — Kanban

Objetivo: o vendedor abre o CRM e vê, em segundos, o que precisa trabalhar hoje.

Referências: [ADR-005](../decisoes/ADR-005-comportamento-do-kanban.md), [ADR-002](../decisoes/ADR-002-precisa-de-atencao.md), [identidade visual](../referencias/identidade-visual-nobre.md).

## Épico E4 — Quadro de oportunidades

### H4.1 Ver o Kanban (Must)

*Como vendedor, quero ver todas as oportunidades por etapa para entender meu funil de relance.*

- **Dado** o seed carregado, **quando** abro o CRM, **então** vejo 6 colunas, cada card na sua etapa, e o cabeçalho com quantidade e valor total.
- Em cada coluna, os cards com atenção aparecem primeiro.

### H4.2 Arrastar card entre etapas (Must)

*Como vendedor, quero arrastar o card para atualizar a etapa sem preencher formulário.*

- **Dado** a OPP-2005 em Forecast, **quando** arrasto para Fechamento, **então** ela muda de coluna e o histórico ganha um registro.
- **Dado** a OPP-2003 em Follow-up, **quando** arrasto para Fechamento, **então** o card volta e vejo "Fechamento só pode ser aplicado a partir de Forecast."
- **Dado** a OPP-2001 em Primeiro Contato (com valor e item), **quando** arrasto para Apresentação de Orçamento, **então** é aceito.
- **Dado** a OPP-2006 em Fechamento, **então** não consigo arrastá-la.
- **Dado** uma falha de rede no movimento, **então** o card volta e vejo uma mensagem com "Tentar novamente".

### H4.3 Marcar como perdida pelo quadro (Must)

*Como vendedor, quero registrar a perda e o motivo no mesmo gesto.*

- **Quando** solto um card em Perdida, **então** abre a escolha do motivo ("Outro" exige texto).
- **Quando** confirmo, **então** o card vai para Perdida.
- **Quando** cancelo, **então** o card volta para a origem.

### H4.4 Buscar e filtrar (Must)

*Como vendedor, quero filtrar o quadro para ver só o que é meu ou só o que está urgente.*

- Busca por código ou empresa, filtro por vendedor e botão "Só precisa de atenção", combináveis.
- **Dado** vendedor = Carla e "Só atenção", **então** vejo apenas a OPP-2004.
- Filtros ativos visíveis, com "Limpar filtros".

### H4.5 Destaque de "precisa de atenção" (Must)

*Como vendedor, quero que o card urgente salte aos olhos e diga o motivo.*

- OPP-2002, OPP-2003 e OPP-2004 mostram o selo com os motivos do ADR-002.
- O destaque usa ícone e texto, não só cor.
- O front não calcula atenção: exibe o que a API retorna.

### H4.6 Detalhe da oportunidade (Must)

*Como vendedor, quero abrir uma oportunidade e ver tudo dela, inclusive o caminho que fez.*

- Mostra dados comerciais, itens, alertas com motivo e histórico cronológico.
- Ações: Registrar contato, Mover para…, Marcar como perdida.
- **Quando** registro contato na OPP-2002, **então** "9 dias sem contato" some e "proposta vencida" continua.

### H4.7 Estados de carregamento, erro e vazio (Must)

*Como vendedor, quero sempre entender o que a tela está fazendo.*

| Estado | O que o vendedor vê |
| --- | --- |
| Carregando | Esqueleto das colunas e cards, sem a tela "pular" |
| Erro ao carregar | Mensagem clara e "Tentar novamente" |
| Coluna vazia | "Nenhuma oportunidade nesta etapa" |
| Filtro sem resultado | "Nenhuma oportunidade com esses filtros" e "Limpar filtros" |
| Sem oportunidades | Quadro vazio com mensagem, sem quebrar o layout |
| Precisa de atenção | Selo com ícone, texto e motivo (H4.5) |

### H4.8 Mover sem arrastar (Should)

*Como vendedor no celular, quero mover a oportunidade por um botão.*

- "Mover para…" lista os destinos e respeita as mesmas regras e mensagens do arraste.

### H4.9 Editar dados comerciais na tela (Should)

Depende da H2.4.

### H4.10 Layout responsivo (Could)

No celular, o quadro rola na horizontal, coluna a coluna.

## Fora de escopo (Won't)

Dashboards e métricas, criação pela tela (só se a H2.5 entrar), reabrir estado final, edição em massa, login.

---

## Handoff — Para o Frontend

**Construir:** H4.1–H4.8, conforme o ADR-005. H4.9 e H4.10 só se sobrar tempo.

**Regras:**

- A API é a autoridade. O front mostra destinos válidos e alertas, mas não decide.
- Toda recusa exibe a mensagem da API e devolve o card à origem.
- Soltar em Perdida sempre pede o motivo.
- A data de referência fica visível no topo.
- Visual segue a [identidade da Nobre Brindes](../referencias/identidade-visual-nobre.md), só com tokens semânticos e temas claro e escuro.

**Pronto quando:**

- Os 5 cenários da H4.2 funcionam com o seed.
- Os 6 estados da H4.7 podem ser demonstrados.
- O filtro "Carla + só atenção" retorna só a OPP-2004.
- Os alertas batem com a tabela do ADR-002.

**Não fazer:**

- Calcular atenção ou validar transição como regra final no front.
- Telas fora do backlog (dashboard, login, relatórios).
- Indicar atenção só por cor.
- Deixar o card no destino quando a API recusar.

**Depende da Fase 1:** listagem com filtros e atenção, detalhe com histórico, mudança de etapa, marcar perdida, registrar contato, destinos válidos por oportunidade.
