# Premissas e parâmetros

O case não informa estes valores. Todos são **premissas nossas**, configuráveis, e devem aparecer assim no README.

## Parâmetros

| Parâmetro | Valor padrão | Usado em | Origem |
| --- | --- | --- | --- |
| Data de referência ("hoje") | 15/10/2026 no ambiente de demonstração | Todos os cálculos de data | Data de referência dos dados do case |
| Prazo mínimo de produção e entrega | 7 dias corridos antes do evento | Regra A3 (ADR-002) | Premissa nossa |
| Limite sem contato | mais de 5 dias corridos | Regra A2 (ADR-002) | Premissa nossa |

A data de referência precisa ser configurável. Sem isso, os alertas mudam conforme o dia em que alguém roda o projeto e deixam de bater com a documentação.

## Decisões sobre os dados do seed

| # | Situação | Decisão | Tipo |
| --- | --- | --- | --- |
| D1 | OPP-2001 tem só uma data (30/11) além do último contato | É a **data do evento**. Sem validade, coerente com Primeiro Contato (ainda não há proposta) | Premissa nossa |
| D2 | OPP-2007 está em Perdida **sem motivo**, o que viola a regra | Carregar com motivo **"Não registrado (dado legado)"**. A regra do motivo obrigatório vale para toda transição nova feita pela API | Decisão nossa |
| D3 | OPP-2003: validade (20/10) posterior ao evento (18/10) | Manter o dado e **sinalizar** (regra A4). Não bloquear | Decisão nossa |
| D4 | OPP-2006: em Fechamento com evento em 17/10 | Fora da regra de atenção (venda fechada). Registrar como limitação no README | Decisão nossa |

## O que o case diz (fatos)

- Etapas, em ordem: Primeiro Contato → Apresentação de Orçamento → Follow-up → Forecast → Fechamento. Além disso, Perdida.
- Fechamento e Perdida são estados finais.
- Só avança para Apresentação de Orçamento com valor estimado e pelo menos 1 item de brinde.
- Só entra em Fechamento a partir de Forecast.
- Perdida pode ser aplicada de qualquer etapa não final e exige motivo de perda.
- Campos em branco nos dados fictícios são intencionais.
