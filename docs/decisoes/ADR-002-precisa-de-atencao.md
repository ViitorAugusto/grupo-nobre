# ADR-002 — Regra de "precisa de atenção"

**Status:** Aceito

## Contexto

O case pede um estado claro de "precisa de atenção", mas não o define. A pergunta-chave de UX é: *o vendedor encontra rápido a negociação que precisa trabalhar hoje?*

## Opções consideradas

1. Só um critério (por exemplo, dias sem contato).
2. Pontuação numérica de risco.
3. Um conjunto pequeno de regras objetivas, cada uma com um motivo legível.

## Decisão

Opção 3. A regra vale apenas para **etapas não finais**. Uma oportunidade precisa de atenção se tiver **pelo menos uma** condição:

| Regra | Quando dispara | Mensagem |
| --- | --- | --- |
| A1 Proposta vencida | Validade anterior à data de referência, em Apresentação de Orçamento, Follow-up ou Forecast | "Proposta vencida há X dias" |
| A2 Sem contato | Mais de 5 dias desde o último contato | "X dias sem contato" |
| A3 Evento próximo | Faltam 7 dias ou menos para o evento | "Evento em X dias" |
| A4 Datas incoerentes | Validade da proposta posterior à data do evento | "Validade após o evento" |

Os parâmetros (5 e 7 dias, data de referência) estão em [premissas.md](premissas.md).

### Casos de borda

| Situação | Comportamento |
| --- | --- |
| Exatamente 5 dias sem contato | A2 não dispara (precisa ser mais de 5) |
| Exatamente 7 dias até o evento | A3 dispara (7 ou menos) |
| Evento já passou e a etapa não é final | A3 dispara com a mensagem "Evento já passou há X dias" |
| Validade igual à data de referência | A1 não dispara (a proposta ainda vale hoje) |
| Sem validade | A1 e A4 não se aplicam |
| Sem data do evento | A3 e A4 não se aplicam |
| Sem último contato | A2 não se aplica. Lead nunca contatado é o problema 1 (SLA), registrado como evolução |

### Textos das mensagens

- A3: "Evento hoje" (0 dias), "Evento amanhã" (1 dia), "Evento em X dias" (2 a 7), "Evento já passou há 1 dia" / "há X dias".
- Singular sempre que X = 1: "Proposta vencida há 1 dia", "1 dia sem contato".

## Resultado esperado com os dados do case (hoje = 15/10/2026)

Esta tabela é caso de teste obrigatório.

| Código | Precisa de atenção? | Motivos |
| --- | --- | --- |
| OPP-2001 | Não | – |
| OPP-2002 | Sim | A1 (vencida há 2 dias), A2 (9 dias sem contato) |
| OPP-2003 | Sim | A3 (evento em 3 dias), A4 (validade 20/10 após evento 18/10) |
| OPP-2004 | Sim | A1 (vencida há 5 dias), A2 (13 dias sem contato) |
| OPP-2005 | Não | – |
| OPP-2006 | Não (estado final) | – |
| OPP-2007 | Não (estado final) | – |

## Justificativa

- Cada regra corresponde a um risco real de perder a venda e é testável.
- O **motivo** vale mais que a cor: diz ao vendedor o que fazer.
- A pontuação numérica foi descartada por ser difícil de explicar e de validar.

## Consequências

- A atenção é calculada **num lugar só**, consumido pela API, pelo Kanban e pela automação.
- Datas incoerentes geram alerta, não bloqueio. Assim o seed não quebra e o vendedor corrige o dado.
- A OPP-2006 (Fechamento, evento em 17/10) fica de fora: o risco é da produção, não do vendedor. Um alerta "entrega apertada" é *Could*.
