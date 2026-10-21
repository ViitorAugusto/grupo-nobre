# Dados do case (fatos do enunciado)

Transcrição dos dados fictícios do enunciado. **Aqui só entram fatos.** As interpretações e decisões sobre estes dados estão em [premissas.md](../decisoes/premissas.md) (D1–D4) e devem ser aplicadas no seed a partir de lá.

- **Data de referência dos dados:** 15/10/2026.
- **Ano:** o enunciado traz só dia e mês. Todas as datas são de 2026.
- **Moeda:** reais (R$).
- **Campos em branco são intencionais** e fazem parte do problema. No seed, ficam vazios (nulos), nunca preenchidos com valores inventados.

## Tabela

| Código | Empresa | Brinde | Qtd | Valor estimado (R$) | Vendedor | Último contato | Validade da proposta | Data do evento | Etapa |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- |
| OPP-2001 | Tech Alpha Ltda | Caneca personalizada | 300 | 4.500,00 | Ana | 14/10/2026 | *(ver nota)* | *(ver nota)* | Primeiro Contato |
| OPP-2002 | Construtora Horizonte | Kit escritório | 120 | 9.800,00 | Bruno | 06/10/2026 | 13/10/2026 | 25/10/2026 | Apresentação de Orçamento |
| OPP-2003 | Clínica Vida | Squeeze personalizado | 500 | 7.200,00 | Ana | 13/10/2026 | 20/10/2026 | 18/10/2026 | Follow-up |
| OPP-2004 | Agência Pulso | Camiseta estampada | 80 | 3.900,00 | Carla | 02/10/2026 | 10/10/2026 | 05/11/2026 | Follow-up |
| OPP-2005 | Banco Norte | Agenda executiva | 1.000 | 38.000,00 | Bruno | 15/10/2026 | 22/10/2026 | 12/12/2026 | Forecast |
| OPP-2006 | Escola Saber | Mochila infantil | 250 | 11.500,00 | Carla | 09/10/2026 | 16/10/2026 | 17/10/2026 | Fechamento |
| OPP-2007 | Padaria do Bairro | Caneta promocional | 50 | 350,00 | Ana | 01/10/2026 | 08/10/2026 | 20/10/2026 | Perdida |

## Notas sobre o enunciado

- **OPP-2001:** o enunciado traz **uma única data (30/11)** além do último contato, sem deixar claro se é validade ou evento. O fato é só esse. A interpretação está na **D1**: 30/11/2026 é a data do evento e a validade fica vazia.
- **OPP-2007:** o enunciado **não informa motivo de perda**. O tratamento está na **D2**: motivo "Não registrado (dado legado)".
- Cada oportunidade tem **1 brinde** no enunciado. O modelo aceita vários itens (ADR-004). No seed, cada oportunidade recebe 1 item com o brinde e a quantidade acima.
- O enunciado não traz outros campos (CNPJ, contato do cliente, telefone etc.). Não inventar.
- O enunciado não traz histórico de mudanças de etapa. O seed não deve fabricar histórico passado (pode, no máximo, registrar a carga inicial, se o Tech Lead achar útil, deixando claro que é carga do seed).

## Vendedores

Ana, Bruno e Carla. O enunciado traz apenas o primeiro nome.
