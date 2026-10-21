---
name: dominio-crm
description: Regras de negócio do CRM da Nobre Brindes — etapas do funil, matriz de transições, motivo de perda, regra de "precisa de atenção" (A1–A4), parâmetros (data de referência, 5 e 7 dias), dados do seed e Fila de retorno do dia. Use SEMPRE que for criar, alterar, testar ou revisar qualquer coisa que envolva oportunidades, etapas, histórico, alertas, seed, Kanban ou a automação de follow-up.
---

# Domínio do CRM — Nobre Brindes

Esta skill é o resumo operacional das decisões de produto. A fonte completa está em `docs/decisoes/`. **Em caso de dúvida ou conflito, o ADR vence.** Nunca invente uma regra nova: se faltar regra, pare e pergunte ao P.O.

## Vocabulário

- **Oportunidade:** uma negociação com uma empresa. Código no formato `OPP-0000`.
- **Item:** brinde + quantidade. Uma oportunidade tem 1 ou mais itens (ADR-004).
- **Valor estimado:** informado pelo vendedor. **Não** é a soma dos itens.
- **Validade da proposta:** até quando o preço enviado vale.
- **Data do evento:** quando o cliente precisa dos brindes.
- **Data de referência:** o "hoje" do sistema. É configurável. Padrão de demonstração: **15/10/2026**.

## Etapas

Ordem: Primeiro Contato → Apresentação de Orçamento → Follow-up → Forecast → Fechamento. Além disso: Perdida.
Fechamento e Perdida são **estados finais**.

## Transições permitidas (ADR-001)

| De | Pode ir para |
| --- | --- |
| Primeiro Contato | Apresentação de Orçamento ¹, Perdida ² |
| Apresentação de Orçamento | Follow-up, Perdida ² |
| Follow-up | Forecast, Apresentação de Orçamento ¹ (revisão), Perdida ² |
| Forecast | Fechamento, Follow-up (esfriou), Apresentação de Orçamento ¹ (revisão), Perdida ² |
| Fechamento | nada (final) |
| Perdida | nada (final) |

¹ Exige valor estimado e pelo menos 1 item.
² Exige motivo: Preço, Prazo, Concorrência, Cliente desistiu, Sem resposta ou Outro. "Outro" exige texto.

- Qualquer outra transição é recusada, com uma mensagem que diz qual regra foi violada.
- Mover para a mesma etapa não faz nada e não gera histórico.
- Toda mudança de etapa grava histórico (quando, de onde, para onde, motivo). Mudança e histórico acontecem juntos ou nenhum acontece.
- Estado final não reabre e não pode ser editado.
- A partir de Apresentação de Orçamento, valor estimado e pelo menos 1 item são obrigatórios também na edição (não podem ser removidos).
- Mensagem de Fechamento fora de Forecast: "Fechamento só pode ser aplicado a partir de Forecast."
- Textos de A3: "Evento hoje", "Evento amanhã", "Evento em X dias", "Evento já passou há X dias". Singular quando X = 1 em todas as mensagens.

## "Precisa de atenção" (ADR-002)

Só para etapas **não finais**. Precisa de atenção se tiver pelo menos uma condição:

| Regra | Condição | Mensagem |
| --- | --- | --- |
| A1 | Validade < data de referência, em Apres. Orçamento, Follow-up ou Forecast | "Proposta vencida há X dias" |
| A2 | Mais de **5** dias desde o último contato | "X dias sem contato" |
| A3 | **7** dias ou menos até o evento | "Evento em X dias" |
| A4 | Validade posterior ao evento | "Validade após o evento" |

Bordas: 5 dias sem contato não dispara (6 dispara). 7 dias até o evento dispara. Evento já passado em etapa não final dispara ("Evento já passou há X dias"). Validade igual a hoje não está vencida. Campo em branco: a regra que depende dele não se aplica.

- O cálculo existe **num lugar só** (backend) e é consumido por API, Kanban e automação. O front não recalcula.
- Datas incoerentes geram alerta, **nunca** bloqueio.

## Fila de retorno do dia (ADR-003)

- Para cada vendedor: as oportunidades que precisam de atenção.
- Ordem pelo motivo mais prioritário: A3 → A1 → A4 → A2. Empate: maior valor estimado, depois código crescente.
- Cada oportunidade entra uma vez só, listando todos os motivos.
- Contato registrado na data de referência tira o item da fila **do dia**, mesmo que ainda haja outro alerta. No dia seguinte ele volta se ainda precisar de atenção.
- Sai também ao ir para estado final ou quando a causa é resolvida.
- Gerar a fila duas vezes para a mesma data dá o mesmo resultado (idempotente).
- O envio ao vendedor é simulado (texto registrado), sem e-mail real.

## Dados do seed e resultado esperado (hoje = 15/10/2026)

| Código | Empresa | Etapa | Atenção | Motivos |
| --- | --- | --- | --- | --- |
| OPP-2001 | Tech Alpha Ltda | Primeiro Contato | Não | – (30/11 é o evento, sem validade) |
| OPP-2002 | Construtora Horizonte | Apres. Orçamento | Sim | A1 (2 dias), A2 (9 dias) |
| OPP-2003 | Clínica Vida | Follow-up | Sim | A3 (3 dias), A4 |
| OPP-2004 | Agência Pulso | Follow-up | Sim | A1 (5 dias), A2 (13 dias) |
| OPP-2005 | Banco Norte | Forecast | Não | – |
| OPP-2006 | Escola Saber | Fechamento | Não (final) | – |
| OPP-2007 | Padaria do Bairro | Perdida | Não (final) | Motivo "Não registrado (dado legado)" |

Fila do dia esperada: Ana → OPP-2003. Bruno → OPP-2002. Carla → OPP-2004.

## Proibições

- Regra de negócio só no front.
- Usar a data real do sistema na demonstração ou nos testes.
- Bloquear o seed pelo dado legado da OPP-2007.
- Criar regra, etapa, transição ou motivo que não esteja nos ADRs.
- Tratar premissa nossa como fato do Grupo Nobre (ver `docs/decisoes/premissas.md`).
